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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          💰 Back This Project
        </h2>
        <p className="text-gray-600 mb-6">
          {campaign.title}
        </p>

        {/* Step 1: Amount Entry */}
        {step === '1_Amount' && (
          <form onSubmit={handleAmountSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                Donation Amount (INR)
              </label>
              <input
                type="number"
                value={inrAmount}
                onChange={(e) => setInrAmount(e.target.value)}
                placeholder="Enter amount in INR"
                min="100"
                step="100"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                Minimum donation: ₹100
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Continue to Confirm
            </button>
          </form>
        )}

        {/* Step 2: Confirmation */}
        {step === '2_Confirm' && (
          <div>
            {walletSyncing && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Syncing wallet address...
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Donation Amount:</span>
                <span className="font-bold text-lg">₹{parseFloat(inrAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Processing via Backend:</span>
                <span className="text-green-600">✓ Native Token</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gas covered by relayer:</span>
                <span className="text-green-600">✓ Free</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDonation}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Confirm Donation'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === '3_Processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">{successMessage}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please wait while your donation is being processed...
            </p>
          </div>
        )}

        {/* Step 4: Success */}
        {step === '4_Success' && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-green-700 mb-2">
                Donation Successful!
              </h3>
              <p className="text-green-600 text-sm mb-4">
                {successMessage}
              </p>
              {txHash && (
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Transaction Hash:</p>
                  <p className="text-xs font-mono break-all text-gray-800">
                    {txHash}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Close & View Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

DonationModalV2.propTypes = {
  campaign: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DonationModalV2;
