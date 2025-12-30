const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const milestoneController = require('../controllers/milestoneController');

// Configure multer for milestone document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/milestones/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
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
 * POST /api/milestones/:milestoneId/release
 * Release funds for an approved milestone (creator only)
 */
router.post('/:milestoneId/release', milestoneController.releaseMilestoneFunds);

module.exports = router;
