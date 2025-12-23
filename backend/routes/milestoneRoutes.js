const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const milestoneController = require('../controllers/milestoneController');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/milestones/submit
 * Creator submits a spending request/milestone
 * Body: { campaignId, amount, description }
 */
router.post('/submit', milestoneController.submitMilestone);

/**
 * GET /api/milestones/campaign/:campaignId
 * Get all milestones for a campaign
 */
router.get('/campaign/:campaignId', milestoneController.getCampaignMilestones);

/**
 * POST /api/milestones/:milestoneId/vote
 * Vote on a milestone (up or down)
 * Body: { vote: 'up' | 'down' }
 */
router.post('/:milestoneId/vote', milestoneController.voteOnMilestone);

/**
 * POST /api/milestones/:milestoneId/release
 * Release funds for an approved milestone (creator only)
 */
router.post('/:milestoneId/release', milestoneController.releaseMilestoneFunds);

module.exports = router;
