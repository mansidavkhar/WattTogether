const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const milestoneCommentController = require('../controllers/milestoneCommentController');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/milestone-comments/milestone/:milestoneId
 * Get all comments for a specific milestone
 */
router.get('/milestone/:milestoneId', milestoneCommentController.getMilestoneComments);

/**
 * GET /api/milestone-comments/campaign/:campaignId
 * Get all comments for a campaign (across all milestones)
 */
router.get('/campaign/:campaignId', milestoneCommentController.getCampaignComments);

/**
 * POST /api/milestone-comments
 * Create a new comment on a milestone
 * Body: { milestoneId, campaignId, content, commentType }
 */
router.post('/', milestoneCommentController.createComment);

/**
 * PUT /api/milestone-comments/:commentId
 * Update an existing comment (author only)
 * Body: { content }
 */
router.put('/:commentId', milestoneCommentController.updateComment);

/**
 * DELETE /api/milestone-comments/:commentId
 * Delete a comment (author only)
 */
router.delete('/:commentId', milestoneCommentController.deleteComment);

module.exports = router;
