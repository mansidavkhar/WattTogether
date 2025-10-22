import { useEffect, useState } from 'react';
import { useWeb3Auth } from '../context/Web3AuthContext';

const Wallet = () => {
  const { error, isLoading, isConnecting } = useWeb3Auth();
  const [walletAddress, setWalletAddress] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbError, setDbError] = useState(null);

  const fetchWalletFromBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setDbError("Not logged in.");
      setLoadingDb(false);
      return;
    }
    try {
      setLoadingDb(true);
      const response = await fetch('http://localhost:5000/api/members/get-wallet', {
        headers: {
          'Authorization': `Bearer ${token}`, // or 'x-auth-token' depending on your backend
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      const data = await response.json();
      if (data.walletAddress) {
        setWalletAddress(data.walletAddress);
      } else {
        setDbError("Wallet address not found.");
      }
    } catch (err) {
      setDbError(`Failed to fetch wallet: ${err.message}`);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchWalletFromBackend();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">Member Wallet</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl text-center">
        <h2 className="text-2xl mb-4 text-cyan-400">Your Web3 Wallet</h2>

        {(loadingDb || isLoading || isConnecting) && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
            <p className="text-lg">
              Loading wallet information...
            </p>
          </div>
        )}

        {(dbError || error) && !(loadingDb || isLoading || isConnecting) && (
          <div className="bg-red-800 border border-red-600 p-4 rounded-md mb-4">
            <p className="text-red-200">❌ {dbError || error}</p>
          </div>
        )}

        {walletAddress && !(loadingDb || isLoading || isConnecting) && (
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
                This is your unique blockchain wallet address stored on wattTogether
              </p>
            </div>
          </div>
        )}

        {!walletAddress && !loadingDb && !isLoading && !isConnecting && !dbError && (
          <div className="space-y-4">
            <div className="bg-yellow-800 border border-yellow-600 p-4 rounded-md">
              <p className="text-yellow-200">No wallet currently connected for this session.</p>
            </div>
          </div>
        )}

        {/* Auth Status Info */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Auth Status: {localStorage.getItem('token') ? '✅ Logged In' : '❌ Not Logged In'} | 
            JWT Token: {localStorage.getItem('id_token') ? '✅ Available' : '❌ Missing'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
