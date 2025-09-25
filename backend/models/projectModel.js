const mongoose = require('mongoose');

// Project: post-funding phase. Created when a Campaign reaches its goal before deadline.
// Keeps linkage to the original campaign and the owner (Member).

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    sourceCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    aboutEntrepreneur: { type: String },
    coverImageUrl: { type: String },

    fundingType: { type: String, enum: ['Reward Based', 'Donation', 'Equity', 'Debt', 'Other'], default: 'Reward Based' },
    fundingGoalINR: { type: Number, required: true, min: 0 },
    amountRaisedINR: { type: Number, required: true, min: 0 },
    backersCount: { type: Number, default: 0, min: 0 },

    projectDeadline: { type: Date },

    // Project lifecycle status after funding
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'on-hold', 'cancelled'],
      default: 'ongoing',
      index: true,
    },

    // Optional logs/updates for investors/community
    updates: [
      {
        title: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
