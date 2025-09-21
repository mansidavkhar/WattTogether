const express = require('express');
const router = express.Router();
const { register, login, saveWalletAddress } = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');

// --- Public Routes ---
// These endpoints are accessible without a token.
// POST /api/members/register
router.post('/register', register);

// POST /api/members/login
router.post('/login', login);


// --- Protected Route ---
// This endpoint is only accessible with a valid JWT token.
// The authMiddleware will verify the token and attach the member's ID to the request object.
// POST /api/members/save-wallet
router.post('/save-wallet', authMiddleware, saveWalletAddress);


module.exports = router;
