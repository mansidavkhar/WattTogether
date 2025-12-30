const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const auth = require('../middlewares/authMiddleware');
const {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateFundingProgress,
} = require('../controllers/campaignController');
const fundingController = require('../controllers/fundingController');

// Set up multer for cover_image uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// --- Campaign Lifecycle Routes ---

// Conditional auth middleware - require auth only when mine=true
const conditionalAuth = (req, res, next) => {
  if (req.query.mine === 'true') {
    return auth(req, res, next);
  }
  next();
};

// List campaigns (publicly accessible, auth required when mine=true)
router.get('/', conditionalAuth, listCampaigns);
router.get('/:id', getCampaignById);

// Create a new campaign (requires auth and handles file upload)
router.post('/', auth, upload.single('cover_image'), createCampaign);

// Update funding progress (internal or webhook, requires auth)
router.patch('/:id/funding', auth, updateFundingProgress);

// --- Funding Routes ---

// @route   POST api/campaigns/dev-fund
// @desc    (DEV ONLY) Fund a campaign using the developer faucet
// @access  Private (requires user to be logged in)
router.post('/dev-fund', auth, fundingController.fundWithTestUSDC);


module.exports = router;

