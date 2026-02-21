import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Guardian Admin Panel - V5 Dispute Resolution
 * Shows disputed milestones and guardian action buttons
 */
const GuardianPanel = ({ campaignId }) => {
  const [disputedMilestones, setDisputedMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  const fetchDisputedMilestones = async () => {
    try {
      setIsLoading(true);
      const authHeader = `Bearer ${localStorage.getItem('token')}`;
      
      const response = await fetch(`${BACKEND_URL}/milestones/campaign/${campaignId}`, {
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      if (data.success) {
        const disputed = (data.data.milestones || []).filter(m => m.status === 'disputed');
        setDisputedMilestones(disputed);
      }
    } catch (error) {
      console.error('Error fetching disputed milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuardianAction = async (milestoneId, action) => {
    const actions = {
      resume: {
        endpoint: 'resume',
        confirm: 'Resume this milestone? This will restart the 48-hour cooling period.',
        success: 'Milestone resumed. 48-hour timer restarted.'
      },
      cancel: {
        endpoint: 'cancel',
        confirm: 'Cancel this milestone? Funds will return to the pool. Creator must submit new milestone.',
        success: 'Milestone cancelled. Funds returned to pool.'
      },
      killProject: {
        endpoint: `campaign/${campaignId}/cancel-project`,
        confirm: '🚨 KILL SWITCH 🚨\n\nThis will CANCEL THE ENTIRE PROJECT and enable donor refunds.\n\nThis action is IRREVERSIBLE.\n\nProceed only if you have confirmed this is a scam.',
        success: 'Project cancelled. Donors can now claim refunds.'
      }
    };

    const actionConfig = actions[action];
    if (!window.confirm(actionConfig.confirm)) {
      return;
    }

    try {
      setActionInProgress(milestoneId);
      
      const response = await fetch(`${BACKEND_URL}/milestones/${actionConfig.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${actionConfig.success}\nTx: ${data.txHash?.substring(0, 20)}...`);
        fetchDisputedMilestones();
      } else {
        alert(`❌ ${data.message || 'Action failed'}`);
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      alert(`Failed to ${action}: ${error.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading disputes...</span>
        </div>
      </div>
    );
  }

  if (disputedMilestones.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="ml-3 text-green-800 font-semibold">No active disputes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-red-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Guardian Panel</h3>
            <p className="text-red-100 text-sm">{disputedMilestones.length} Disputed Milestone{disputedMilestones.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={fetchDisputedMilestones}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Disputed Milestones */}
      <div className="p-6 space-y-4">
        {disputedMilestones.map((milestone, index) => (
          <div key={milestone._id} className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    DISPUTE #{index + 1}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{parseInt(milestone.amount).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{milestone.description}</p>
                {milestone.proofDocuments?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {milestone.proofDocuments.map((doc, idx) => (
                      <a
                        key={idx}
                        href={`${BACKEND_URL.replace(/\/api\/?$/, '')}/${doc.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        📄 {doc.filename}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Veto Stats */}
            <div className="bg-white rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Veto Weight:</span>
                <span className="font-semibold text-red-700">
                  {milestone.vetoWeight ? `${milestone.vetoWeight} USDC` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Threshold Reached:</span>
                <span className="font-semibold text-red-700">
                  {milestone.vetoPercentage ? `${milestone.vetoPercentage}% (>10% required)` : 'Yes'}
                </span>
              </div>
            </div>

            {/* Guardian Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleGuardianAction(milestone._id, 'resume')}
                disabled={actionInProgress === milestone._id}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume
              </button>
              
              <button
                onClick={() => handleGuardianAction(milestone._id, 'cancel')}
                disabled={actionInProgress === milestone._id}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              
              <button
                onClick={() => handleGuardianAction(milestone._id, 'killProject')}
                disabled={actionInProgress === milestone._id}
                className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Kill
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-600 space-y-1">
              <p>• <strong>Resume:</strong> False alarm, restart 48h timer</p>
              <p>• <strong>Cancel:</strong> Bad receipt, funds return to pool</p>
              <p>• <strong>Kill:</strong> Scam detected, enable all refunds</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

GuardianPanel.propTypes = {
  campaignId: PropTypes.string.isRequired
};

export default GuardianPanel;
