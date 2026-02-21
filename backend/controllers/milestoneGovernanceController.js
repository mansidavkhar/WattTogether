const ethers = require('ethers');
const Milestone = require('../models/milestoneModel');
const MilestoneComment = require('../models/milestoneCommentModel');
const Campaign = require('../models/campaignModel');
const projectEscrowABI = require('../artifacts/contracts/ProjectEscrowV6.sol/ProjectEscrowV6.json').abi;

// Polygon Amoy configuration
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL || process.env.POLYGON_AMOY_RPC || 'https://polygon-amoy.g.alchemy.com/v2/demo';
const GUARDIAN_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;

/**
 * Add comment to a milestone (only during dispute window)
 */
const addMilestoneComment = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { content, commentType } = req.body;
    const userId = req.member._id;

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Get campaign
    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if milestone has on-chain ID
    if (milestone.onChainId === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Milestone not yet on-chain'
      });
    }

    // Get milestone details from contract to check dispute window
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      provider
    );

    const milestoneData = await escrowContract.getMilestone(milestone.onChainId);
    const disputeEnds = Number(milestoneData.disputeEnds);
    const isDisputed = milestoneData.isDisputed;
    const released = milestoneData.released;

    // Check if still in dispute window
    const now = Math.floor(Date.now() / 1000);
    if (now >= disputeEnds && !isDisputed) {
      return res.status(400).json({
        success: false,
        message: 'Dispute period has ended for this milestone'
      });
    }

    if (released) {
      return res.status(400).json({
        success: false,
        message: 'Milestone already released, comments not allowed'
      });
    }

    // Create comment
    const comment = new MilestoneComment({
      milestone: milestoneId,
      campaign: campaign._id,
      author: userId,
      content,
      commentType: commentType || 'general'
    });

    await comment.save();

    // Populate author info
    await comment.populate('author', 'name email walletAddress');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Error adding milestone comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get comments for a milestone
 */
const getMilestoneComments = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const comments = await MilestoneComment.find({ milestone: milestoneId })
      .populate('author', 'name email walletAddress')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { comments }
    });

  } catch (error) {
    console.error('Error fetching milestone comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
};

/**
 * Veto a milestone (on-chain)
 */
const vetoMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { signature, message, walletAddress } = req.body;
    const userId = req.member._id;

    console.log('\n🚫 VETO REQUEST DEBUG:');
    console.log('   Milestone ID:', milestoneId);
    console.log('   Wallet Address:', walletAddress);
    console.log('   Has Signature:', !!signature);
    console.log('   Has Message:', !!message);

    if (!walletAddress) {
      console.log('   ❌ Missing wallet address');
      return res.status(400).json({
        success: false,
        message: 'Wallet address required'
      });
    }

    if (!signature) {
      console.log('   ❌ Missing signature');
      return res.status(400).json({
        success: false,
        message: 'Signature required'
      });
    }

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      console.log('   ❌ Milestone not found');
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    console.log('   ✅ Milestone found:', {
      id: milestone._id,
      onChainId: milestone.onChainId,
      status: milestone.status,
      amount: milestone.amount
    });

    // Get campaign
    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      console.log('   ❌ Campaign not found');
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    console.log('   ✅ Campaign found:', {
      id: campaign._id,
      escrowContract: campaign.escrowContractAddress
    });

    // Check if milestone is on-chain
    if (milestone.onChainId === undefined || milestone.onChainId === null) {
      console.log('   ❌ Milestone not yet on-chain');
      return res.status(400).json({
        success: false,
        message: 'Milestone not yet submitted on-chain. Please wait for creator to submit it.'
      });
    }

    // Setup provider and relayer (guardian)
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const guardian = new ethers.Wallet(GUARDIAN_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      guardian
    );

    console.log(`\n🚫 Veto request for milestone ${milestone.onChainId}`);
    console.log(`   User: ${walletAddress}`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);

    // Check user's contribution on-chain
    try {
      const userContribution = await escrowContract.contributions(walletAddress);
      console.log(`   💰 User contribution on-chain: ${ethers.formatUnits(userContribution, 6)} USDC`);
      
      if (userContribution === 0n) {
        console.log('   ⚠️  WARNING: User has 0 contribution! Veto will likely fail.');
      }
    } catch (checkError) {
      console.log('   ⚠️  Could not check contribution:', checkError.message);
    }

    try {
      let txResponse;
      
      // Check if contract has vetoMilestoneWithSignature function
      if (typeof escrowContract.vetoMilestoneWithSignature === 'function') {
        console.log('   ✅ Using signature-based veto (gasless)');
        
        // CRITICAL: Convert onChainId to number (it's stored as string in DB)
        const onChainIdNum = parseInt(milestone.onChainId, 10);
        console.log('   📊 OnChain ID (converted):', onChainIdNum, 'from string:', milestone.onChainId);
        console.log('   📝 Wallet Address:', walletAddress);
        console.log('   📝 Signature length:', signature.length, 'starts with:', signature.substring(0, 10));
        
        // WORKAROUND: Manually encode the transaction data (ethers.js has a bug with empty data)
        const encodedData = escrowContract.interface.encodeFunctionData('vetoMilestoneWithSignature', [
          onChainIdNum,
          walletAddress,
          signature
        ]);
        console.log('   ✅ Function encoded, data length:', encodedData.length, 'bytes');
        
        // Send raw transaction with encoded data
        const tx = {
          to: campaign.escrowContractAddress,
          data: encodedData,
          gasLimit: 300000
        };
        
        console.log('   📤 Sending transaction to:', tx.to);
        console.log('   📤 Data preview:', tx.data.substring(0, 50) + '...');
        
        // Try to simulate the call first to get better error messages
        try {
          await guardian.call(tx);
          console.log('   ✅ Call simulation successful');
        } catch (simulateError) {
          console.error('   ❌ Call simulation failed:', simulateError.message);
          
          // Try to extract the revert reason
          if (simulateError.data) {
            try {
              const reason = escrowContract.interface.parseError(simulateError.data);
              console.error('   📝 Decoded revert reason:', reason);
              throw new Error(`Contract reverted: ${reason?.name || 'Unknown reason'}`);
            } catch (parseError) {
              console.error('   ⚠️  Could not parse revert reason');
            }
          }
          
          // Common revert reasons
          if (simulateError.message.includes('Invalid signature')) {
            throw new Error('Invalid signature - please try signing again');
          } else if (simulateError.message.includes('Already vetoed')) {
            throw new Error('You have already vetoed this milestone');
          } else if (simulateError.message.includes('Not a donor')) {
            throw new Error('Only donors can veto milestones');
          }
          
          throw simulateError;
        }
        
        txResponse = await guardian.sendTransaction(tx);
      } else {
        console.log('   ⚠️  Signature function not available, using legacy veto');
        console.log('   ⚠️  WARNING: This requires user to have MATIC for gas!');
        
        // Fallback: Create user's wallet from their address (this won't work without private key)
        // Instead, return error telling them to upgrade contract
        return res.status(400).json({
          success: false,
          message: 'Contract needs to be upgraded to support gasless veto. Please contact the admin to deploy ProjectEscrowV6.',
          requiresUpgrade: true
        });
      }

      const txReceipt = await txResponse.wait();
      console.log(`✅ Veto transaction confirmed: ${txReceipt.hash}`);

      // Get updated milestone data from contract
      const milestoneData = await escrowContract.getMilestone(milestone.onChainId);
      const onChainStatus = Number(milestoneData.status);
      
      // Map on-chain status to DB status
      let dbStatus = 'pending';
      if (onChainStatus === 1) {
        dbStatus = 'disputed';
      } else if (onChainStatus === 2) {
        dbStatus = 'released';
      } else if (onChainStatus === 3) {
        dbStatus = 'cancelled';
      }
      
      // Add user to vetoVoters array if not already there
      const alreadyVetoed = milestone.vetoVoters?.some(voter => 
        voter.voterId?.toString() === userId.toString()
      );
      
      if (!alreadyVetoed) {
        // Get user's donation weight
        const Donation = require('../models/donationModel');
        const userDonation = await Donation.findOne({
          campaign: milestone.campaignId,
          member: userId
        });
        
        const donationWeightUSDC = userDonation ? Number(userDonation.amount) : 0;
        
        milestone.vetoVoters.push({
          voterId: userId,
          walletAddress: walletAddress,
          weight: donationWeightUSDC,
          timestamp: new Date()
        });
        console.log(`   ✅ Added voter to vetoVoters: ${userId.toString().slice(-4)} (${donationWeightUSDC} USDC)`);
      }
      
      // Update milestone status in database if it changed to disputed
      if (dbStatus === 'disputed' && milestone.status !== 'disputed') {
        milestone.status = 'disputed';
      }
      
      await milestone.save();
      console.log(`   🔄 Updated DB status to: ${dbStatus}`);

      res.json({
        success: true,
        message: dbStatus === 'disputed' 
          ? '⚠️ Veto threshold reached! Milestone is now DISPUTED and frozen for guardian review.' 
          : 'Veto vote recorded successfully',
        data: {
          txHash: txReceipt.hash,
          vetoWeight: Number(milestoneData.vetoWeight) / 1e6, // Convert from 6 decimals
          status: onChainStatus, // 0=PENDING, 1=DISPUTED, 2=RELEASED, 3=CANCELLED
          statusString: dbStatus
        }
      });

    } catch (contractError) {
      console.error('❌ Contract error:', contractError);
      console.error('   Error message:', contractError.message);
      console.error('   Error code:', contractError.code);
      console.error('   Error reason:', contractError.reason);
      console.error('   Error data:', contractError.data);
      
      let errorMessage = 'Failed to veto milestone';
      
      // Parse the actual revert reason from the error
      if (contractError.reason) {
        console.error('   📝 Revert reason:', contractError.reason);
      }
      
      if (contractError.message.includes('Invalid signature')) {
        errorMessage = 'Invalid signature. Please try again.';
      } else if (contractError.message.includes('Already vetoed') || contractError.reason?.includes('Already vetoed')) {
        errorMessage = 'You have already vetoed this milestone';
      } else if (contractError.message.includes('Not a donor') || contractError.reason?.includes('Not a donor')) {
        errorMessage = 'Only campaign donors can veto milestones. Please donate to this campaign first.';
      } else if (contractError.message.includes('Cannot veto') || contractError.reason?.includes('Cannot veto')) {
        errorMessage = 'This milestone cannot be vetoed (already disputed or released)';
      } else if (contractError.message.includes('Donor claimed refund')) {
        errorMessage = 'Cannot veto after claiming refund';
      } else if (contractError.message.includes('Invalid milestone')) {
        errorMessage = 'Invalid milestone ID';
      } else if (contractError.message.includes('is not a function') || contractError.message.includes('method not found') || contractError.code === 'UNSUPPORTED_OPERATION') {
        errorMessage = 'Contract function not available. The contract may need to be redeployed with the latest version.';
      } else if (contractError.code === 'CALL_EXCEPTION') {
        // Generic revert - use the reason if available, otherwise generic message
        errorMessage = contractError.reason || 'Transaction reverted. Possible reasons: already vetoed, not a donor, or milestone status invalid.';
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? contractError.message : undefined
      });
    }

  } catch (error) {
    console.error('Error vetoing milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process veto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Release a milestone (V6: after cooling period, if not disputed)
 * Guardian manually releases milestone or it's auto-released after 48h
 */
const executeMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    // Get milestone
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Get campaign
    const campaign = await Campaign.findById(milestone.campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const guardian = new ethers.Wallet(GUARDIAN_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      guardian
    );

    console.log(`\n✅ Releasing milestone ${milestone.onChainId}`);

    try {
      const txResponse = await escrowContract.releaseMilestone(milestone.onChainId, {
        gasLimit: 300000
      });

      const txReceipt = await txResponse.wait();
      console.log(`✅ Milestone released: ${txReceipt.hash}`);

      // Update milestone status
      milestone.status = 'released';
      milestone.approvedAt = new Date();
      await milestone.save();

      res.json({
        success: true,
        message: 'Milestone released successfully',
        data: {
          txHash: txReceipt.hash
        }
      });

    } catch (contractError) {
      console.error('Contract error:', contractError);
      
      let errorMessage = 'Failed to release milestone';
      if (contractError.message.includes('Cooling period not ended')) {
        errorMessage = 'Cooling period has not ended yet (48h required)';
      } else if (contractError.message.includes('Cannot release')) {
        errorMessage = 'Milestone cannot be released (may be disputed or already released)';
      } else if (contractError.message.includes('Insufficient balance')) {
        errorMessage = 'Insufficient funds in escrow';
      }

      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

  } catch (error) {
    console.error('Error releasing milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get milestones pending execution (for cron job)
 */
const getPendingExecutions = async (req, res) => {
  try {
    const milestones = await Milestone.find({ 
      status: 'pending',
      onChainId: { $exists: true }
    }).populate('campaignId', 'escrowContractAddress title');

    const pendingExecutions = [];

    for (const milestone of milestones) {
      if (!milestone.campaignId.escrowContractAddress) continue;

      const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
      const escrowContract = new ethers.Contract(
        milestone.campaignId.escrowContractAddress,
        projectEscrowABI,
        provider
      );

      try {
        const milestoneData = await escrowContract.getMilestone(milestone.onChainId);
        const disputeEnds = Number(milestoneData.disputeEnds);
        const isDisputed = milestoneData.isDisputed;
        const released = milestoneData.released;
        const now = Math.floor(Date.now() / 1000);

        if (!released && !isDisputed && now >= disputeEnds) {
          pendingExecutions.push({
            milestoneId: milestone._id,
            onChainId: milestone.onChainId,
            campaignId: milestone.campaignId._id,
            campaignTitle: milestone.campaignId.title,
            escrowAddress: milestone.campaignId.escrowContractAddress,
            disputeEnds: new Date(disputeEnds * 1000)
          });
        }
      } catch (error) {
        console.error(`Error checking milestone ${milestone._id}:`, error.message);
      }
    }

    res.json({
      success: true,
      data: { pendingExecutions }
    });

  } catch (error) {
    console.error('Error getting pending executions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending executions'
    });
  }
};

/**
 * Rage quit - withdraw funds and exit governance
 */
const rageQuit = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.member._id;
    const userWallet = req.member.walletAddress;

    if (!userWallet) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address not found'
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

    // For now, guardian/relayer calls the contract on behalf of the user
    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const guardian = new ethers.Wallet(GUARDIAN_PRIVATE_KEY, provider);
    
    const escrowContract = new ethers.Contract(
      campaign.escrowContractAddress,
      projectEscrowABI,
      guardian
    );

    console.log(`\n💨 Rage quit request for campaign ${campaignId}`);
    console.log(`   User: ${userWallet}`);

    // Calculate potential refund first
    try {
      const refundAmount = await escrowContract.calculateRageQuitRefund(userWallet);
      const refundUSDC = ethers.formatUnits(refundAmount, 6);
      
      console.log(`   Potential refund: ${refundUSDC} USDC`);

      if (refundAmount === 0n) {
        return res.status(400).json({
          success: false,
          message: 'No funds available to withdraw'
        });
      }

      // Execute rage quit
      // Note: In production, this would be signed by the user's wallet
      const txResponse = await escrowContract.rageQuit({
        gasLimit: 300000
      });

      const txReceipt = await txResponse.wait();
      console.log(`✅ Rage quit successful: ${txReceipt.hash}`);

      res.json({
        success: true,
        message: 'Successfully withdrawn from campaign',
        data: {
          txHash: txReceipt.hash,
          refundAmount: refundUSDC
        }
      });

    } catch (contractError) {
      console.error('Contract error:', contractError);
      
      let errorMessage = 'Failed to withdraw funds';
      if (contractError.message.includes('No contributions')) {
        errorMessage = 'You have not contributed to this campaign';
      } else if (contractError.message.includes('Already rage quit')) {
        errorMessage = 'You have already withdrawn from this campaign';
      }

      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

  } catch (error) {
    console.error('Error processing rage quit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  addMilestoneComment,
  getMilestoneComments,
  vetoMilestone,
  executeMilestone,
  getPendingExecutions,
  rageQuit
};
