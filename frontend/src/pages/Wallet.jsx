import { useEffect, useState } from 'react';
import { useMemberAuth } from '../hooks/useMemberAuth';

const Wallet = () => {
  const { ready, authenticated, walletAddress: privyWallet, getAuthHeader } = useMemberAuth();
  const [walletAddress, setWalletAddress] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbError, setDbError] = useState(null);

  const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

  const fetchWalletFromBackend = async () => {
    try {
      setLoadingDb(true);
      const authHeader = await getAuthHeader();
      
      if (!authHeader) {
        setDbError("Not logged in.");
        setLoadingDb(false);
        return;
      }

      console.log('Fetching wallet with auth header:', authHeader.substring(0, 20) + '...');
      
      const response = await fetch(`${API_URL}/members/get-wallet`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Wallet fetch response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Wallet fetch error response:', errorText);
        throw new Error(`API error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Wallet data received:', data);
      
      if (data.walletAddress) {
        setWalletAddress(data.walletAddress);
      } else if (privyWallet) {
        // If Privy has wallet but backend doesn't, use Privy wallet
        console.log('Using Privy wallet:', privyWallet);
        setWalletAddress(privyWallet);
      } else {
        setDbError("Wallet address not found. It may take a moment for Privy to create your wallet.");
      }
    } catch (err) {
      console.error('Full wallet fetch error:', err);
      setDbError(`Failed to fetch wallet: ${err.message}`);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (ready && authenticated) {
      fetchWalletFromBackend();
    } else if (ready && !authenticated) {
      setDbError("Please log in to view your wallet.");
      setLoadingDb(false);
    }
  }, [ready, authenticated]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet</h1>
          <p className="text-gray-600">Your blockchain wallet address</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#134B70] to-[#508C9B] px-6 py-4">
            <h2 className="text-white font-semibold text-lg">Web3 Wallet Information</h2>
          </div>

          <div className="p-6">
            {/* Loading State */}
            {(loadingDb || !ready) && (
              <div className="text-center py-8">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute animate-ping rounded-full h-16 w-16 bg-[#508C9B] opacity-20"></div>
                  <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#508C9B]"></div>
                </div>
                <p className="text-gray-600">Loading wallet information...</p>
              </div>
            )}

            {/* Error State */}
            {dbError && !loadingDb && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm">{dbError}</p>
                </div>
              </div>
            )}

            {/* Success State - Wallet Connected */}
            {walletAddress && !loadingDb && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="ml-3 text-green-800 font-medium">Wallet Successfully Connected</p>
                  </div>
                </div>

                {/* Wallet Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Your Wallet Address
                  </label>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <p className="font-mono text-sm break-all text-gray-900">
                      {walletAddress}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 flex items-start">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This is your unique blockchain wallet address managed by Privy</span>
                  </p>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(walletAddress);
                    alert('Wallet address copied to clipboard!');
                  }}
                  className="w-full bg-[#508C9B] hover:bg-[#3d6f7c] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Address
                </button>
              </div>
            )}

            {/* No Wallet State */}
            {!walletAddress && !loadingDb && !dbError && (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-gray-600 mb-2">No wallet currently connected</p>
                <p className="text-sm text-gray-500">Please log in to view your wallet</p>
              </div>
            )}
          </div>

          {/* Footer - Auth Status */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <span className={`flex items-center ${
                  authenticated ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {authenticated ? 'Logged In' : 'Not Logged In'}
                </span>
                <span className={`flex items-center ${
                  privyWallet ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Privy Wallet: {privyWallet ? 'Available' : 'Not Created'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
