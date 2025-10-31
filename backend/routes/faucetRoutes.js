const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { fundUserWithTestUSDC } = require('../controllers/faucetController');

// Simulated fiat: credit user with test USDC on Amoy
router.post('/fund-user', authMiddleware, fundUserWithTestUSDC);

module.exports = router;
