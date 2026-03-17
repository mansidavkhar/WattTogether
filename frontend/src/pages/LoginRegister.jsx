import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import loginBackground from '../assets/login_register_background.jpg';

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

  const trustHighlights = [
    'Passwordless email authentication',
    'Auto-created embedded wallet',
    'Secure member sync with backend'
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
        <div className="relative overflow-hidden p-8 text-white sm:p-10 lg:p-12">
          <img
            src={loginBackground}
            alt="Renewable energy"
            className="absolute inset-0 h-full w-full scale-105 object-cover blur-[1.5px]"
          />
          <div className="absolute inset-0 bg-[#134B70]/65" />

          <div className="relative z-10">
            <p className="inline-flex items-center rounded-full border border-white/40 px-4 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-white/95">
              Member Access
            </p>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
              Welcome to WattTogether
            </h1>
            <p className="mt-5 max-w-md text-base text-white/90 sm:text-lg">
              Sign in to discover vetted renewable projects, track campaign milestones, and support clean energy communities.
            </p>

            <div className="mt-10 space-y-3">
              {trustHighlights.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm sm:text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 sm:p-10 lg:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-[#134B70]">Log In or Create Account</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              One secure email step gets you into your member dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mb-5 rounded-xl border border-[#a7d3de] bg-[#e8f5f9] px-4 py-3">
              <p className="text-sm font-medium text-[#134B70]">Authenticating with Privy...</p>
            </div>
          )}

          <button
            onClick={handleLoginClick}
            disabled={isLoading || !ready}
            className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl py-4 text-base font-bold tracking-wide transition-all duration-300 sm:text-lg ${
              isLoading || !ready
                ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                : 'bg-[#134B70] text-white hover:bg-[#0f3d5e]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
                Signing In...
              </>
            ) : (
              <>
                Continue with Privy
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </>
            )}
          </button>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-700">
              Powered by Privy for passwordless authentication. Your embedded wallet is created automatically on first sign-in.
            </p>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            By continuing, you agree to use WattTogether responsibly and support transparent climate initiatives.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;

