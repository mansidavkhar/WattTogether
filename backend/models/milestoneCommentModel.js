const mongoose = require('mongoose');

const milestoneCommentSchema = new mongoose.Schema({
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  commentType: {
    type: String,
    enum: ['support', 'concern', 'question', 'general'],
    default: 'general'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
milestoneCommentSchema.index({ milestone: 1, createdAt: -1 });
milestoneCommentSchema.index({ campaign: 1, createdAt: -1 });
milestoneCommentSchema.index({ author: 1 });

// Virtual for checking if comment is within dispute window
milestoneCommentSchema.virtual('isWithinDisputeWindow').get(function() {
  // This should be checked against the milestone's disputeEnds timestamp
  // Will be populated when fetching with milestone data
  return true; // Placeholder - actual logic in controller
});

module.exports = mongoose.model('MilestoneComment', milestoneCommentSchema);
