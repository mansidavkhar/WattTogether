// const express = require('express');
// const router = express.Router();
// const { 
//     register, 
//     login, 
//     saveWalletAddress, 
//     getJWKS, 
//     generateTestToken 
// } = require('../controllers/memberController');
// const authMiddleware = require('../middlewares/authMiddleware');

// // --- Public Routes ---
// router.post('/register', register);
// router.post('/login', login);

// // --- Protected Route ---
// router.post('/save-wallet', authMiddleware, saveWalletAddress);

// // --- Web3Auth Routes ---
// // JWKS endpoint for Web3Auth
// router.get('/jwks.json', getJWKS);

// // Test token generation (development only)
// router.post('/generate-test-token', generateTestToken);

// module.exports = router;








const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    saveWalletAddress, 
    getJWKS, 
    generateTestToken,
    getMe // Added controller for fetching user data
} = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- Public Routes ---
router.post('/register', register);
router.post('/login', login);

// --- Protected Routes ---
router.post('/save-wallet', authMiddleware, saveWalletAddress);

// This new route is required by the Network page to get the logged-in user's profile
router.get('/me', authMiddleware, getMe);

// --- Web3Auth Routes ---
// JWKS endpoint for Web3Auth
router.get('/jwks.json', getJWKS);

// Test token generation (development only)
router.post('/generate-test-token', generateTestToken);

module.exports = router;
