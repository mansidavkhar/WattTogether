import { PrivyProvider } from '@privy-io/react-auth';
import { polygonAmoy } from 'viem/chains';

const PrivyAuthProvider = ({ children }) => {
  // Suppress React hydration warnings from Privy in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = function(...args) {
      if (typeof args[0] === 'string' && args[0].includes('In HTML, <div> cannot be a descendant of <p>')) {
        return; // Suppress Privy hydration warning
      }
      originalError.call(console, ...args);
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
          logo: 'https://your-logo-url.com/logo.png',
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
