const ethers = require('ethers');
const Donation = require('../models/donationModel');
const Campaign = require('../models/campaignModel');
const Member = require('../models/memberModel');
const projectEscrowABI = require('../contracts/artifacts/ProjectEscrowV2.json').abi;

// Polygon Amoy configuration
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC || 'https://polygon-amoy.g.alchemy.com/v2/demo';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS;

// Exchange rate (INR to native token, hardcoded for testnet)
// For testnet: 1 INR = 0.00001 ETH (100,000 INR = 1 ETH)
const INR_TO_WEI_RATE = 100000; // 1 INR = 1/100000 of native token for testnet simulation

// Validate relayer configuration
if (!RELAYER_PRIVATE_KEY) {
  console.warn('⚠️  WARNING: RELAYER_PRIVATE_KEY not set in environment variables');
}
if (!RELAYER_ADDRESS) {
  console.warn('⚠️  WARNING: RELAYER_ADDRESS not set in environment variables');
}

/**
 * Submit a donation (fiat-based)
 * User pays in INR, backend acts as relayer to deposit ETH into escrow
 */
const submitDonation = async (req, res) => {
  try {
    const { campaignId, inrAmount } = req.body;
    const donorId = req.member._id;
    const donorEmail = req.member.email;
    const donorWallet = req.member.walletAddress;

    console.log(`\n📝 Donation request: ${inrAmount} INR to campaign ${campaignId}`);
    console.log(`   Donor: ${donorEmail} (${donorWallet})`);

    // Validate input
    if (!campaignId || !inrAmount || inrAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID or amount'
      });
    }

    // Validate donor wallet
    if (!donorWallet) {
      return res.status(400).json({
        success: false,
        message: 'Your wallet address is not set. Please complete your profile.'
      });
    }

    // Get campaign details
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    console.log(`   Campaign: ${campaign.title} (status: ${campaign.status})`);

    // GOVERNANCE CONSTRAINT: Prevent creators from donating to their own campaigns
    // This ensures 100% of voting power remains with independent backers
    const campaignOwner = await Member.findById(campaign.owner);
    if (campaignOwner && campaignOwner.walletAddress && 
        donorWallet.toLowerCase() === campaignOwner.walletAddress.toLowerCase()) {
      console.log(`❌ Creator attempted to donate to own campaign`);
      return res.status(403).json({
        success: false,
        message: 'Campaign creators cannot donate to their own campaigns to prevent governance manipulation.'
      });
    }

    // Check if campaign is still active and accepting donations
    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Campaign is not accepting donations (status: ${campaign.status})`
      });
    }

    // Check if funding deadline has passed
    if (campaign.fundingDeadline && new Date() > new Date(campaign.fundingDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Campaign funding deadline has passed'
      });
    }

    // Convert INR to Wei (simulated fiat-to-crypto)
    const ethAmount = inrAmount / INR_TO_WEI_RATE;
    const weiAmount = ethers.parseEther(ethAmount.toString());

    console.log(`💱 Conversion: ${inrAmount} INR ≈ ${ethAmount} ETH (${weiAmount.toString()} Wei)`);

    // Validate relayer setup
    if (!RELAYER_PRIVATE_KEY) {
      console.error('❌ Relayer private key not configured');
      return res.status(500).json({
        success: false,
        message: 'Donation service is not properly configured'
      });
    }

    // Validate escrow contract address
    if (!campaign.escrowContractAddress) {
      console.error(`❌ Campaign ${campaignId} missing escrow contract address`);
      console.log(`   Campaign data:`, {
        title: campaign.title,
        status: campaign.status,
        escrowContractAddress: campaign.escrowContractAddress
      });
      
      return res.status(400).json({
        success: false,
        message: 'This campaign is not properly set up for donations yet. Please contact support or try another campaign.'
      });
    }

    // Get escrow contract instance
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    
    console.log(`\n🔑 Relayer Information:`);
    console.log(`   Address: ${relayer.address}`);
    console.log(`   Expected: ${RELAYER_ADDRESS}`);
    
    // Check relayer balance
    const relayerBalance = await provider.getBalance(relayer.address);
    const relayerBalanceEth = ethers.formatEther(relayerBalance);
    console.log(`💰 Relayer balance: ${relayerBalanceEth} ETH (${relayerBalance.toString()} Wei)`);
    
    if (relayerBalance < weiAmount) {
      console.error(`❌ Insufficient relayer funds. Has: ${relayerBalanceEth} ETH, Needs: ${ethAmount} ETH`);
      return res.status(400).json({
        success: false,
        message: `Insufficient funds in relayer account. Has: ${relayerBalanceEth} ETH, needs: ${ethAmount} ETH`
      });
    }
    
    // Verify escrow contract address
    const escrowCode = await provider.getCode(campaign.escrowContractAddress);
    if (escrowCode === '0x') {
      console.error(`❌ Escrow contract not found at ${campaign.escrowContractAddress}`);
      return res.status(400).json({
        success: false,
        message: 'Escrow contract not found. Campaign may not be properly initialized.'
      });
    }
    
    console.log(`✅ Escrow contract exists at ${campaign.escrowContractAddress}`);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );

    // Step 1: Backend (relayer) deposits funds via direct ETH send
    console.log(`\n🔗 Attempting to deposit funds...`);
    console.log(`   Escrow: ${campaign.escrowContractAddress}`);
    console.log(`   Relayer: ${relayer.address}`);
    console.log(`   Donor: ${donorWallet}`);
    console.log(`   Amount: ${ethAmount} ETH (${weiAmount.toString()} Wei)`);

    let txResponse;
    let txType = 'direct-send';
    
    // Skip depositForDonor - it has onlyRelayer checks that are too strict
    // Instead, send ETH directly to the contract's receive() function
    try {
      console.log(`   📡 Sending ETH directly to escrow contract (via receive function)...`);
      txResponse = await relayer.sendTransaction({
        to: campaign.escrowContractAddress,
        value: weiAmount,
        gasLimit: 300000,
        data: '0x' // Empty data to trigger receive() function
      });
      console.log(`✅ Transaction sent: ${txResponse.hash}`);
    } catch (sendError) {
      console.error('❌ Transaction send failed:', {
        code: sendError.code,
        message: sendError.message
      });
      
      return res.status(400).json({
        success: false,
        message: `Failed to send donation: ${sendError.message.substring(0, 100)}`
      });
    }

    // Wait for confirmation
    let txReceipt;
    try {
      console.log(`   ⏳ Waiting for transaction confirmation...`);
      txReceipt = await txResponse.wait(1);
      
      if (!txReceipt) {
        throw new Error('Transaction receipt is null after waiting');
      }
      
      console.log(`✅ Transaction confirmed in block ${txReceipt.blockNumber}`);
      console.log(`   Status: ${txReceipt.status === 1 ? 'SUCCESS ✅' : 'FAILED ❌'}`);
      console.log(`   Gas used: ${txReceipt.gasUsed.toString()}`);
      console.log(`   Hash: ${txReceipt.hash}`);
      
      // Check if transaction actually succeeded
      if (txReceipt.status === 0) {
        console.error('❌ Transaction reverted on-chain (status: 0)');
        console.error('   The escrow contract rejected the ETH transfer');
        console.error('   Possible causes:');
        console.error('     - Campaign has ended or is closed');
        console.error('     - Contract is paused or in error state');
        console.error('     - Insufficient gas for contract operations');
        
        return res.status(400).json({
          success: false,
          message: `Escrow contract rejected the donation. Please verify the campaign is still active and try again.`
        });
      }
    } catch (waitError) {
      console.error('❌ Transaction confirmation error:', {
        code: waitError.code,
        message: waitError.message
      });
      
      // Check if transaction was actually mined despite the error
      if (txResponse?.hash) {
        try {
          const receipt = await provider.getTransactionReceipt(txResponse.hash);
          if (receipt) {
            console.log(`✅ Transaction was mined despite error: block ${receipt.blockNumber}`);
            if (receipt.status === 1) {
              console.log(`✅ Transaction succeeded!`);
              // Continue with success path below
              txReceipt = receipt;
            } else {
              console.error(`❌ Transaction reverted in block ${receipt.blockNumber}`);
              return res.status(400).json({
                success: false,
                message: 'Transaction reverted. Please try again.'
              });
            }
          }
        } catch (e) {
          console.warn('Could not fetch transaction receipt:', e.message);
        }
      }
      
      if (!txReceipt) {
        return res.status(400).json({
          success: false,
          message: 'Transaction confirmation timeout. Please check your wallet history.'
        });
      }
    }

    // Step 2: Check if this is a first-time backer BEFORE saving the donation
    console.log(`🔎 Checking for existing donations from this donor...`);
    console.log(`   Donor ID: ${donorId}`);
    console.log(`   Campaign ID: ${campaignId}`);
    
    const existingDonation = await Donation.findOne({ 
      member: donorId, 
      campaign: campaignId
    });
    
    const isFirstTimeBacker = !existingDonation;
    console.log(`   Existing donation found: ${!!existingDonation}`);
    console.log(`   Is first-time backer: ${isFirstTimeBacker}`);

    // Now save the donation record in database
    const donation = new Donation({
      member: donorId,              // Model expects 'member' not 'donorId'
      campaign: campaignId,          // Model expects 'campaign' not 'campaignId'
      amount: inrAmount,             // Model expects 'amount' (INR amount)
      currency: 'INR',               // Model expects 'currency' field
      txHash: txReceipt.hash,        // Receipt uses 'hash' not 'transactionHash'
      date: new Date()
    });

    await donation.save();
    console.log(`💾 Donation record saved: ${donation._id}`);

    // Step 3: Update campaign with new donation amount and increment backers count
    console.log(`🔍 Before update - Campaign backersCount: ${campaign.backersCount}`);
    
    const amountRaisedBefore = campaign.amountRaisedINR || 0;
    campaign.amountRaisedINR = (amountRaisedBefore || 0) + inrAmount;
    
    // Increment backers count only for first-time backers
    if (isFirstTimeBacker) {
      // First time backing this campaign
      const oldCount = campaign.backersCount || 0;
      campaign.backersCount = oldCount + 1;
      console.log(`👥 New backer! Updated from ${oldCount} to ${campaign.backersCount}`);
    } else {
      console.log(`👤 Repeat backer - count unchanged at ${campaign.backersCount || 0}`);
    }

    // Check if funding goal reached
    const fundingGoal = campaign.fundingGoalINR || campaign.amount || 0;
    if (campaign.amountRaisedINR >= fundingGoal) {
      console.log(`🎉 Campaign reached funding goal!`);
      campaign.status = 'funded';
      campaign.fundingCompletedAt = new Date();
    }

    await campaign.save();
    console.log(`📊 Campaign updated: ${campaign.amountRaisedINR}/${fundingGoal} INR, Backers: ${campaign.backersCount}`);
    console.log(`✅ Campaign saved successfully with backersCount: ${campaign.backersCount}`);

    // Step 4: Update donor's contribution tracking
    const member = await Member.findById(donorId);
    if (member) {
      if (!member.donationHistory) member.donationHistory = [];
      member.donationHistory.push({
        campaignId,
        amount: inrAmount,
        date: new Date(),
        txHash: txReceipt.hash
      });
      await member.save();
    }

    res.status(201).json({
      success: true,
      message: 'Donation processed successfully',
      data: {
        donation: {
          id: donation._id,
          inrAmount,
          ethAmount,
          txHash: txReceipt.hash
        },
        campaign: {
          id: campaign._id,
          amountRaised: campaign.amountRaisedINR,
          fundingGoal,
          percentComplete: Math.round((campaign.amountRaisedINR / fundingGoal) * 100)
        }
      }
    });

  } catch (error) {
    console.error('❌ Donation error:', error);
    
    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({
        success: false,
        message: 'Relayer has insufficient funds. Please contact support.'
      });
    }
    
    if (error.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        success: false,
        message: 'Escrow contract error: ' + (error.reason || error.message)
      });
    }

    if (error.message && error.message.includes('invalid address')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address. Please ensure your account is properly set up.'
      });
    }

    if (error.message && error.message.includes('network')) {
      return res.status(503).json({
        success: false,
        message: 'Network connection error. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process donation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get donation history for a user
 */
const getDonationHistory = async (req, res) => {
  try {
    const userId = req.member._id;

    const donations = await Donation.find({ donorId: userId })
      .populate('campaignId', 'title fundingGoalINR amountRaisedINR')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: donations
    });
  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation history'
    });
  }
};

/**
 * Get campaign donations (admin/creator view)
 */
const getCampaignDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is creator
    if (campaign.creatorId.toString() !== req.member._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const donations = await Donation.find({ campaignId })
      .select('donorEmail inrAmount ethAmount timestamp txHash')
      .sort({ timestamp: -1 });

    const stats = {
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + d.inrAmount, 0),
      uniqueDonors: new Set(donations.map(d => d.donorEmail)).size
    };

    res.json({
      success: true,
      data: {
        donations,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations'
    });
  }
};

/**
 * Get escrow contract balance and status
 */
const getEscrowStatus = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      provider
    );

    // Get contract state
    const [totalDeposited, totalReleased, campaignActive, balance] = await Promise.all([
      escrowContract.totalDeposited(),
      escrowContract.totalReleased(),
      escrowContract.campaignActive(),
      escrowContract.getBalance()
    ]);

    const depositedEth = ethers.formatEther(totalDeposited);
    const releasedEth = ethers.formatEther(totalReleased);
    const balanceEth = ethers.formatEther(balance);

    res.json({
      success: true,
      data: {
        escrowAddress: campaign.escrowContractAddress,
        totalDeposited: depositedEth,
        totalReleased: releasedEth,
        remainingBalance: balanceEth,
        campaignActive,
        status: campaignActive ? 'Active' : 'Closed'
      }
    });
  } catch (error) {
    console.error('Error fetching escrow status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch escrow status'
    });
  }
};

/**
 * Get all campaigns that the authenticated user has invested in
 */
const getMyInvestments = async (req, res) => {
  try {
    const donorId = req.member?._id || req.member?.id;
    if (!donorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Find all donations by this user
    const donations = await Donation.find({ member: donorId })
      .populate({
        path: 'campaign',
        populate: { path: 'owner', select: 'name email walletAddress' }
      })
      .sort({ createdAt: -1 });

    // Get milestone status for campaigns
    const Milestone = require('../models/milestoneModel');

    // Group donations by campaign and calculate totals
    const campaignMap = new Map();
    donations.forEach(donation => {
      if (!donation.campaign) return;
      
      const campaignId = donation.campaign._id.toString();
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          campaign: donation.campaign,
          donations: [],
          totalDonated: 0,
          donationCount: 0
        });
      }
      
      const entry = campaignMap.get(campaignId);
      entry.donations.push({
        _id: donation._id,
        amount: donation.amount,
        currency: donation.currency,
        txHash: donation.txHash,
        date: donation.date
      });
      entry.totalDonated += donation.amount || 0;
      entry.donationCount++;
    });

    // Convert to array and add milestone voting status
    const campaignIds = Array.from(campaignMap.keys());
    const pendingMilestones = await Milestone.find({
      campaignId: { $in: campaignIds },
      status: 'pending'
    }).select('campaignId votes');

    const campaignsWithDonations = Array.from(campaignMap.values()).map(entry => {
      const campaignId = entry.campaign._id.toString();
      
      // Check if user has already voted on pending milestones
      const pendingForCampaign = pendingMilestones.filter(m => 
        m.campaignId.toString() === campaignId
      );

      let hasPendingMilestones = false;
      let needsVote = false;

      if (pendingForCampaign.length > 0) {
        hasPendingMilestones = true;
        // Check if user has voted on any pending milestone
        needsVote = pendingForCampaign.some(milestone => {
          const hasVoted = milestone.votes?.some(vote => 
            vote.voter.toString() === donorId.toString()
          );
          return !hasVoted;
        });
      }

      return {
        ...entry.campaign.toObject(),
        myDonations: entry.donations,
        myTotalDonated: entry.totalDonated,
        myDonationCount: entry.donationCount,
        hasPendingMilestones,
        needsVote
      };
    });

    res.json({
      success: true,
      campaigns: campaignsWithDonations,
      totalInvestments: campaignsWithDonations.length,
      totalDonated: campaignsWithDonations.reduce((sum, c) => sum + c.myTotalDonated, 0)
    });
  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investments'
    });
  }
};

/**
 * Reconcile campaign backer count based on actual donations in database
 * This fixes campaigns where donations exist but backersCount wasn't updated
 */
const reconcileBackersCount = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Store previous value before updating
    const previousBackersCount = campaign.backersCount;

    // Count unique backers for this campaign
    const uniqueBackers = await Donation.distinct('member', { campaign: campaignId });
    const correctBackersCount = uniqueBackers.length;

    console.log(`🔍 Reconciling campaign ${campaignId}:`);
    console.log(`   Previous backersCount: ${previousBackersCount}`);
    console.log(`   Actual unique backers: ${correctBackersCount}`);

    // Update campaign with correct backer count
    campaign.backersCount = correctBackersCount;
    await campaign.save();

    console.log(`✅ Campaign backersCount updated to ${correctBackersCount}`);

    res.json({
      success: true,
      message: 'Backer count reconciled',
      data: {
        campaignId: campaign._id,
        title: campaign.title,
        previousBackersCount,
        newBackersCount: correctBackersCount,
        amountRaisedINR: campaign.amountRaisedINR
      }
    });
  } catch (error) {
    console.error('❌ Error reconciling backer count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reconcile backer count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reconcile all campaigns' backer counts
 * Admin endpoint to bulk fix all campaigns
 */
const reconcileAllBackersCounts = async (req, res) => {
  try {
    const campaigns = await Campaign.find({});
    let reconciled = 0;
    const results = [];

    for (const campaign of campaigns) {
      const uniqueBackers = await Donation.distinct('member', { campaign: campaign._id });
      const correctBackersCount = uniqueBackers.length;

      if (campaign.backersCount !== correctBackersCount) {
        console.log(`🔧 Fixing campaign ${campaign._id}: ${campaign.backersCount} → ${correctBackersCount}`);
        const previousCount = campaign.backersCount;
        campaign.backersCount = correctBackersCount;
        await campaign.save();
        reconciled++;
        results.push({
          campaignId: campaign._id,
          title: campaign.title,
          previousCount,
          newCount: correctBackersCount
        });
      }
    }

    console.log(`✅ Reconciliation complete: ${reconciled} campaigns fixed`);

    res.json({
      success: true,
      message: `Reconciliation complete. ${reconciled} campaigns fixed.`,
      totalCampaigns: campaigns.length,
      reconciledCount: reconciled,
      details: results
    });
  } catch (error) {
    console.error('❌ Error bulk reconciling backer counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk reconcile backer counts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  submitDonation,
  getDonationHistory,
  getCampaignDonations,
  getEscrowStatus,
  getMyInvestments,
  reconcileBackersCount,
  reconcileAllBackersCounts
};
