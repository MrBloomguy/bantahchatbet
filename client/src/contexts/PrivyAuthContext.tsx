import React, { createContext, useContext, useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { usePrivy } from '@privy-io/react-auth';

// Define the context type
interface PrivyAuthContextType {
  ready: boolean;
  authenticated: boolean;
  user: any;
  isInitialized: boolean;
  login: () => void;
  logout: () => void;
}

// Create the context
const PrivyAuthContext = createContext<PrivyAuthContextType | undefined>(undefined);

// Custom hook to use the context
export const usePrivyAuth = () => {
  const context = useContext(PrivyAuthContext);
  if (context === undefined) {
    console.warn('usePrivyAuth must be used within a PrivyAuthProvider');
    return undefined;
  }
  return context;
};

// Internal component to manage Privy auth state
const PrivyAuthManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle Privy auth state changes
  useEffect(() => {
    if (!ready) return;

    const handlePrivyAuth = async () => {
      setIsInitialized(true);

      if (authenticated && user) {
        console.log('User authenticated:', user);
      }
    };

    handlePrivyAuth();
  }, [ready, authenticated, user]);

  // Handle login
  const handleLogin = () => {
    if (login) {
      login();
    } else {
      console.error('Privy login function is not available');
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      console.error('Privy logout function is not available');
    }
  };

  return (
    <PrivyAuthContext.Provider value={{
      ready,
      authenticated,
      user,
      isInitialized,
      logout: handleLogout,
      login: handleLogin
    }}>
      {children}
    </PrivyAuthContext.Provider>
  );
};

// Provider component that wraps the app
export const PrivyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
  console.log('Privy App ID:', privyAppId);

  if (!privyAppId) {
    console.error('Privy App ID is not defined in environment variables');
  }

  // Handle errors globally for Privy
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('privy') ||
      event.message.includes('Privy') ||
      event.message.includes('Content Security Policy')
    )) {
      console.warn('Caught Privy-related error:', event.message);
      event.preventDefault();
      return true;
    }
    return false;
  }, true);

  return (
    <PrivyProvider
      appId={privyAppId || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#CCFF00',
          showWalletLoginFirst: false
        },
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
        defaultChain: undefined,
        supportedChains: undefined,
        embeddedWallets: {
        },
      }}
    >
      <PrivyAuthManager>{children}</PrivyAuthManager>
    </PrivyProvider>
  );
};
