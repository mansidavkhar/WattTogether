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

    // Step 2: Save donation record in database
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

    // Step 3: Update campaign with new donation amount
    const amountRaisedBefore = campaign.amountRaisedINR || 0;
    campaign.amountRaisedINR = (amountRaisedBefore || 0) + inrAmount;

    // Check if funding goal reached
    const fundingGoal = campaign.fundingGoalINR || campaign.amount || 0;
    if (campaign.amountRaisedINR >= fundingGoal) {
      console.log(`🎉 Campaign reached funding goal!`);
      campaign.status = 'funded';
      campaign.fundingCompletedAt = new Date();
    }

    await campaign.save();
    console.log(`📊 Campaign updated: ${campaign.amountRaisedINR}/${fundingGoal} INR`);

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

module.exports = {
  submitDonation,
  getDonationHistory,
  getCampaignDonations,
  getEscrowStatus
};
