const mongoose = require('mongoose');

// Campaign: fundraising phase only
// When a campaign completes successfully (goal reached within deadline),
// it can be transitioned to a Project entry (see projectModel.js).

const campaignSchema = new mongoose.Schema(
  {
    // Owner (Member) starting the campaign
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },

    // Basic details (from Start a Campaign form)
    title: { type: String, required: true, trim: true },
    fundingType: {
      type: String,
      enum: ['reward', 'donation', 'equity', 'debt', 'other'],
      default: 'donation',
      lowercase: true,
      trim: true,
    },
    fundingGoalINR: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    aboutEntrepreneur: { type: String },

    // Dates
    fundingDeadline: { type: Date, required: true },
    projectDeadline: { type: Date },

    // Media
    coverImageUrl: { type: String }, // URL to uploaded image (store on CDN/S3 or any hosting)

    // Funding progress
    amountRaisedINR: { type: Number, default: 0, min: 0 },
    backersCount: { type: Number, default: 0, min: 0 },

    // State machine for campaign lifecycle
    status: {
      type: String,
      enum: ['draft', 'active', 'funded', 'failed', 'cancelled'],
      default: 'active',
      index: true,
    },

    // --- ADD THIS FIELD ---
    escrowContractAddress: {
      type: String,
      required: true,
    },
    // ----------------------

    // Optional tags/categories for browse
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Helpful computed properties
campaignSchema.virtual('isFunded').get(function () {
  return this.amountRaisedINR >= this.fundingGoalINR;
});

module.exports = mongoose.model('Campaign', campaignSchema);
