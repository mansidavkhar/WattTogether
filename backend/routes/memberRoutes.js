const express = require('express');
const router = express.Router();
const { 
  authWithPrivy,
  saveWalletAddress, 
  getMe,
  getWalletAddress
} = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- Public Routes ---
// Privy authentication endpoint (handles both login and registration)
router.post('/auth/privy', authWithPrivy);

// --- Protected Routes ---
// Save/update wallet address
router.post('/save-wallet', authMiddleware, saveWalletAddress);

// Get logged-in member's profile
router.get('/me', authMiddleware, getMe);

// Get logged-in member's wallet address
router.get('/get-wallet', authMiddleware, getWalletAddress);

module.exports = router;
