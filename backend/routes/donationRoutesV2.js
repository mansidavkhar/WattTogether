const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const donationController = require('../controllers/donationControllerV2');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/donations/submit
 * Submit a donation to a campaign
 * Body: { campaignId, inrAmount }
 */
router.post('/submit', donationController.submitDonation);

/**
 * GET /api/donations/history
 * Get donation history for the current user
 */
router.get('/history', donationController.getDonationHistory);

/**
 * GET /api/donations/campaign/:campaignId
 * Get all donations to a specific campaign (creator only)
 */
router.get('/campaign/:campaignId', donationController.getCampaignDonations);

/**
 * GET /api/donations/escrow/:campaignId
 * Get escrow contract balance and status
 */
router.get('/escrow/:campaignId', donationController.getEscrowStatus);

module.exports = router;
