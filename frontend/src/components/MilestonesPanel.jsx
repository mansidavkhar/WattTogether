import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMemberAuth } from '../hooks/useMemberAuth';

const MilestonesPanel = ({ campaignId, creatorId, campaignStatus }) => {
  const { authenticated, getAuthHeader, walletAddress, memberData } = useMemberAuth();
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasVotingPower, setUserHasVotingPower] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [votingResult, setVotingResult] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [isReleasingFunds, setIsReleasingFunds] = useState(null);
  const [newMilestone, setNewMilestone] = useState({
    amount: '',
    description: '',
    proofDocuments: []
  });

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
  const hasFetchedMemberId = useRef(false);
  
  // Check if current user is the creator
  const creatorOwnerId = typeof creatorId === 'object' ? creatorId._id : creatorId;
  const isCreator = currentMemberId && creatorOwnerId && (currentMemberId === creatorOwnerId);

  // Fetch current member ID on mount
  useEffect(() => {
    const fetchMemberId = async () => {
      if (!authenticated || hasFetchedMemberId.current) return;
      hasFetchedMemberId.current = true;
      
      try {
        const authHeader = await getAuthHeader();
        if (!authHeader) return;

        const response = await fetch(`${BACKEND_URL}/members/me`, {
          headers: { 'Authorization': authHeader }
        });

        const data = await response.json();
        if (data.success && data.member) {
          setCurrentMemberId(data.member._id);
          console.log('✅ Member ID fetched:', data.member._id);
        }
      } catch (error) {
        console.error('Error fetching member ID:', error);
        hasFetchedMemberId.current = false; // Allow retry on error
      }
    };

    fetchMemberId();
  }, [authenticated]); // Only depend on authenticated

  useEffect(() => {
    if (campaignId && authenticated) {
      fetchMilestones();
    }
  }, [campaignId, authenticated]); // Removed getAuthHeader to prevent infinite loop

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/milestones/campaign/${campaignId}`, {
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      console.log('🔍 Milestones API Response:', data);
      
      if (data.success) {
        setMilestones(data.data.milestones || []);
        setUserHasVotingPower(data.data.userHasVotingPower || false);
        console.log('📊 Voting Check:', {
          count: data.data.milestones?.length || 0,
          userHasVotingPower: data.data.userHasVotingPower,
          isCreator,
          authenticated,
          memberId: currentMemberId
        });
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setIsCreatingMilestone(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('campaignId', campaignId);
      formData.append('amount', parseInt(newMilestone.amount));
      formData.append('description', newMilestone.description);
      
      // Append files
      newMilestone.proofDocuments.forEach(file => {
        formData.append('proofDocuments', file);
      });

      const response = await fetch(`${BACKEND_URL}/milestones/submit`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setNewMilestone({ amount: '', description: '', proofDocuments: [] });
        fetchMilestones();
      } else {
        alert(data.message || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Failed to create milestone');
    } finally {
      setIsCreatingMilestone(false);
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

      setIsReleasingFunds(milestoneId);

      const response = await fetch(`${BACKEND_URL}/milestones/${milestoneId}/release`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      console.log('Release funds response:', data);

      if (data.success) {
        alert(`✅ Funds released successfully!\nTransaction: ${data.data.txHash.substring(0, 20)}...`);
        fetchMilestones();
      } else {
        alert(`❌ ${data.message || 'Failed to release funds'}`);
      }
    } catch (error) {
      console.error('Release funds error:', error);
      alert('Failed to release funds: ' + error.message);
    } finally {
      setIsReleasingFunds(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      released: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#508C9B]"></div>
      </div>
    );
  }

  // Check if campaign is funded
  const isFunded = campaignStatus === 'funded';

  // Show message if campaign is not funded
  if (!isFunded) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-8 mt-8 border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Milestones Locked</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Milestone creation and voting will be available once this campaign reaches its funding goal. 
            Back this project to help unlock transparent fund management!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#134B70] to-[#508C9B] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
        </div>
        
        {isCreator && authenticated && (() => {
          const allMilestonesReleased = milestones.length > 0 && milestones.every(m => m.status === 'released');
          
          if (allMilestonesReleased) {
            return (
              <div className="bg-blue-50 border border-blue-500 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-700 font-semibold">✅ All Funds Released</p>
              </div>
            );
          }
          
          return (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-[#134B70] to-[#508C9B] hover:opacity-90 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{showCreateForm ? 'Cancel' : 'Create Milestone'}</span>
            </button>

        );
      })()}
      </div>

      {/* Create Milestone Form */}
      {showCreateForm && isCreator && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#134B70] to-[#508C9B] px-6 py-3">
            <h3 className="text-white font-semibold text-lg">New Milestone</h3>
          </div>
          <form onSubmit={handleCreateMilestone} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={newMilestone.amount}
                    onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#508C9B] focus:border-transparent"
                    placeholder="Enter amount in INR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#508C9B] focus:border-transparent"
                    rows="4"
                    placeholder="Describe what this milestone will achieve..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Proof Documents (Optional)
                    <span className="text-xs text-gray-500 ml-2">Max 5 files, 10MB each (PDF, Images, Word)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 5) {
                        alert('Maximum 5 files allowed');
                        e.target.value = '';
                        return;
                      }
                      setNewMilestone({ ...newMilestone, proofDocuments: files });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#508C9B] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#508C9B] file:text-white hover:file:bg-[#134B70]"
                  />
                  {newMilestone.proofDocuments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {newMilestone.proofDocuments.length} file(s) selected
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isCreatingMilestone}
                  className="w-full bg-gradient-to-r from-[#134B70] to-[#508C9B] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreatingMilestone ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Submit Milestone</span>
                  )}
                </button>
          </form>
        </div>
      )}

      {/* Voting Result Alert */}
      {votingResult && (
        <div className={`p-4 rounded-lg border-l-4 ${
          votingResult.status === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          <p className="font-semibold">{votingResult.message}</p>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 text-lg">No milestones yet</p>
          {isCreator && (
            <p className="text-gray-400 text-sm mt-2">Create your first milestone to start tracking progress</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.map((milestone, index) => {
            const totalVotes = (milestone.upvotes || 0) + (milestone.downvotes || 0);
            const approvalRate = totalVotes > 0
              ? Math.round(((milestone.upvotes || 0) / totalVotes) * 100)
              : 0;

            return (
              <div
                key={milestone._id}
                className="bg-white border border-gray-200 rounded-md hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                    <span className={`px-2 py-0.5 text-sm font-medium rounded ${
                      milestone.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      milestone.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      milestone.status === 'released' ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-gray-900">₹{parseInt(milestone.amount).toLocaleString()}</span>
                </div>

                {/* Content */}
                <div className="px-4 py-3 space-y-3">
                  <p className="text-base text-gray-700 leading-relaxed">{milestone.description}</p>

                  {/* Documents */}
                  {milestone.proofDocuments && milestone.proofDocuments.length > 0 && (
                    <div className="border-l-2 border-blue-200 pl-3 py-1">
                      <p className="text-sm font-medium text-gray-600 mb-1.5">Documents</p>
                      <div className="space-y-1">
                        {milestone.proofDocuments.map((doc, idx) => (
                          <a
                            key={idx}
                            href={`${BACKEND_URL.replace(/\/api\/?$/, '')}/${doc.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate">{doc.filename}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voting Progress */}
                  {milestone.status === 'pending' && (
                    <div className="bg-gray-50 rounded px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-600">Approval Rate</span>
                        <span className="text-sm font-semibold text-gray-900">{approvalRate}%</span>
                      </div>
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            approvalRate >= 50 ? 'bg-green-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${approvalRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-sm text-gray-500">
                        <span>{milestone.upvotes || 0} ✓</span>
                        <span>{totalVotes} total</span>
                        <span>{milestone.downvotes || 0} ✕</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {authenticated && userHasVotingPower && milestone.status === 'pending' && !isCreator && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleVote(milestone._id, 'up')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVote(milestone._id, 'down')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {isCreator && milestone.status === 'approved' && (
                    <button
                      onClick={() => handleReleaseFunds(milestone._id)}
                      disabled={isReleasingFunds === milestone._id}
                      className="w-full bg-[#508C9B] hover:bg-[#3d6f7c] disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isReleasingFunds === milestone._id ? (
                        <>
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        'Release Funds'
                      )}
                    </button>
                  )}

                  {milestone.status === 'released' && (
                    <div className="text-center py-2 text-sm text-blue-600 font-medium">
                      ✓ Funds Released
                    </div>
                  )}
                  {milestone.status === 'rejected' && (
                    <div className="text-center py-2 text-sm text-red-600 font-medium">
                      ✕ Rejected by Voters
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      {authenticated && !isCreator && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-blue-700">
                {userHasVotingPower 
                  ? "As a backer, you can vote on pending milestones. A milestone needs >50% approval to release funds."
                  : "Only backers who have donated to this campaign can vote on milestones."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MilestonesPanel.propTypes = {
  campaignId: PropTypes.string.isRequired,
  creatorId: PropTypes.string,
  campaignStatus: PropTypes.string.isRequired
};

export default MilestonesPanel;
