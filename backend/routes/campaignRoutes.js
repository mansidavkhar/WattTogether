


// const express = require('express');
// const router = express.Router();
// const path = require('path');
// const multer = require('multer');
// const auth = require('../middlewares/authMiddleware');
// const {
//   createCampaign,
//   listCampaigns,
//   getCampaignById,
//   updateFundingProgress,
//   convertToProject,
// } = require('../controllers/campaignController');

// // Set up multer for cover_image uploads
// const uploadDir = path.join(__dirname, '..', 'uploads');
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname || '');
//     const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
//     cb(null, name);
//   },
// });
// const upload = multer({ storage });

// // List and get campaigns (public)
// router.get('/', listCampaigns);
// router.get('/:id', getCampaignById);

// // Create a new campaign with file upload
// router.post('/', auth, upload.single('cover_image'), createCampaign);

// // Update funding
// router.patch('/:id/funding', auth, updateFundingProgress);

// // Convert to project
// router.post('/:id/convert', auth, convertToProject);

// module.exports = router;






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
  convertToProject,
} = require('../controllers/campaignController');

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

// List and get campaigns (require auth for filtering by member)
router.get('/', auth, listCampaigns);
router.get('/:id', getCampaignById);

// Create a new campaign with file upload
router.post('/', auth, upload.single('cover_image'), createCampaign);

// Update funding
router.patch('/:id/funding', auth, updateFundingProgress);

// Convert to project
router.post('/:id/convert', auth, convertToProject);

module.exports = router;
