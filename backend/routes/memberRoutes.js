const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  saveWalletAddress, 
  getJWKS, 
  generateTestToken,
  getMe,
  getWalletAddress // <-- Added new controller
} = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- Public Routes ---
router.post('/register', register);
router.post('/login', login);

// --- Protected Routes ---
router.post('/save-wallet', authMiddleware, saveWalletAddress);

// Get logged-in user's profile
router.get('/me', authMiddleware, getMe);

// --- NEW: Get logged-in user's wallet address ---
router.get('/get-wallet', authMiddleware, getWalletAddress);

// --- Web3Auth Routes ---
router.get('/jwks.json', getJWKS);
router.post('/generate-test-token', generateTestToken);

module.exports = router;
