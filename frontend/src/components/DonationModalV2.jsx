import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMemberAuth } from '../hooks/useMemberAuth';

const DonationModalV2 = ({ 
  campaign, 
  onClose
}) => {
  const { authenticated, getAuthHeader, user } = useMemberAuth();
  const [inrAmount, setInrAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [walletSyncing, setWalletSyncing] = useState(false);
  
  // Donation flow state
  // '1_Amount', '2_Confirm', '3_Processing', '4_Success'
  const [step, setStep] = useState('1_Amount');
  const [txHash, setTxHash] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  // Sync wallet address from Privy if needed
  const syncWalletAddress = async () => {
    try {
      const walletAddress = user?.wallet?.address || user?.linkedAccounts?.find(
        account => account.type === 'wallet' && account.walletClient === 'privy'
      )?.address;

      if (!walletAddress) {
        console.warn('No wallet address found in Privy user');
        return false;
      }

      setWalletSyncing(true);
      const authHeader = await getAuthHeader();
      
      console.log('Syncing wallet address to backend:', walletAddress);
      
      const response = await fetch(`${BACKEND_URL}/members/save-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Wallet address synced successfully');
        return true;
      } else {
        console.error('Failed to sync wallet:', data.message);
        return false;
      }
    } catch (err) {
      console.error('Error syncing wallet:', err);
      return false;
    } finally {
      setWalletSyncing(false);
    }
  };

  // Step 1: Submit donation amount
  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (!inrAmount || isNaN(inrAmount) || inrAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setError('');
    setStep('2_Confirm');
  };

  // Step 2: Confirm and process donation
  const handleConfirmDonation = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setStep('3_Processing');
      setSuccessMessage('Processing your donation...');

      const authHeader = await getAuthHeader();
      console.log('🔐 Auth header:', authHeader ? '✅ Present' : '❌ Missing');
      
      if (!authHeader) {
        setError('Authentication failed. Please login again.');
        setStep('2_Confirm');
        return;
      }

      console.log(`📝 Submitting donation of ₹${inrAmount} to campaign ${campaign._id}`);
      console.log(`📡 API URL: ${BACKEND_URL}/donations/submit`);

      // Call backend donation API
      const response = await fetch(`${BACKEND_URL}/donations/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          campaignId: campaign._id,
          inrAmount: parseFloat(inrAmount)
        })
      });

      const data = await response.json();

      console.log('📊 API Response:', { status: response.status, success: data.success, message: data.message });

      if (!response.ok || !data.success) {
        const errorMsg = data.message || `Donation failed (${response.status})`;
        console.error('❌ API Error:', errorMsg);
        
        // If wallet address error, try to sync and retry
        if (errorMsg.includes('wallet address')) {
          console.log('Attempting to sync wallet address...');
          const synced = await syncWalletAddress();
          
          if (synced) {
            setError('Wallet synced. Please try again.');
          } else {
            setError('Please ensure you have a wallet connected. You may need to logout and login again.');
          }
        } else {
          setError(errorMsg);
        }
        
        setStep('2_Confirm');
        return;
      }

      // Success
      console.log(`✅ Donation processed:`, data.data);
      setTxHash(data.data.donation.txHash);
      setSuccessMessage(`✅ Donation of ₹${inrAmount} received!\n\nTransaction: ${data.data.donation.txHash}\n\nFunding: ${data.data.campaign.percentComplete}% complete`);
      setStep('4_Success');

      // Auto-close after 5 seconds
      setTimeout(() => {
        onClose(true);
      }, 5000);

    } catch (error) {
      console.error('❌ Donation error:', error);
      setError(error.message || 'Network error. Please try again.');
      setStep('2_Confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setInrAmount('');
    setError('');
    setSuccessMessage('');
    setStep('1_Amount');
    setTxHash('');
    onClose(false);
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Please Log In
          </h3>
          <p className="text-gray-600 mb-6">
            You need to be logged in to make a donation.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-slideUp">
        {/* Header with Close Button */}
        <div className="bg-gradient-to-r from-[#134B70] to-[#508C9B] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-white">
                Back This Project
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Campaign Title */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Campaign</p>
            <p className="text-gray-900 font-semibold line-clamp-2">
              {campaign.title}
            </p>
          </div>

          {/* Step 1: Amount Entry */}
          {step === '1_Amount' && (
            <form onSubmit={handleAmountSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">
                  Donation Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">₹</span>
                  <input
                    type="number"
                    value={inrAmount}
                    onChange={(e) => setInrAmount(e.target.value)}
                    placeholder="Enter amount in INR"
                    min="100"
                    step="100"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#508C9B] focus:ring-2 focus:ring-[#508C9B]/20 focus:outline-none font-semibold text-lg transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Minimum donation: ₹100
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#134B70] to-[#508C9B] hover:from-[#0d3a54] hover:to-[#3d6f7c] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Continue to Confirm
              </button>
            </form>
          )}

        {/* Step 2: Confirmation */}
        {step === '2_Confirm' && (
          <div>
            {walletSyncing && (
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm">Syncing wallet address...</span>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-xl mb-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Donation Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Amount</span>
                    <span className="font-bold text-xl text-gray-900">₹{parseFloat(inrAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Processing</span>
                    <span className="text-green-600 text-sm font-semibold flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Backend Relayer
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Gas Fees</span>
                    <span className="text-green-600 text-sm font-semibold flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Free
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('1_Amount')}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleConfirmDonation}
                  disabled={isProcessing}
                  className="flex-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Donation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === '3_Processing' && (
            <div className="text-center py-8">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute animate-ping rounded-full h-20 w-20 bg-blue-400 opacity-20"></div>
                <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#508C9B]"></div>
                <svg className="absolute w-8 h-8 text-[#508C9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Processing Donation</h3>
              <p className="text-gray-600 text-sm mb-4">{successMessage}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-xs text-blue-800 flex items-start">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Please wait while your donation is being processed on the blockchain...</span>
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === '4_Success' && (
            <div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  Donation Successful!
                </h3>
                <p className="text-green-700 mb-1">
                  Thank you for supporting this campaign
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{parseFloat(inrAmount).toLocaleString()}
                </p>
              </div>

              {txHash && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Transaction Details</p>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                    <p className="text-xs font-mono break-all text-gray-800">
                      {txHash}
                    </p>
                  </div>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Polygonscan
                  </a>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-[#201E43] hover:bg-[#16152e] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Campaign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DonationModalV2.propTypes = {
  campaign: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DonationModalV2;
