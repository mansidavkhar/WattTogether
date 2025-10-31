const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/authMiddleware'); // Your existing authentication middleware
const Campaign = require('../models/campaignModel'); // Your Campaign model
const Donation = require('../models/donationModel'); // A new Donation model
const User = require('../models/memberModel'); // Your User model

// @route   POST api/payments/record-donation
// @desc    Record a successful on-chain donation
// @access  Private
router.post(
  '/record-donation',
  [
    auth,
    [
      check('campaignId', 'Campaign ID is required').not().isEmpty(),
      check('amount', 'Amount is required').isNumeric(),
      check('currency', 'Currency is required').not().isEmpty(),
      check('txHash', 'Transaction hash is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { campaignId, amount, currency, txHash } = req.body;
    const memberId = req.user.id; // From auth middleware

    try {
      // 1. Find the campaign and user
      const campaign = await Campaign.findById(campaignId);
      const user = await User.findById(memberId);

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // 2. Check for duplicate transaction hash to prevent double-recording
      let existingDonation = await Donation.findOne({ txHash });
      if (existingDonation) {
        return res.status(400).json({ success: false, message: 'This transaction has already been recorded.' });
      }

      // 3. Create and save the new donation record
      const newDonation = new Donation({
        member: memberId,
        campaign: campaignId,
        amount,
        currency,
        txHash,
        // You might want to store the INR amount too if Coinbase provides it
      });

      await newDonation.save();

      // 4. Update the campaign's raised amount
      // Make sure to handle different currencies if you accept more than USDC
      campaign.raisedAmount = (campaign.raisedAmount || 0) + parseFloat(amount);
      
      // Add the donor to the campaign's donor list if not already present
      if (!campaign.donors.some(donor => donor.user.toString() === memberId)) {
        campaign.donors.push({ user: memberId, amount: parseFloat(amount) });
      } else {
        // Find the donor and update their total
        campaign.donors.forEach(donor => {
            if (donor.user.toString() === memberId) {
                donor.amount = (donor.amount || 0) + parseFloat(amount);
            }
        });
      }
      
      await campaign.save();
      
      // 5. Add donation to user's history
      user.donations = user.donations || [];
      user.donations.push(newDonation._id);
      await user.save();

      res.json({ success: true, message: 'Donation recorded successfully', donation: newDonation });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },
);

module.exports = router;

