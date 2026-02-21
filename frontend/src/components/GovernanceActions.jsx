import { useState } from 'react';
import PropTypes from 'prop-types';
import { useMemberAuth } from '../hooks/useMemberAuth';
import { convertINRtoUSDC, convertINRtoEUR, INR_TO_USDC_RATE } from '../utils/currencyUtils';

/**
 * Veto and Rage Quit Component for Governance
 * Shows at the top of milestones panel for donors
 */
const GovernanceActions = ({ campaignId, userHasVotingPower, onRageQuit }) => {
  const { authenticated, getAuthHeader } = useMemberAuth();
  const [refundAmount, setRefundAmount] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showRageQuitModal, setShowRageQuitModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  const calculateRefund = async () => {
    if (!authenticated) return;
    
    setIsCalculating(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/governance/campaigns/${campaignId}/rage-quit-preview`, {
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      if (data.success) {
        setRefundAmount(data.refundAmount);
        setShowRageQuitModal(true);
      } else {
        alert(data.message || 'Cannot calculate refund');
      }
    } catch (error) {
      console.error('Error calculating refund:', error);
      alert('Failed to calculate refund');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRageQuit = async () => {
    setIsProcessing(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/governance/campaigns/${campaignId}/rage-quit`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully withdrew ${data.refundedAmount} USDC!`);
        setShowRageQuitModal(false);
        if (onRageQuit) onRageQuit();
      } else {
        alert(data.message || 'Rage quit failed');
      }
    } catch (error) {
      console.error('Error during rage quit:', error);
      alert('Failed to withdraw funds');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!authenticated || !userHasVotingPower) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
              <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your Governance Rights
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              As a donor, you can veto milestones you disagree with or withdraw your remaining funds at any time.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-green-700 border border-green-200">
                ✓ Veto Power
              </div>
              <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-blue-700 border border-blue-200">
                ✓ Exit Rights
              </div>
            </div>
          </div>
          <button
            onClick={calculateRefund}
            disabled={isCalculating}
            className="ml-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{isCalculating ? 'Calculating...' : 'Rage Quit'}</span>
          </button>
        </div>
      </div>

      {/* Rage Quit Confirmation Modal */}
      {showRageQuitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirm Rage Quit
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You are about to withdraw your remaining funds from this campaign. This action:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
                <li>Withdraws your proportional share of unreleased funds</li>
                <li>Removes your voting power for future milestones</li>
                <li><strong>Cannot be undone</strong></li>
              </ul>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Refund Amount</p>
                <p className="text-2xl font-bold text-green-700">
                  ${refundAmount?.toFixed(2) || '0.00'} USDC
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ≈ ₹{refundAmount > 0 ? (refundAmount / INR_TO_USDC_RATE).toFixed(2) : '0'} / €{refundAmount > 0 ? convertINRtoEUR(refundAmount / INR_TO_USDC_RATE).toFixed(2) : '0'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRageQuitModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRageQuit}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

GovernanceActions.propTypes = {
  campaignId: PropTypes.string.isRequired,
  userHasVotingPower: PropTypes.bool.isRequired,
  onRageQuit: PropTypes.func
};

export default GovernanceActions;
