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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">Member Wallet</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl text-center">
        <h2 className="text-2xl mb-4 text-cyan-400">Your Web3 Wallet</h2>

        {(loadingDb || !ready) && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-lg">Loading wallet information...</p>
          </div>
        )}

        {dbError && !loadingDb && (
          <div className="bg-red-800 border border-red-600 p-4 rounded-md mb-4">
            <p className="text-red-200">❌ {dbError}</p>
          </div>
        )}

        {walletAddress && !loadingDb && (
          <div className="space-y-4">
            <div className="bg-green-800 border border-green-600 p-4 rounded-md">
              <p className="text-green-200 mb-2">✅ Wallet Successfully Connected!</p>
            </div>
            <div>
              <p className="text-lg mb-2 text-gray-300">Your Wallet Address:</p>
              <div className="bg-gray-700 p-3 rounded-md font-mono text-sm break-all border">
                {walletAddress}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This is your unique blockchain wallet address managed by Privy
              </p>
            </div>
          </div>
        )}

        {!walletAddress && !loadingDb && !dbError && (
          <div className="space-y-4">
            <div className="bg-yellow-800 border border-yellow-600 p-4 rounded-md">
              <p className="text-yellow-200">No wallet currently connected for this session.</p>
            </div>
          </div>
        )}

        {/* Auth Status Info */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Auth Status: {authenticated ? '✅ Logged In' : '❌ Not Logged In'} | 
            Privy Wallet: {privyWallet ? '✅ Available' : '❌ Not Created'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
