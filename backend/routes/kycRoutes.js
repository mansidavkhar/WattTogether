const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    submitKYC,
    getKYCStatus,
    getPendingKYC,
    approveKYC,
    rejectKYC
} = require('../controllers/kycController');
const authMiddleware = require('../middlewares/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/kyc/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'kyc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
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
