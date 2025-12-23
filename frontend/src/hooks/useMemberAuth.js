import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

/**
 * Custom hook to manage member authentication with Privy
 * Provides easy access to auth state and functions throughout the app
 */
export const useMemberAuth = () => {
  const { 
    user, 
    authenticated, 
    ready, 
    login, 
    logout, 
    getAccessToken 
  } = usePrivy();
  
  const [memberData, setMemberData] = useState(null);

  // Load member data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setMemberData(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
  }, []);

  // Extract email from Privy user
  const email = user?.email?.address || user?.linkedAccounts?.find(
    account => account.type === 'email'
  )?.address;

  // Extract wallet address from Privy user
  const walletAddress = user?.wallet?.address || user?.linkedAccounts?.find(
    account => account.type === 'wallet' && account.walletClient === 'privy'
  )?.address;

  // Logout function that also clears local storage
  const handleLogout = async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('privyToken');
    setMemberData(null);
    await logout();
  };

  // Get authorization header for API calls
  const getAuthHeader = async () => {
    try {
      // First try to get fresh token from Privy
      const token = await getAccessToken();
      if (token) {
        console.log('✅ Got fresh access token from Privy');
        return `Bearer ${token}`;
      }
      
      // Fallback to stored token
      const storedToken = localStorage.getItem('privyToken');
      if (storedToken) {
        console.log('✅ Using stored Privy token');
        return `Bearer ${storedToken}`;
      }
      
      console.warn('❌ No auth token found - user may need to login again');
      return null;
    } catch (err) {
      console.error('❌ Error getting access token:', err);
      // Try fallback to stored token
      const storedToken = localStorage.getItem('privyToken');
      if (storedToken) {
        console.log('⚠️ Using stored token after error');
        return `Bearer ${storedToken}`;
      }
      return null;
    }
  };

  return {
    // Privy user object
    user,
    
    // Authentication state
    authenticated,
    ready,
    
    // User details
    email,
    walletAddress,
    privyUserId: user?.id,
    
    // Member data from backend
    memberData,
    setMemberData,
    
    // Auth functions
    login,
    logout: handleLogout,
    getAccessToken,
    getAuthHeader,
  };
};
