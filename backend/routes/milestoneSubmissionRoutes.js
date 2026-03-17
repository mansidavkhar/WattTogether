const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const milestoneController = require('../controllers/milestoneSubmissionController');

// Configure multer with memory storage (files go directly to IPFS, no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents are allowed'));
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/milestones/submit
 * Creator submits a spending request/milestone
 * Body: { campaignId, amount, description } + files (optional)
 */
router.post('/submit', upload.array('proofDocuments', 5), milestoneController.submitMilestone);

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
 * POST /api/milestones/:milestoneId/document-vote
 * Vote on document authenticity (thumbs up/down)
 * Body: { documentIndex: number, voteType: 'up' | 'down' }
 */
router.post('/:milestoneId/document-vote', milestoneController.voteOnDocument);

/**
 * POST /api/milestones/:milestoneId/release
 * Release funds for an approved milestone (creator only)
 */
router.post('/:milestoneId/release', milestoneController.releaseMilestoneFunds);

/**
 * V5 GUARDIAN FUNCTIONS (Admin Only)
 */

/**
 * POST /api/milestones/:milestoneId/resume
 * Resume disputed milestone (false alarm, restart 48h timer)
 */
router.post('/:milestoneId/resume', milestoneController.resumeMilestone);

/**
 * POST /api/milestones/:milestoneId/cancel
 * Cancel milestone (bad receipt, funds return to pool)
 */
router.post('/:milestoneId/cancel', milestoneController.cancelMilestone);

/**
 * POST /api/milestones/campaign/:campaignId/cancel-project
 * KILL SWITCH - Cancel entire project (scam, enable refunds)
 */
router.post('/campaign/:campaignId/cancel-project', milestoneController.cancelProject);

module.exports = router;
