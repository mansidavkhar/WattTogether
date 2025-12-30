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
    enum: ['pending', 'approved', 'rejected', 'released'],
    default: 'pending'
  },
  votes: [
    {
      voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      },
      vote: {
        type: String,
        enum: ['up', 'down']
      },
      timestamp: Date
    }
  ],
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  onChainId: String,
  txHash: String,
  releaseTxHash: String,
  votingEndDate: Date,
  releasedAt: Date,
  proofDocuments: [
    {
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Milestone', milestoneSchema);
