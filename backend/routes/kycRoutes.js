const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createCloudinaryStorage } = require('../config/cloudinary');
const {
    submitKYC,
    getKYCStatus,
    getPendingKYC,
    approveKYC,
    rejectKYC
} = require('../controllers/kycController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configure multer for KYC document uploads (Cloudinary)
const upload = multer({
    storage: createCloudinaryStorage('kyc', ['jpg', 'jpeg', 'png', 'webp']),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Member routes (protected)
router.post('/submit', authMiddleware, upload.array('documents', 5), submitKYC);
router.get('/status', authMiddleware, getKYCStatus);

// Admin routes (protected - for now just requires auth, later add admin check)
router.get('/pending', authMiddleware, getPendingKYC);
router.put('/approve/:memberId', authMiddleware, approveKYC);
router.put('/reject/:memberId', authMiddleware, rejectKYC);

module.exports = router;
