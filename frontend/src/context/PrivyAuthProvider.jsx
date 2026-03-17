import { PrivyProvider } from '@privy-io/react-auth';
import { polygonAmoy } from 'viem/chains';
import wattTogetherLogo from '../assets/wattTogether_logo.png';

const PrivyAuthProvider = ({ children }) => {
  // Suppress React hydration warnings and CORS errors from Privy in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = function(...args) {
      const message = args[0];
      
      // Suppress Privy hydration warning
      if (typeof message === 'string' && message.includes('In HTML, <div> cannot be a descendant of <p>')) {
        return;
      }
      
      // Suppress CORS errors from Privy analytics
      if (typeof message === 'string' && (
        message.includes('Access to fetch at \'https://auth.privy.io/api/v1/analytics_events\'') ||
        message.includes('CORS policy') && message.includes('privy.io')
      )) {
        console.log('[Privy Analytics] CORS blocked - this is expected in development and doesn\'t affect functionality');
        return;
      }
      
      originalError.call(console, ...args);
    };

    // Also suppress network errors for Privy analytics 
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error) {
        // Suppress analytics fetch errors silently
        if (args[0] && args[0].includes('auth.privy.io/api/v1/analytics_events')) {
          console.log('[Privy Analytics] Network error suppressed - this doesn\'t affect app functionality');
          return { ok: false, status: 0, json: () => Promise.resolve({}) };
        }
        throw error;
      }
    };
  }

  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || 'cmj0608mm00ibkz0di118aun2'}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#508C9B',
          logo: wattTogetherLogo,
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        defaultChain: polygonAmoy,
        supportedChains: [polygonAmoy],
        mfa: {
          rules: []
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
};

export default PrivyAuthProvider;
