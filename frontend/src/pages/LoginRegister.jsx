import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

const LoginRegister = () => {
  const navigate = useNavigate();
  const { login, logout, authenticated, ready, user, getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (ready && authenticated && user) {
      handlePrivyAuth();
    }
  }, [ready, authenticated, user]);

  // Handle authentication with backend after Privy login
  const handlePrivyAuth = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Get Privy access token
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        setError("Failed to get authentication token");
        return;
      }

      // Extract wallet address from Privy user if available
      const walletAddress = user?.wallet?.address || user?.linkedAccounts?.find(
        account => account.type === 'wallet' && account.walletClient === 'privy'
      )?.address;

      console.log('Privy login - Wallet address:', walletAddress || 'Not yet created');

      // Send to backend for member creation/linking
      const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5000/api";
      const response = await fetch(`${BACKEND_URL}/members/auth/privy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(responseData.user));
        localStorage.setItem('privyToken', accessToken);

        // If wallet address is available and not in backend, update it
        if (walletAddress && !responseData.user.walletAddress) {
          try {
            console.log('Syncing wallet address to backend:', walletAddress);
            await fetch(`${BACKEND_URL}/members/save-wallet`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({ walletAddress }),
            });
          } catch (walletErr) {
            console.warn('Could not sync wallet address:', walletErr);
          }
        }

        // Navigate to member home
        navigate('/member/home');
      } else {
        // If backend authentication fails, logout from Privy to clear the session
        setError(responseData.message || "Authentication failed. Please try again.");
        await logout();
      }
    } catch (err) {
      setError("Could not connect to the server. Please check your connection.");
      console.error("Backend Auth Error:", err);
      // Logout from Privy on error to allow retry
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Privy login click
  const handleLoginClick = () => {
    setError("");
    login();
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto">
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full px-4 my-5">
        <div className="w-full max-w-lg bg-[#201E43]/95 rounded-lg shadow-xl p-8">
          <h1 className='text-4xl font-bold text-white text-center mb-6 font-sans tracking-tight'>
            Welcome to WattTogether
          </h1>
          <p className="text-xl text-white text-center mb-8">
            Sign in to fund the future of renewable energy
          </p>

          {/* Error Message Display */}
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 p-3 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mb-6 bg-blue-900/50 border border-blue-500 p-3 rounded-lg">
              <p className="text-blue-400 text-sm text-center">Authenticating...</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLoginClick}
            disabled={isLoading || !ready}
            className={`w-full py-4 rounded-md transition-colors duration-300 uppercase tracking-wider font-semibold text-lg ${
              isLoading || !ready
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-[#508C9B] text-white hover:bg-[#134B70]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              "Sign In with Privy"
            )}
          </button>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Powered by Privy - Secure, passwordless authentication
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Your wallet will be created automatically on first sign-in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

