const MilestoneComment = require('../models/milestoneCommentModel');
const Milestone = require('../models/milestoneModel');
const Campaign = require('../models/campaignModel');

/**
 * Get all comments for a specific milestone
 */
const getMilestoneComments = async (req, res) => {
  try {
    const { milestoneId } = req.params;

    const comments = await MilestoneComment.find({ milestone: milestoneId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      comments,
      count: comments.length
    });

  } catch (error) {
    console.error('Error fetching milestone comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all comments for a campaign (across all milestones)
 */
const getCampaignComments = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const comments = await MilestoneComment.find({ campaign: campaignId })
      .populate('author', 'name email')
      .populate('milestone', 'description amount')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      comments,
      count: comments.length
    });

  } catch (error) {
    console.error('Error fetching campaign comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new comment on a milestone
 */
const createComment = async (req, res) => {
  try {
    const { milestoneId, campaignId, content, commentType = 'general' } = req.body;
    const authorId = req.member.id;

    // Validate inputs
    if (!milestoneId || !campaignId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: milestoneId, campaignId, content'
      });
    }

    if (content.trim().length === 0 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 1 and 2000 characters'
      });
    }

    // Verify milestone exists
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Create comment
    const comment = new MilestoneComment({
      milestone: milestoneId,
      campaign: campaignId,
      author: authorId,
      content: content.trim(),
      commentType: ['support', 'concern', 'question', 'general'].includes(commentType) 
        ? commentType 
        : 'general'
    });

    await comment.save();

    // Populate author info for response
    await comment.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: comment.toObject()
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an existing comment (author only)
 */
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const authorId = req.member.id;

    if (!content || content.trim().length === 0 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 1 and 2000 characters'
      });
    }

    const comment = await MilestoneComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== authorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate('author', 'name email');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: comment.toObject()
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a comment (author only or admin)
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const authorId = req.member.id;

    const comment = await MilestoneComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author (you could add admin check here)
    if (comment.author.toString() !== authorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    await MilestoneComment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getMilestoneComments,
  getCampaignComments,
  createComment,
  updateComment,
  deleteComment
};
