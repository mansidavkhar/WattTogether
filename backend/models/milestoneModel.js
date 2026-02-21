const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'disputed', 'released', 'cancelled'],
    default: 'pending'
  },
  // V6: Veto votes are tracked on-chain, not in DB
  // Use escrowContract.getMilestone() to get vetoWeight
  vetoVoters: [
    {
      voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      },
      walletAddress: String,
      weight: Number, // USDC amount (contribution)
      timestamp: Date
    }
  ],
  onChainId: String,
  txHash: String,
  releaseTxHash: String,
  votingEndDate: Date,
  releasedAt: Date,
  proofHash: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty for backward compatibility
        // Validate IPFS CID format (CIDv0 or CIDv1)
        return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[1-9A-Za-z]{49,})$/.test(v);
      },
      message: 'Invalid IPFS CID format'
    }
  },
  proofUrl: {
    type: String
  },
  discussionHash: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[1-9A-Za-z]{49,})$/.test(v);
      },
      message: 'Invalid IPFS CID format'
    }
  },
  proofDocuments: [
    {
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      // Document voting for authenticity
      upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      }],
      downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      }]
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Milestone', milestoneSchema);
