const ethers = require('ethers');
const Milestone = require('../models/milestoneModel');
const Campaign = require('../models/campaignModel');
const projectEscrowABI = require('../contracts/artifacts/ProjectEscrowV2.json').abi;

// Polygon Amoy configuration
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC || 'https://polygon-amoy.g.alchemy.com/v2/demo';
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

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

    // Prepare proof documents array
    const proofDocuments = uploadedFiles.map(file => ({
      filename: file.originalname,
      path: file.path,
      uploadedAt: new Date()
    }));

    // Create milestone record
    const milestone = new Milestone({
      campaignId,
      creatorId,
      amount,
      description,
      status: 'pending',
      proofDocuments,
      createdAt: new Date()
    });

    await milestone.save();
    console.log(`✅ Milestone created: ${milestone._id} with ${proofDocuments.length} documents`);

    // Add to escrow contract
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );

    // Use the same conversion rate as donations: 100,000 INR = 1 ETH
    const INR_TO_WEI_RATE = 100000;
    const weiAmount = ethers.parseEther((amount / INR_TO_WEI_RATE).toString());

    console.log(`🔗 Adding milestone to escrow contract...`);
    const txResponse = await escrowContract.addMilestone(weiAmount, description, {
      gasLimit: 200000
    });

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
      .select('amount description status votes upvotes downvotes votingEndDate onChainId proofDocuments')
      .sort({ createdAt: -1 });

    // Get voting power (only for donors)
    const Donation = require('../models/donationModel');
    
    console.log('🔍 Checking voting power for:', {
      campaignId,
      memberId: req.member._id,
      memberEmail: req.member.email
    });
    
    const userDonations = await Donation.findOne({
      campaign: campaignId,
      member: req.member._id
    });

    console.log('💰 Donation found:', userDonations ? 'YES' : 'NO');
    if (userDonations) {
      console.log('   Donation details:', {
        amount: userDonations.amount,
        date: userDonations.date
      });
    }
    
    // Also check if any donations exist for this campaign
    const allDonations = await Donation.find({ campaign: campaignId });
    console.log(`📊 Total donations for campaign: ${allDonations.length}`);

    const hasVotingPower = !!userDonations;

    res.json({
      success: true,
      data: {
        milestones,
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

    // Check if already voted
    if (milestone.votes && milestone.votes.some(v => v.voterId.toString() === voterId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this milestone'
      });
    }

    // Record vote
    if (!milestone.votes) milestone.votes = [];
    milestone.votes.push({
      voterId,
      vote,
      timestamp: new Date()
    });

    if (vote === 'up') {
      milestone.upvotes = (milestone.upvotes || 0) + 1;
    } else {
      milestone.downvotes = (milestone.downvotes || 0) + 1;
    }

    // Check if milestone should pass (>50% approval)
    const totalVotes = (milestone.upvotes || 0) + (milestone.downvotes || 0);
    const approvalRate = milestone.upvotes / totalVotes;

    let milestoneStatus = milestone.status;
    if (approvalRate > 0.5) {
      milestoneStatus = 'approved';
      milestone.status = 'approved';
    } else if (approvalRate < 0.5 && totalVotes >= 3) {
      milestoneStatus = 'rejected';
      milestone.status = 'rejected';
    }

    await milestone.save();

    console.log(`📊 Vote recorded on milestone ${milestoneId}: ${vote} (${milestone.upvotes}/${milestone.downvotes})`);

    res.json({
      success: true,
      message: 'Vote recorded',
      data: {
        milestoneId,
        status: milestoneStatus,
        upvotes: milestone.upvotes,
        downvotes: milestone.downvotes,
        approvalRate: (milestone.upvotes / totalVotes * 100).toFixed(2) + '%'
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

    // Check milestone is approved
    if (milestone.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Milestone must be approved before releasing funds'
      });
    }

    // Release funds from escrow
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const relayer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      relayer
    );

    // Use the same conversion rate as donations: 100,000 INR = 1 ETH
    const INR_TO_WEI_RATE = 100000;
    const weiAmount = ethers.parseEther((milestone.amount / INR_TO_WEI_RATE).toString());

    console.log(`💰 Releasing ${milestone.amount} INR (${ethers.formatEther(weiAmount)} ETH) from escrow...`);
    console.log(`   To beneficiary wallet: ${campaign.beneficiaryAddress}`);
    console.log(`   Milestone ID: ${milestone.onChainId}`);
    
    const txResponse = await escrowContract.releaseMilestoneFunds(
      milestone.onChainId,
      weiAmount
    );

    const txReceipt = await txResponse.wait();
    console.log(`✅ Funds released in block ${txReceipt.blockNumber}`);

    milestone.status = 'released';
    milestone.releasedAt = new Date();
    milestone.releaseTxHash = txReceipt.transactionHash;
    await milestone.save();

    res.json({
      success: true,
      message: 'Funds released successfully',
      data: {
        milestoneId,
        amount: milestone.amount,
        txHash: txReceipt.transactionHash
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

module.exports = {
  submitMilestone,
  getCampaignMilestones,
  voteOnMilestone,
  releaseMilestoneFunds
};
