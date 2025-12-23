import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMemberAuth } from '../hooks/useMemberAuth';

const MilestonesPanel = ({ campaignId, creatorId }) => {
  const { authenticated, getAuthHeader, walletAddress } = useMemberAuth();
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasVotingPower, setUserHasVotingPower] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [votingResult, setVotingResult] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
  const isCreator = creatorId === walletAddress;

  useEffect(() => {
    fetchMilestones();
  }, [campaignId]);

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      const response = await fetch(`${BACKEND_URL}/milestones/campaign/${campaignId}`, {
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      if (data.success) {
        setMilestones(data.data.milestones);
        setUserHasVotingPower(data.data.userHasVotingPower);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (milestoneId, vote) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      const response = await fetch(`${BACKEND_URL}/milestones/${milestoneId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ vote })
      });

      const data = await response.json();
      if (data.success) {
        setVotingResult({
          status: 'success',
          message: `Vote recorded! Status: ${data.data.status}`,
          result: data.data
        });
        setTimeout(() => {
          fetchMilestones();
          setVotingResult(null);
          setSelectedMilestone(null);
        }, 2000);
      } else {
        setVotingResult({
          status: 'error',
          message: data.message
        });
      }
    } catch (error) {
      setVotingResult({
        status: 'error',
        message: 'Failed to submit vote'
      });
    }
  };

  const handleReleaseFunds = async (milestoneId) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      if (!window.confirm('Release funds for this approved milestone?')) return;

      const response = await fetch(`${BACKEND_URL}/milestones/${milestoneId}/release`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Funds released! Tx: ${data.data.txHash}`);
        fetchMilestones();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert('Failed to release funds');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading milestones...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        🏗️ Project Milestones
      </h2>

      {milestones.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No milestones yet</p>
          {isCreator && (
            <p className="text-sm text-gray-500 mt-2">
              Once the campaign reaches its goal, you can submit spending requests
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const totalVotes = (milestone.upvotes || 0) + (milestone.downvotes || 0);
            const approvalRate = totalVotes > 0 ? ((milestone.upvotes / totalVotes) * 100).toFixed(1) : 0;

            return (
              <div key={milestone._id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {milestone.description}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ₹{milestone.amount.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    milestone.status === 'approved' ? 'bg-green-100 text-green-800' :
                    milestone.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    milestone.status === 'released' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                  </span>
                </div>

                {/* Voting Display */}
                {totalVotes > 0 && (
                  <div className="mb-4 bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Voting Progress</span>
                      <span className="text-sm font-bold">{approvalRate}% Approval</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${approvalRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>✅ {milestone.upvotes} votes</span>
                      <span>❌ {milestone.downvotes} votes</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Vote Buttons */}
                  {userHasVotingPower && milestone.status === 'pending' && !selectedMilestone && (
                    <>
                      <button
                        onClick={() => setSelectedMilestone(milestone._id)}
                        className="flex-1 bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded hover:bg-blue-200 transition-colors text-sm"
                      >
                        💬 Vote Now
                      </button>
                    </>
                  )}

                  {/* Release Funds Button */}
                  {isCreator && milestone.status === 'approved' && (
                    <button
                      onClick={() => handleReleaseFunds(milestone._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded transition-colors text-sm"
                    >
                      💰 Release Funds
                    </button>
                  )}
                </div>

                {/* Voting Buttons */}
                {selectedMilestone === milestone._id && userHasVotingPower && milestone.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleVote(milestone._id, 'up')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition-colors"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleVote(milestone._id, 'down')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition-colors"
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => setSelectedMilestone(null)}
                      className="px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Voting Result Message */}
                {votingResult && selectedMilestone === milestone._id && (
                  <div className={`mt-3 p-2 rounded text-sm ${
                    votingResult.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {votingResult.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Project creators submit milestones (spending requests). 
          Donors vote to approve. Once approved (more than 50%), creators can release funds from the escrow.
        </p>
      </div>
    </div>
  );
};

MilestonesPanel.propTypes = {
  campaignId: PropTypes.string.isRequired,
  creatorId: PropTypes.string
};

export default MilestonesPanel;
