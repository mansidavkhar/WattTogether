const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    saveWalletAddress, 
    getJWKS, 
    generateTestToken 
} = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- Public Routes ---
router.post('/register', register);
router.post('/login', login);

// --- Protected Route ---
router.post('/save-wallet', authMiddleware, saveWalletAddress);

// --- Web3Auth Routes ---
// JWKS endpoint for Web3Auth
router.get('/jwks.json', getJWKS);

// Test token generation (development only)
router.post('/generate-test-token', generateTestToken);

module.exports = router;
