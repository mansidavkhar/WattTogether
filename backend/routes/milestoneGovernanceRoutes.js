const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  addMilestoneComment,
  getMilestoneComments,
  vetoMilestone,
  executeMilestone,
  getPendingExecutions,
  rageQuit
} = require('../controllers/milestoneGovernanceController');

// Comment routes
router.post('/:milestoneId/comments', authMiddleware, addMilestoneComment);
router.get('/:milestoneId/comments', getMilestoneComments);

// Governance routes
router.post('/:milestoneId/veto', authMiddleware, vetoMilestone);
router.post('/:milestoneId/execute', authMiddleware, executeMilestone);

// Rage quit route
router.post('/campaigns/:campaignId/rage-quit', authMiddleware, rageQuit);

// Admin/Cron routes
router.get('/pending-executions', getPendingExecutions);

module.exports = router;
