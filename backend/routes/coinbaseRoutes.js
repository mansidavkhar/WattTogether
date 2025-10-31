const express = require('express');
const router = express.Router();
const { generateOnrampSessionTokenController } = require('../controllers/coinbaseController');
const authMiddleware = require('../middlewares/authMiddleware'); // Assuming you have this

router.get('/onramp-session', authMiddleware, generateOnrampSessionTokenController);

module.exports = router;
