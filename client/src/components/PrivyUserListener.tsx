import React, { useEffect, useState } from 'react';
import { usePrivyAuth } from '../contexts/PrivyAuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePrivy } from '@privy-io/react-auth';

const PrivyUserListener: React.FC = () => {
  const privyAuth = usePrivyAuth();
  const directPrivy = usePrivy();
  const { refreshUser, currentUser } = useAuth();
  const toast = useToast();
  const [hasProcessed, setHasProcessed] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('PrivyUserListener - Current Auth State:', {
      privyAuthReady: privyAuth?.ready,
      privyAuthAuthenticated: privyAuth?.authenticated,
      privyAuthUser: privyAuth?.user,
      privyAuthPrivyUser: privyAuth?.privyUser,
      directPrivyReady: directPrivy?.ready,
      directPrivyAuthenticated: directPrivy?.authenticated,
      directPrivyUser: directPrivy?.user,
      currentAppUser: currentUser
    });
  }, [privyAuth, directPrivy, currentUser]);

  // Listen for direct Privy authentication
  useEffect(() => {
    if (directPrivy.ready && directPrivy.authenticated && directPrivy.user && !hasProcessed) {
      console.log('PrivyUserListener: Direct Privy authentication detected', directPrivy.user);

      // Force a refresh of the Privy user in our custom context
      if (privyAuth?.login) {
        console.log('Triggering Privy auth refresh');
        // This will trigger the useEffect in PrivyAuthContext
        setHasProcessed(true);
      }
    }
  }, [directPrivy.ready, directPrivy.authenticated, directPrivy.user, privyAuth, hasProcessed]);

  // Listen for Privy user changes from our custom context
  useEffect(() => {
    if (privyAuth?.isInitialized && privyAuth?.privyUser) {
      console.log('PrivyUserListener: Refreshing user with Privy user', privyAuth.privyUser);

      // Refresh the user in the main auth context
      refreshUser(privyAuth.privyUser);

      // Show success message
      if (!currentUser) {
        toast.showSuccess('Successfully signed in with Privy!');
      }
    }
  }, [privyAuth?.privyUser, privyAuth?.isInitialized, refreshUser, currentUser, toast]);

  // This component doesn't render anything
  return null;
};

export default PrivyUserListener;
