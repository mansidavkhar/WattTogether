const cron = require('node-cron');
const ethers = require('ethers');
const Milestone = require('../models/milestoneModel');
const Campaign = require('../models/campaignModel');
const projectEscrowABI = require('../artifacts/contracts/ProjectEscrowV6.sol/ProjectEscrowV6.json').abi;

// Polygon Amoy configuration
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC_URL || process.env.POLYGON_AMOY_RPC || 'https://polygon-amoy.g.alchemy.com/v2/demo';
const GUARDIAN_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;

/**
 * Auto-release milestones that have passed cooling period (V6 optimistic governance)
 * In V6: Milestones are PENDING_RELEASE after submission, then auto-released after 48h if not disputed
 */
async function executeReadyMilestones() {
  console.log('\n⏰ [CRON] Checking for milestones ready to release...');
  
  try {
    // Get all pending milestones with on-chain IDs
    const milestones = await Milestone.find({ 
      status: 'pending',
      onChainId: { $exists: true }
    }).populate('campaignId', 'escrowContractAddress title');

    console.log(`   Found ${milestones.length} pending milestones`);

    if (milestones.length === 0) {
      console.log('   No pending milestones to check');
      return;
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
    const guardian = new ethers.Wallet(GUARDIAN_PRIVATE_KEY, provider);

    let executedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const milestone of milestones) {
      try {
        // Skip if no escrow address
        if (!milestone.campaignId || !milestone.campaignId.escrowContractAddress) {
          console.log(`   ⏭️  Skipped milestone ${milestone._id}: No escrow address`);
          skippedCount++;
          continue;
        }

        const escrowContract = new ethers.Contract(
          milestone.campaignId.escrowContractAddress,
          projectEscrowABI,
          guardian
        );

        // Get milestone data from contract (V6 format)
        const milestoneData = await escrowContract.milestones(milestone.onChainId);
        
        // V6 milestone structure: amount, description, ipfsHash, discussionHash, status, vetoWeight, releaseableAt
        const milestoneStatus = Number(milestoneData.status);
        const releaseableAt = Number(milestoneData.releaseableAt);
        const now = Math.floor(Date.now() / 1000);

        // MilestoneStatus enum in V6:
        // 0 = PENDING_RELEASE, 1 = DISPUTED, 2 = RELEASED, 3 = CANCELLED
        
        // Check if already released
        if (milestoneStatus === 2) {
          console.log(`   ✅ Milestone ${milestone.onChainId} already released`);
          // Update local database
          milestone.status = 'released';
          milestone.approvedAt = new Date();
          await milestone.save();
          skippedCount++;
          continue;
        }

        // Check if disputed
        if (milestoneStatus === 1) {
          console.log(`   🚫 Milestone ${milestone.onChainId} is disputed, requires guardian review`);
          // Update local database
          milestone.status = 'disputed';
          await milestone.save();
          skippedCount++;
          continue;
        }

        // Check if cancelled
        if (milestoneStatus === 3) {
          console.log(`   ❌ Milestone ${milestone.onChainId} was cancelled`);
          milestone.status = 'cancelled';
          await milestone.save();
          skippedCount++;
          continue;
        }

        // Must be PENDING_RELEASE (0)
        if (milestoneStatus !== 0) {
          console.log(`   ⏭️  Milestone ${milestone.onChainId} has unexpected status: ${milestoneStatus}`);
          skippedCount++;
          continue;
        }

        // Check if cooling period has ended
        if (now < releaseableAt) {
          const timeLeft = releaseableAt - now;
          const hoursLeft = Math.floor(timeLeft / 3600);
          console.log(`   ⏳ Milestone ${milestone.onChainId} cooling period not ended (${hoursLeft}h left)`);
          skippedCount++;
          continue;
        }

        // Ready to release!
        console.log(`   🚀 Releasing milestone ${milestone.onChainId} for "${milestone.campaignId.title}"`);
        
        const txResponse = await escrowContract.releaseMilestone(milestone.onChainId, {
          gasLimit: 300000
        });

        const txReceipt = await txResponse.wait();
        console.log(`   ✅ Milestone released! TX: ${txReceipt.hash}`);

        // Update database
        milestone.status = 'released';
        milestone.approvedAt = new Date();
        milestone.executionTxHash = txReceipt.hash;
        await milestone.save();

        executedCount++;

      } catch (milestoneError) {
        console.error(`   ❌ Error processing milestone ${milestone._id}:`, milestoneError.message);
        errorCount++;
      }
    }

    console.log(`\n📊 [CRON] Summary:`);
    console.log(`   ✅ Released: ${executedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ [CRON] Error in milestone execution job:', error);
  }
}

/**
 * Initialize cron jobs
 */
function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // Run every hour at minute 0
  // Format: minute hour day month weekday
  cron.schedule('0 * * * *', async () => {
    console.log('\n=== CRON JOB TRIGGERED ===');
    await executeReadyMilestones();
    console.log('=== CRON JOB COMPLETED ===\n');
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Cron jobs initialized');
  console.log('   - Milestone auto-release (V6): Every hour');
  console.log('   - Releases milestones after 48h cooling period if not disputed');

  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Running initial check (development mode)...');
    setTimeout(() => executeReadyMilestones(), 5000); // Wait 5s after startup
  }
}

/**
 * Manual trigger endpoint (for testing)
 */
async function manualTrigger() {
  console.log('🔧 Manual trigger activated');
  await executeReadyMilestones();
}

module.exports = {
  initializeCronJobs,
  executeReadyMilestones,
  manualTrigger
};
