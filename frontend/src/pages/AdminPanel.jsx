import { useState, useEffect } from 'react';
import { useMemberAuth } from '../hooks/useMemberAuth';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { getAuthHeader } = useMemberAuth();
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
  const GUARDIAN_ADDRESS = import.meta.env.VITE_GUARDIAN_ADDRESS; // Your relayer wallet

  useEffect(() => {
    fetchDisputedMilestones();
  }, []);

  const fetchDisputedMilestones = async () => {
    try {
      setIsLoading(true);
      const authHeader = await getAuthHeader();
      
      // Fetch all campaigns (active and funded)
      const response = await fetch(`${BACKEND_URL}/campaigns`, {
        headers: { 'Authorization': authHeader }
      });
      
      const data = await response.json();
      // Filter for campaigns that have escrow contracts
      const campaigns = (data.campaigns || []).filter(c => c.escrowContractAddress);
      
      console.log(`📊 Found ${campaigns.length} campaigns with contracts`);

      // Fetch milestones for each campaign and filter disputed ones
      const allDisputes = [];
      
      for (const campaign of campaigns) {
        const milestoneResponse = await fetch(
          `${BACKEND_URL}/milestones/campaign/${campaign._id}`,
          { headers: { 'Authorization': authHeader } }
        );
        
        const milestoneData = await milestoneResponse.json();
        const allMilestones = milestoneData.data?.milestones || [];
        
        console.log(`📋 Campaign "${campaign.title}": ${allMilestones.length} milestones`);
        allMilestones.forEach(m => {
          console.log(`   - Milestone: ${m.description?.substring(0, 30)} | Status: ${m.status}`);
        });
        
        // Filter disputed milestones, but exclude if campaign is cancelled
        const disputedMilestones = allMilestones
          .filter(m => m.status === 'disputed' && campaign.status !== 'cancelled')
          .map(m => ({ ...m, campaign }));
        
        if (disputedMilestones.length > 0) {
          console.log(`⚠️  Found ${disputedMilestones.length} disputed milestone(s) in "${campaign.title}"`);
        }
        
        // Skip if campaign is cancelled
        if (campaign.status === 'cancelled') {
          console.log(`🚫 Campaign "${campaign.title}" is cancelled - skipping all milestones`);
          continue;
        }
        
        allDisputes.push(...disputedMilestones);
      }

      console.log(`\n🛡️ Total disputes found: ${allDisputes.length}`);
      setDisputes(allDisputes);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeRequest = async (milestoneId, campaignId) => {
    if (!window.confirm('Resume this milestone? The cooling period will restart and funds can be released after 48 hours.')) {
      return;
    }

    try {
      setProcessing(milestoneId);
      const authHeader = await getAuthHeader();

      const response = await fetch(
        `${BACKEND_URL}/milestones/${milestoneId}/resume`,
        {
          method: 'POST',
          headers: { 'Authorization': authHeader }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Milestone resumed! Cooling period restarted.');
        fetchDisputedMilestones();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error resuming milestone:', error);
      alert('Failed to resume milestone');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelMilestone = async (milestoneId, campaignId) => {
    if (!window.confirm('⚠️ Cancel this milestone? Funds will stay in pool, creator must submit a new milestone with better proof.')) {
      return;
    }

    try {
      setProcessing(milestoneId);
      const authHeader = await getAuthHeader();

      const response = await fetch(
        `${BACKEND_URL}/milestones/${milestoneId}/cancel`,
        {
          method: 'POST',
          headers: { 'Authorization': authHeader }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Milestone cancelled! Creator must submit new milestone.');
        fetchDisputedMilestones();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error cancelling milestone:', error);
      alert('Failed to cancel milestone');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelProject = async (campaignId, campaignTitle) => {
    if (!window.confirm(`🚨 KILL SWITCH - Cancel entire project "${campaignTitle}"?\n\nThis will:\n- Cancel the entire campaign\n- Enable pro-rata refunds for all donors\n- Cannot be undone\n\nOnly use for confirmed scams!`)) {
      return;
    }

    try {
      setProcessing(campaignId);
      const authHeader = await getAuthHeader();

      const response = await fetch(
        `${BACKEND_URL}/milestones/campaign/${campaignId}/cancel-project`,
        {
          method: 'POST',
          headers: { 'Authorization': authHeader }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('🚨 Project cancelled! All donors can now claim refunds.');        // Refresh the disputes list to remove cancelled campaign's milestones        fetchDisputedMilestones();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error cancelling project:', error);
      alert('Failed to cancel project');
    } finally {
      setProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🛡️ Guardian Admin Panel</h1>
              <p className="text-gray-600">
                Review and resolve disputed milestones | Guardian: <span className="font-mono text-sm">{GUARDIAN_ADDRESS.substring(0, 10)}...</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-orange-700">{disputes.length}</p>
                <p className="text-sm text-orange-600">Active Disputes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear! 🎉</h3>
            <p className="text-gray-600">No disputed milestones requiring attention.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute._id} className="bg-white rounded-lg shadow-sm border-2 border-orange-300 overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{dispute.campaign.title}</h3>
                      <p className="text-sm text-gray-600">Campaign ID: {dispute.campaign._id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-700">₹{parseInt(dispute.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-600">${(dispute.amount * 0.012).toFixed(2)} USDC</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Milestone Description:</p>
                    <p className="text-gray-900">{dispute.description}</p>
                  </div>

                  {/* Veto Stats */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-red-700">Veto Weight</span>
                      <span className="text-lg font-bold text-red-800">
                        {dispute.vetoWeight} / {dispute.totalRaised} USDC ({((dispute.vetoWeight / dispute.totalRaised) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{ width: `${Math.min(100, (dispute.vetoWeight / dispute.totalRaised) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Threshold: 10% | Current: {((dispute.vetoWeight / dispute.totalRaised) * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Proof Documents */}
                  {dispute.proofDocuments && dispute.proofDocuments.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Proof Documents:</p>
                      <div className="space-y-1">
                        {dispute.proofDocuments.map((doc, idx) => (
                          <a
                            key={idx}
                            href={`${BACKEND_URL.replace(/\/api\/?$/, '')}/${doc.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {doc.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guardian Actions */}
                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Guardian Actions:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Resume */}
                      <button
                        onClick={() => handleResumeRequest(dispute._id, dispute.campaign._id)}
                        disabled={processing === dispute._id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resume (False Alarm)
                      </button>

                      {/* Cancel Milestone */}
                      <button
                        onClick={() => handleCancelMilestone(dispute._id, dispute.campaign._id)}
                        disabled={processing === dispute._id}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Milestone
                      </button>

                      {/* Kill Project */}
                      <button
                        onClick={() => handleCancelProject(dispute.campaign._id, dispute.campaign.title)}
                        disabled={processing === dispute.campaign._id}
                        className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                        🚨 Kill Project
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      <strong>Resume:</strong> Restart cooling period | <strong>Cancel Milestone:</strong> Creator must re-submit | <strong>Kill:</strong> Refunds enabled
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
