const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middlewares/authMiddleware');
const { listProjects, getProjectById, addProjectUpdate } = require('../controllers/projectController');
const { createCampaign } = require('../controllers/campaignController');
const Campaign = require('../models/campaignModel');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for cover_image
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// Public browse projects
router.get('/', listProjects);
router.get('/:id', getProjectById);

// Auth: owner updates
router.post('/:id/updates', auth, addProjectUpdate);

// --- Compatibility endpoints used by current frontend ---
// POST /api/projects/register (multipart/form-data) -> create a Campaign
router.post('/register', auth, upload.single('cover_image'), async (req, res, next) => {
  try {
    const mapFundingType = (t) => {
      if (!t) return 'Reward Based';
      const v = String(t).toLowerCase();
      if (v === 'reward') return 'Reward Based';
      if (v === 'donation') return 'Donation';
      if (v === 'equity') return 'Equity';
      if (v === 'debt') return 'Debt';
      return t;
    };

    // Map legacy form fields to Campaign create schema
    req.body = {
      title: req.body.project_name,
      description: req.body.description,
      aboutEntrepreneur: req.body.about_entrepreneur,
      fundingType: mapFundingType(req.body.fund_type),
      fundingGoalINR: Number(req.body.amount || 0),
      projectDeadline: req.body.project_deadline ? new Date(req.body.project_deadline) : undefined,
      fundingDeadline: req.body.funding_deadline ? new Date(req.body.funding_deadline) : undefined,
      coverImageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    };

    // Delegate to the standard campaign create handler
    return createCampaign(req, res, next);
  } catch (err) {
    console.error('Compat /projects/register error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
});

// GET /api/projects/getall -> returns active campaigns in legacy UI shape
router.get('/getall', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'active' }).sort({ createdAt: -1 });
    const projects = campaigns.map((c) => ({
      _id: c._id,
      project_name: c.title,
      description: c.description,
      about_entrepreneur: c.aboutEntrepreneur,
      cover_image: c.coverImageUrl,
      fund_type: c.fundingType,
      amount: c.fundingGoalINR,
      funding_deadline: c.fundingDeadline,
      project_deadline: c.projectDeadline,
      amountRaisedINR: c.amountRaisedINR,
      backersCount: c.backersCount,
      owner: c.owner,
      status: c.status,
      createdAt: c.createdAt,
    }));
    return res.json({ success: true, projects });
  } catch (err) {
    console.error('Compat /projects/getall error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
  }
});

module.exports = router;
