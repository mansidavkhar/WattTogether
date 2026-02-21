import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMemberAuth } from '../hooks/useMemberAuth';

/**
 * Discussion/Comments Component for Individual Milestones
 * Attached to each milestone card on campaign description page
 * ONLY ACTIVE during 48-hour cooling period (PENDING_RELEASE or DISPUTED status)
 * ONLY DONORS and CREATOR can comment
 */
const MilestoneDiscussion = ({ milestoneId, campaignId, milestoneStatus, releaseableAt, userHasVotingPower, isCreator, isExpanded, onToggle }) => {
  const { authenticated, getAuthHeader, memberData } = useMemberAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  // Calculate if discussion period is still active
  useEffect(() => {
    if (!releaseableAt) return;

    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const releaseTimestamp = new Date(releaseableAt).getTime() / 1000;
      const difference = releaseTimestamp - now;

      setTimeRemaining(difference);
    };

    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [releaseableAt]);

  const isDiscussionPeriodActive = milestoneStatus === 'pending' && timeRemaining > 0;

  // Fetch comments when expanded
  useEffect(() => {
    if (isExpanded && authenticated) {
      fetchComments();
    }
  }, [isExpanded, milestoneId, authenticated]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const authHeader = await getAuthHeader();
      
      const response = await fetch(
        `${BACKEND_URL}/milestone-comments/milestone/${milestoneId}`,
        { headers: { 'Authorization': authHeader } }
      );

      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const authHeader = await getAuthHeader();

      const response = await fetch(`${BACKEND_URL}/milestone-comments`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestoneId,
          campaignId,
          content: newComment.trim(),
          commentType
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
        setCommentType('general');
      } else {
        alert(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommentTypeColor = (type) => {
    const colors = {
      support: 'bg-green-100 text-green-800 border-green-300',
      concern: 'bg-red-100 text-red-800 border-red-300',
      question: 'bg-blue-100 text-blue-800 border-blue-300',
      general: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[type] || colors.general;
  };

  const getCommentTypeIcon = (type) => {
    const icons = {
      support: '👍',
      concern: '⚠️',
      question: '❓',
      general: '💬'
    };
    return icons[type] || icons.general;
  };

  if (!isExpanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 rounded-lg py-2.5 px-4 text-sm text-gray-700 font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        💬 Discussion ({comments.length || 0})
        {milestoneStatus === 'pending' && timeRemaining > 0 && (
          <span className="text-xs text-amber-600 ml-1">
            ({Math.floor(timeRemaining / 3600)}h left)
          </span>
        )}
        {milestoneStatus === 'disputed' && (
          <span className="text-xs text-red-600 ml-1">(Disputed)</span>
        )}
      </button>
    );
  }

  return (
    <div className="border-t border-gray-200 mt-3 pt-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#508C9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Discussion ({comments.length})
          {milestoneStatus === 'pending' && timeRemaining > 0 && (
            <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              ⏳ {Math.floor(timeRemaining / 3600)}h {Math.floor((timeRemaining % 3600) / 60)}m left
            </span>
          )}
          {milestoneStatus === 'disputed' && (
            <span className="text-xs font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              ⚠️ Disputed
            </span>
          )}
        </h4>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Warning if discussion period is ending soon or expired */}
      {milestoneStatus === 'pending' && timeRemaining !== null && timeRemaining <= 7200 && timeRemaining > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
          ⚠️ Discussion closing soon - Less than 2 hours remaining in cooling period
        </div>
      )}

      {milestoneStatus === 'pending' && timeRemaining !== null && timeRemaining <= 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm font-medium text-gray-600">Discussion Period Ended</p>
          <p className="text-xs text-gray-500 mt-1">48-hour cooling period has expired. Milestone ready for release.</p>
        </div>
      )}

      {/* Discussion Guidelines */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-900 mb-1">Discussion Guidelines</p>
            <ul className="text-xs text-blue-700 space-y-0.5">
              <li>• <strong>💬 General:</strong> Ask questions, share updates, discuss progress</li>
              <li>• <strong>👍 Support:</strong> Encourage legitimate work, positive feedback</li>
              <li>• <strong>⚠️ Concern:</strong> Flag suspicious activity, request clarification</li>
              <li>• <strong>❓ Question:</strong> Ask for proof, timeline details, or documentation</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2 border-t border-blue-200 pt-2">
              💡 <strong>This discussion is only open during the 48-hour cooling period.</strong> Use it to vet milestones before they auto-release. If concerns reach 10% veto threshold, the milestone is disputed.
            </p>
          </div>
        </div>
      </div>

      {/* Non-donor/non-creator message */}
      {authenticated && !userHasVotingPower && !isCreator && isDiscussionPeriodActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-sm text-amber-800">
            💡 <strong>Only project donors and the creator can comment during the cooling period.</strong><br/>
            <span className="text-xs">Donate to this campaign to participate in milestone discussions and governance.</span>
          </p>
        </div>
      )}

      {/* Comment Form - Only for donors and creator during cooling period */}
      {authenticated && (userHasVotingPower || isCreator) && isDiscussionPeriodActive && (
        <form onSubmit={handleSubmitComment} className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex gap-2 text-xs">
            {['general', 'support', 'concern', 'question'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCommentType(type)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  commentType === type
                    ? 'bg-[#508C9B] text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-[#508C9B]'
                }`}
              >
                {getCommentTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this milestone... Be constructive and specific."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#508C9B] focus:border-transparent resize-none"
            rows={3}
            maxLength={2000}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {newComment.length}/2000 characters
              </span>
              {newComment.length > 0 && newComment.length < 10 && (
                <span className="text-xs text-amber-600">
                  ⚠️ Too short - be specific
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="bg-[#508C9B] hover:bg-[#3d6f7c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {!authenticated && isDiscussionPeriodActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm font-semibold text-blue-800 mb-1">
            Please log in to join the discussion
          </p>
          <p className="text-xs text-blue-600">
            This 48-hour discussion helps the community vet milestones before auto-release
          </p>
        </div>
      )}

      {/* Disputed status info */}
      {milestoneStatus === 'disputed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Milestone Under Review</p>
              <p className="text-xs text-red-600 mt-1">
                This milestone has been vetoed and is awaiting guardian decision. Discussion remains open during review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#508C9B]"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#134B70] to-[#508C9B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {comment.author?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {comment.author?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {comment.isEdited && <span className="ml-1">(edited)</span>}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCommentTypeColor(comment.commentType)}`}>
                  {getCommentTypeIcon(comment.commentType)} {comment.commentType}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

MilestoneDiscussion.propTypes = {
  milestoneId: PropTypes.string.isRequired,
  campaignId: PropTypes.string.isRequired,
  milestoneStatus: PropTypes.string.isRequired,
  releaseableAt: PropTypes.string,
  userHasVotingPower: PropTypes.bool.isRequired,
  isCreator: PropTypes.bool.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default MilestoneDiscussion;
