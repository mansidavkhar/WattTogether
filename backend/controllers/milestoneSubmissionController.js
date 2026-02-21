const ethers = require('ethers');
const Milestone = require('../models/milestoneModel');
const Campaign = require('../models/campaignModel');
const { uploadMultipleFiles, uploadJSONToIPFS, getGatewayURL, isValidCID } = require('../services/ipfsService');

// Load the full artifact from Hardhat compilation
const projectEscrowArtifact = require('../artifacts/contracts/ProjectEscrowV6.sol/ProjectEscrowV6.json');
const projectEscrowABI = projectEscrowArtifact.abi;

// Debug: Verify ABI loaded correctly
console.log('🔍 ABI Debug:', {
  artifactType: typeof projectEscrowArtifact,
  hasAbi: !!projectEscrowArtifact.abi,
  isArray: Array.isArray(projectEscrowABI),
  length: projectEscrowABI?.length,
  hasRequestMilestone: projectEscrowABI?.some(f => f.name === 'requestMilestone'),
  firstElement: projectEscrowABI?.[0]?.type,
  requestMilestoneSignature: projectEscrowABI?.find(f => f.name === 'requestMilestone')
});

// Polygon Amoy configuration
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC || 'https://polygon-amoy.g.alchemy.com/v2/demo';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY; // Use DEPLOYER key (same as contract deployment)

// Exchange rate for display
const INR_TO_USDC_RATE = 0.012;

/**
 * Submit a spending request/milestone
 */
const submitMilestone = async (req, res) => {
  try {
    const { campaignId, amount, description } = req.body;
    const creatorId = req.member._id;
    const uploadedFiles = req.files || [];

    console.log(`\n📋 Milestone submission: ${amount} INR for "${description}"`);
    console.log(`📎 Uploaded ${uploadedFiles.length} proof documents`);

    // Validate
    if (!campaignId || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check authorization
    if (campaign.owner.toString() !== creatorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only campaign creator can submit milestones'
      });
    }

    // Check campaign status - must be funded
    if (campaign.status !== 'funded') {
      return res.status(400).json({
        success: false,
        message: 'Campaign must be funded before creating milestones'
      });
    }

    // Upload proof documents to IPFS
    let ipfsHash = '';
    let proofUrl = '';
    
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log(`📤 Uploading ${uploadedFiles.length} files to IPFS...`);
      
      // Upload files to IPFS and get metadata CID
      ipfsHash = await uploadMultipleFiles(uploadedFiles, {
        campaignId: campaignId,
        description: description
      });
      
      proofUrl = getGatewayURL(ipfsHash);
      console.log(`✅ Files uploaded to IPFS: ${ipfsHash}`);
      console.log(`   Gateway URL: ${proofUrl}`);
      
    } else {
      // No files uploaded, create text-only proof
      console.log('📝 No files uploaded, creating text-only proof...');
      const textProof = {
        description,
        campaignId,
        timestamp: Date.now()
      };
      
      ipfsHash = await uploadJSONToIPFS(textProof, {
        campaignId: campaignId,
        type: 'text-proof'
      });
      
      proofUrl = getGatewayURL(ipfsHash);
      console.log(`✅ Text proof uploaded to IPFS: ${ipfsHash}`);
    }
    
    // Validate IPFS CID
    if (!isValidCID(ipfsHash)) {
      return res.status(500).json({
        success: false,
        message: 'Invalid IPFS CID generated. Please try again.'
      });
    }

    // Create milestone record
    const milestone = new Milestone({
      campaignId,
      creatorId,
      amount,
      description,
      status: 'pending',
      proofHash: ipfsHash,
      proofUrl: proofUrl,
      proofDocuments: uploadedFiles.map(file => ({
        filename: file.originalname,
        path: file.path,
        uploadedAt: new Date()
      })),
      createdAt: new Date()
    });

    await milestone.save();
    console.log(`✅ Milestone created in DB: ${milestone._id}`);

    // Convert INR to USDC (1 INR = 0.012 USDC, 6 decimals)
    const INR_TO_USDC_RATE = 0.012;
    const usdcAmount = amount * INR_TO_USDC_RATE;
    const usdcAmountWei = ethers.parseUnits(usdcAmount.toFixed(6), 6);
    
    console.log(`   Amount: ${amount} INR = ${usdcAmount.toFixed(6)} USDC (${usdcAmountWei.toString()} wei)`);
    console.log(`   Description length: ${description.length} chars`);
    console.log(`   IPFS Hash: ${ipfsHash}`);
    
    // Set up provider and contract instance with relayer wallet
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    console.log('🔧 Contract caller (relayer):', relayer.address);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );
    
    console.log(`🔗 Submitting milestone to V6 contract...`);
    
    // V6 contract uses requestMilestone(amount, description, ipfsHash)
    // V6 contract uses requestMilestone(amount, description, ipfsHash)
    const txResponse = await escrowContract.requestMilestone(
      usdcAmountWei, 
      description,
      ipfsHash
    );
    
    console.log('📤 Transaction sent:', txResponse.hash);
    const txReceipt = await txResponse.wait();
    console.log(`✅ Milestone added to contract in block ${txReceipt.blockNumber}`);

    // Get milestone count from contract
    const milestoneCount = await escrowContract.getMilestoneCount();
    const onChainId = milestoneCount - 1n; // Latest milestone ID

    milestone.onChainId = onChainId.toString();
    milestone.txHash = txReceipt.transactionHash;
    await milestone.save();

    // Send email notifications to all donors
    try {
      const Donation = require('../models/donationModel');
      const Member = require('../models/memberModel');
      const { sendMilestoneNotification } = require('../services/emailService');

      // Get all unique donors for this campaign
      const donations = await Donation.find({ campaign: campaignId }).populate('member', 'email');
      const donorEmails = [...new Set(donations.map(d => d.member?.email).filter(Boolean))];

      console.log(`📧 Sending notifications to ${donorEmails.length} donors...`);
      await sendMilestoneNotification(donorEmails, campaign.title, description, amount);
    } catch (emailError) {
      console.warn('⚠️ Email notification failed:', emailError.message);
      // Don't fail the milestone creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Milestone submitted for voting',
      data: {
        id: milestone._id,
        onChainId: onChainId.toString(),
        amount,
        description,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Milestone submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all milestones for a campaign
 */
const getCampaignMilestones = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const milestones = await Milestone.find({ campaignId })
      .select('amount description status votes upvotes downvotes votingEndDate onChainId proofDocuments proofHash proofUrl releaseTxHash releasedAt')
      .sort({ createdAt: -1 });

    // Get on-chain data for each milestone
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      provider
    );

    // Get total funds raised from contract (V6 only)
    let totalFundsRaisedUSDC = 0;
    try {
      const totalRaised = await escrowContract.totalFundsRaised();
      totalFundsRaisedUSDC = Number(totalRaised) / 1e6; // Convert from 6 decimals
      console.log(`💰 Total funds raised on-chain: ${totalFundsRaisedUSDC} USDC`);
    } catch (error) {
      // Older contracts (V5 and below) don't have totalFundsRaised(), use DB value
      totalFundsRaisedUSDC = Number(campaign.amountRaised) || 0;
      console.log(`💰 Using DB amountRaised: ${totalFundsRaisedUSDC} USDC (contract is V5 or older)`);
    }

    const enrichedMilestones = await Promise.all(milestones.map(async (milestone) => {
      const milestoneObj = milestone.toObject();
      
      // Add campaign's total raised for display (convert USDC to INR)
      milestoneObj.campaignTotalRaised = Math.round(totalFundsRaisedUSDC / INR_TO_USDC_RATE);
      
      // Check if current user has already vetoed this milestone
      const hasVetoed = milestone.vetoVoters?.some(voter => 
        voter.voterId?.toString() === req.member._id.toString()
      ) || false;
      milestoneObj.hasVetoed = hasVetoed;
      
      if (milestone.onChainId !== undefined) {
        try {
          const onChainData = await escrowContract.getMilestone(milestone.onChainId);
          milestoneObj.releaseableAt = new Date(Number(onChainData.releaseableAt) * 1000).toISOString();
          milestoneObj.vetoWeight = Number(onChainData.vetoWeight) / 1e6; // Convert from 6 decimals
          milestoneObj.totalRaised = totalFundsRaisedUSDC; // Use on-chain value
          
          // CRITICAL: Convert BigInt to Number for comparison
          const onChainStatusNum = Number(onChainData.status);
          
          console.log(`🔍 Milestone ${milestone._id.toString().slice(-4)} - DB: ${milestoneObj.status}, OnChain: ${onChainStatusNum}, Veto: ${milestoneObj.vetoWeight}, Total: ${milestoneObj.totalRaised}`);
          
          // If DB has releaseTxHash, trust DB status (blockchain might have indexing delay)
          if (milestoneObj.releaseTxHash) {
            milestoneObj.status = 'released';
            console.log(`✅ Using DB status 'released' (has txHash: ${milestoneObj.releaseTxHash.slice(0, 10)}...)`);
          } else {
            // Otherwise, update status based on on-chain data (0=PENDING, 1=DISPUTED, 2=RELEASED, 3=CANCELLED)
            if (onChainStatusNum === 2) {
              milestoneObj.status = 'released';
            } else if (onChainStatusNum === 1) {
              milestoneObj.status = 'disputed';
              console.log(`⚠️  Status updated to DISPUTED (onChain: ${onChainStatusNum})`);
            } else if (onChainStatusNum === 3) {
              milestoneObj.status = 'cancelled';
            } else {
              milestoneObj.status = 'pending';
            }
            
            // Update DB status if it changed
            if (milestone.status !== milestoneObj.status) {
              milestone.status = milestoneObj.status;
              await milestone.save();
              console.log(`💾 Updated DB status to: ${milestoneObj.status}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch on-chain data for milestone ${milestone._id}:`, error.message);
        }
      }
      
      return milestoneObj;
    }));

    // Get voting power (only for donors)
    const Donation = require('../models/donationModel');
    
    const userDonations = await Donation.findOne({
      campaign: campaignId,
      member: req.member._id
    });

    const hasVotingPower = !!userDonations;

    res.json({
      success: true,
      data: {
        milestones: enrichedMilestones,
        userHasVotingPower: hasVotingPower
      }
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestones'
    });
  }
};

/**
 * Vote on a milestone (upvote/downvote)
 */
const voteOnMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    const voterId = req.member._id;

    if (!['up', 'down'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be "up" or "down"'
      });
    }

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Check if user has voting power (must be a donor)
    const Donation = require('../models/donationModel');
    const Campaign = require('../models/campaignModel');
    
    const donation = await Donation.findOne({
      campaign: milestone.campaignId,
      member: voterId
    });

    if (!donation) {
      return res.status(403).json({
        success: false,
        message: 'Only donors can vote on milestones'
      });
    }

    // Get voter's donation amount for weighted voting
    const voterDonationAmount = donation.amount;

    // Check if already voted
    if (milestone.votes && milestone.votes.some(v => v.voterId.toString() === voterId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this milestone'
      });
    }

    // Get campaign to calculate total donations (voting power base)
    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const totalRaised = campaign.amountRaisedINR || 0;
    if (totalRaised === 0) {
      return res.status(400).json({
        success: false,
        message: 'No donations recorded for this campaign'
      });
    }

    // Calculate voting power as percentage
    const votingPower = voterDonationAmount / totalRaised;

    // Record vote with voting power
    if (!milestone.votes) milestone.votes = [];
    milestone.votes.push({
      voterId,
      vote,
      votingPower,
      donationAmount: voterDonationAmount,
      timestamp: new Date()
    });

    // Calculate weighted votes
    let totalUpvotePower = 0;
    let totalDownvotePower = 0;

    milestone.votes.forEach(v => {
      if (v.vote === 'up') {
        totalUpvotePower += v.votingPower;
      } else {
        totalDownvotePower += v.votingPower;
      }
    });

    // Update simple vote counts for display
    milestone.upvotes = milestone.votes.filter(v => v.vote === 'up').length;
    milestone.downvotes = milestone.votes.filter(v => v.vote === 'down').length;

    // Check if milestone should pass (>50% weighted approval)
    const approvalRate = totalUpvotePower;

    let milestoneStatus = milestone.status;
    if (approvalRate > 0.5) {
      milestoneStatus = 'approved';
      milestone.status = 'approved';
    } else if (totalDownvotePower > 0.5) {
      milestoneStatus = 'rejected';
      milestone.status = 'rejected';
    }

    await milestone.save();

    console.log(`📊 Vote recorded on milestone ${milestoneId}:`);
    console.log(`   Voter: ${voterId}`);
    console.log(`   Vote: ${vote}`);
    console.log(`   Voting Power: ${(votingPower * 100).toFixed(2)}% (${voterDonationAmount} INR / ${totalRaised} INR)`);
    console.log(`   Weighted Approval: ${(approvalRate * 100).toFixed(2)}%`);
    console.log(`   Status: ${milestoneStatus}`);

    res.json({
      success: true,
      message: 'Vote recorded',
      data: {
        milestoneId,
        status: milestoneStatus,
        upvotes: milestone.upvotes,
        downvotes: milestone.downvotes,
        yourVotingPower: (votingPower * 100).toFixed(2) + '%',
        weightedApprovalRate: (approvalRate * 100).toFixed(2) + '%',
        totalRaised: totalRaised + ' INR'
      }
    });

  } catch (error) {
    console.error('Error voting on milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
};

/**
 * Release funds for an approved milestone
 */
const releaseMilestoneFunds = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = req.member._id;

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Check if user is campaign creator
    const campaign = await Campaign.findById(milestone.campaignId);
    if (campaign.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only campaign creator can release funds'
      });
    }

    // V6 OPTIMISTIC GOVERNANCE: Milestones are in 'pending' status
    // They are automatically approved after cooling period if not vetoed
    // Check milestone can be released (not cancelled, not disputed, not already released)
    if (milestone.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Milestone has been cancelled'
      });
    }

    if (milestone.status === 'disputed') {
      return res.status(400).json({
        success: false,
        message: 'Milestone is disputed. Guardian must resolve first.'
      });
    }

    if (milestone.status === 'released') {
      return res.status(400).json({
        success: false,
        message: 'Milestone funds have already been released'
      });
    }

    // Release funds from escrow using V6 optimistic release
    if (!DEPLOYER_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: DEPLOYER_PRIVATE_KEY not set'
      });
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );

    // Convert INR to USDC for display (1 INR = 0.012 USDC)
    const INR_TO_USDC_RATE = 0.012;
    const usdcAmount = milestone.amount * INR_TO_USDC_RATE;

    // Convert onChainId from string to number
    const milestoneIdNum = parseInt(milestone.onChainId);
    
    console.log(`💰 Releasing milestone funds (V5 Optimistic)...`);
    console.log(`   Amount: ${milestone.amount} INR (${usdcAmount.toFixed(6)} USDC)`);
    console.log(`   To beneficiary wallet: ${campaign.beneficiaryAddress}`);
    console.log(`   Milestone ID: ${milestoneIdNum}`);
    
    // Check milestone status on-chain
    try {
      const milestoneData = await escrowContract.getMilestone(milestoneIdNum);
      const status = Number(milestoneData[5]); // MilestoneStatus enum
      const releaseableAt = Number(milestoneData[4]);
      const nowTimestamp = Math.floor(Date.now() / 1000);
      
      console.log(`   Milestone status on-chain:`);
      console.log(`   - Amount: ${ethers.formatUnits(milestoneData[0], 6)} USDC`);
      console.log(`   - Status: ${['PENDING_RELEASE', 'DISPUTED', 'RELEASED', 'CANCELLED'][status]}`);
      console.log(`   - Releaseable at: ${new Date(releaseableAt * 1000).toISOString()}`);
      console.log(`   - Veto weight: ${ethers.formatUnits(milestoneData[6], 6)} USDC`);
      
      if (status === 2) { // RELEASED
        return res.status(400).json({
          success: false,
          message: 'Milestone funds have already been released'
        });
      }
      
      if (status === 1) { // DISPUTED
        return res.status(400).json({
          success: false,
          message: 'Milestone is disputed. Use resumeMilestone or cancelMilestone first.'
        });
      }
      
      if (status === 3) { // CANCELLED
        return res.status(400).json({
          success: false,
          message: 'Milestone has been cancelled'
        });
      }
      
      if (nowTimestamp < releaseableAt) {
        const timeLeft = releaseableAt - nowTimestamp;
        const hoursLeft = Math.floor(timeLeft / 3600);
        const minutesLeft = Math.floor((timeLeft % 3600) / 60);
        
        return res.status(400).json({
          success: false,
          message: `Cannot release yet. 48-hour cooling period ends in ${hoursLeft}h ${minutesLeft}m`,
          releaseableAt: new Date(releaseableAt * 1000).toISOString()
        });
      }
    } catch (checkError) {
      console.error('⚠️ Error checking milestone status:', checkError.message);
      // Continue anyway - the contract will revert if conditions aren't met
    }
    
    // V5 uses releaseMilestone after 48-hour cooling period
    console.log(`📤 Calling releaseMilestone(${milestoneIdNum})...`);
    const txResponse = await escrowContract.releaseMilestone(
      milestoneIdNum,
      { gasLimit: 300000 }
    );

    const txReceipt = await txResponse.wait();
    console.log(`✅ Funds released in block ${txReceipt.blockNumber}`);
    console.log(`   Transaction: ${txReceipt.hash}`);
    console.log(`   ${usdcAmount.toFixed(6)} USDC transferred to beneficiary`);

    milestone.status = 'released';
    milestone.releasedAt = new Date();
    milestone.releaseTxHash = txReceipt.hash;
    await milestone.save();
    
    console.log('💾 DB Updated:', {
      id: milestone._id,
      status: milestone.status,
      releaseTxHash: milestone.releaseTxHash,
      releasedAt: milestone.releasedAt
    });

    res.json({
      success: true,
      message: 'Funds released successfully',
      data: {
        milestoneId,
        amountINR: milestone.amount,
        amountUSDC: usdcAmount.toFixed(6),
        txHash: txReceipt.hash,
        status: 'released',
        releasedAt: milestone.releasedAt
      }
    });

  } catch (error) {
    console.error('Error releasing milestone funds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release funds',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// V5 GUARDIAN FUNCTIONS (Admin Only)
// ═══════════════════════════════════════════════════════════════

/**
 * Resume disputed milestone (false alarm)
 * Restarts 48-hour cooling period
 */
const resumeMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );

    const milestoneIdNum = parseInt(milestone.onChainId);
    
    console.log(`🔄 Resuming milestone ${milestoneIdNum} (dispute was false alarm)...`);
    const txResponse = await escrowContract.resumeMilestone(milestoneIdNum, { gasLimit: 200000 });
    const txReceipt = await txResponse.wait();

    milestone.status = 'pending';
    await milestone.save();

    res.json({
      success: true,
      message: 'Milestone resumed. 48-hour cooling period restarted.',
      txHash: txReceipt.hash
    });

  } catch (error) {
    console.error('Error resuming milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cancel disputed milestone (bad receipt)
 * Funds return to pool
 */
const cancelMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );

    const milestoneIdNum = parseInt(milestone.onChainId);
    
    console.log(`❌ Cancelling milestone ${milestoneIdNum} (bad proof/receipt)...`);
    const txResponse = await escrowContract.cancelMilestone(milestoneIdNum, { gasLimit: 200000 });
    const txReceipt = await txResponse.wait();

    milestone.status = 'cancelled';
    await milestone.save();

    res.json({
      success: true,
      message: 'Milestone cancelled. Funds returned to pool.',
      txHash: txReceipt.hash
    });

  } catch (error) {
    console.error('Error cancelling milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Kill switch - cancel entire project (scam detected)
 * Enables donor refunds
 */
const cancelProject = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Check if already cancelled in database
    if (campaign.status === 'cancelled') {
      console.log(`   ℹ️  Campaign already cancelled in database`);
      return res.json({
        success: true,
        message: 'Project is already cancelled. Donors can claim refunds.',
        alreadyCancelled: true
      });
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const guardian = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      guardian
    );

    console.log(`🚨 KILL SWITCH ACTIVATED for campaign ${campaignId}...`);
    console.log(`   This will enable donor refunds`);
    console.log(`   📋 Contract address: ${campaign.escrowContractAddress}`);
    console.log(`   🔑 Guardian address: ${guardian.address}`);
    console.log(`   📝 Has cancelProject function: ${typeof escrowContract.cancelProject === 'function'}`);
    
    // Check if function exists in ABI
    if (typeof escrowContract.cancelProject !== 'function') {
      throw new Error('cancelProject function not found in contract ABI. Contract might be V5 or older.');
    }
    
    // Check current campaign state on-chain
    try {
      const currentState = await escrowContract.campaignState();
      const stateNames = ['FUNDING', 'ACTIVE', 'REFUND_ONLY'];
      console.log(`   📊 Current on-chain state: ${stateNames[currentState]} (${currentState})`);
      
      if (currentState === 2) { // REFUND_ONLY
        console.log('   ℹ️  Project already in REFUND_ONLY state on-chain');
        
        // Sync database
        campaign.status = 'cancelled';
        await campaign.save();
        
        return res.json({
          success: true,
          message: 'Project was already cancelled. Donors can claim refunds.',
          alreadyCancelled: true
        });
      }
    } catch (stateError) {
      console.log('   ⚠️  Could not check campaign state:', stateError.message);
    }
    
    // Verify guardian address matches contract's guardian
    try {
      const contractGuardian = await escrowContract.guardian();
      console.log(`   ✅ Contract guardian: ${contractGuardian}`);
      
      if (contractGuardian.toLowerCase() !== guardian.address.toLowerCase()) {
        throw new Error(`Guardian mismatch! Contract expects: ${contractGuardian}, but using: ${guardian.address}`);
      }
    } catch (guardianError) {
      console.error(`   ⚠️  Could not verify guardian:`, guardianError.message);
    }
    
    // Encode the function call manually to debug
    const encodedData = escrowContract.interface.encodeFunctionData('cancelProject', []);
    console.log(`   📤 Encoded data: ${encodedData}`);
    
    // Try to simulate the call first to get the revert reason
    try {
      await escrowContract.cancelProject.staticCall();
      console.log('   ✅ Static call successful, proceeding with transaction...');
    } catch (simulateError) {
      console.error('   ❌ Static call failed:', simulateError);
      
      // Try to decode the revert reason
      if (simulateError.data) {
        try {
          const decodedError = escrowContract.interface.parseError(simulateError.data);
          console.error(`   📝 Decoded error: ${decodedError?.name || 'Unknown'}`);
          throw new Error(`Contract revert: ${decodedError?.name || simulateError.message}`);
        } catch (decodeErr) {
          console.error('   ⚠️  Could not decode error');
        }
      }
      
      // Check common revert reasons
      if (simulateError.message.includes('Already cancelled')) {
        console.log('   ℹ️  Project already cancelled on-chain, syncing database...');
        
        // Update database to match contract state
        campaign.status = 'cancelled';
        await campaign.save();
        
        return res.json({
          success: true,
          message: 'Project was already cancelled. Donors can claim refunds.',
          alreadyCancelled: true
        });
      }
      
      throw new Error(`Contract rejected: ${simulateError.message || 'Unknown reason'}`);
    }
    
    const txResponse = await escrowContract.cancelProject({ gasLimit: 200000 });
    const txReceipt = await txResponse.wait();

    campaign.status = 'cancelled';
    await campaign.save();

    console.log(`\u2705 Project cancelled successfully: ${txReceipt.hash}`);

    res.json({
      success: true,
      message: '\ud83d\udea8 Project cancelled! All donors can now claim pro-rata refunds.',
      txHash: txReceipt.hash,
      campaignStatus: 'cancelled'
    });

  } catch (error) {
    console.error('Error cancelling project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Vote on document authenticity (thumbs up/down)
 * Only donors with voting power can vote
 */
const voteOnDocument = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { documentIndex, voteType } = req.body;
    const voterId = req.member._id;

    console.log(`\n👍👎 Document vote by member ${voterId.toString().slice(-4)}`);
    console.log(`   Milestone: ${milestoneId}`);
    console.log(`   Document Index: ${documentIndex}`);
    console.log(`   Vote: ${voteType}`);

    // Validate inputs
    if (documentIndex === undefined || !['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote data. Provide documentIndex and voteType (up/down)'
      });
    }

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Check if document exists
    if (!milestone.proofDocuments || !milestone.proofDocuments[documentIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Get campaign to check voting power
    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if voter is creator
    const isCreator = campaign.owner.toString() === voterId.toString();
    
    // Check if voter has donated to this campaign (use Donation model for accurate check)
    const Donation = require('../models/donationModel');
    const userDonation = await Donation.findOne({
      campaign: milestone.campaignId,
      member: voterId
    });
    
    const hasDonated = !!userDonation;
    
    console.log(`   🔍 Authorization check - IsCreator: ${isCreator}, HasDonated: ${hasDonated}`);
    
    if (!hasDonated && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Only donors and creator can vote on documents'
      });
    }

    const document = milestone.proofDocuments[documentIndex];
    
    // Initialize arrays if they don't exist
    if (!document.upvotes) document.upvotes = [];
    if (!document.downvotes) document.downvotes = [];

    // Remove previous votes from both arrays (user can change their vote)
    document.upvotes = document.upvotes.filter(id => id.toString() !== voterId.toString());
    document.downvotes = document.downvotes.filter(id => id.toString() !== voterId.toString());

    // Add new vote
    if (voteType === 'up') {
      document.upvotes.push(voterId);
      console.log(`   ✅ Upvote recorded`);
    } else {
      document.downvotes.push(voterId);
      console.log(`   ❌ Downvote recorded`);
    }

    // Mark the nested document as modified (required for Mongoose to detect changes)
    milestone.markModified('proofDocuments');
    await milestone.save();

    console.log(`   📊 New vote counts - Up: ${document.upvotes.length}, Down: ${document.downvotes.length}`);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        documentIndex,
        upvotes: document.upvotes.length,
        downvotes: document.downvotes.length
      }
    });

  } catch (error) {
    console.error('Error voting on document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  submitMilestone,
  getCampaignMilestones,
  voteOnMilestone,
  voteOnDocument,
  releaseMilestoneFunds,
  resumeMilestone,
  cancelMilestone,
  cancelProject
};
