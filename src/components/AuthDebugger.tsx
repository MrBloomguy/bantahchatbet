import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivyAuth } from '../contexts/PrivyAuthContext';

const AuthDebugger: React.FC = () => {
  const { currentUser } = useAuth();
  const privyAuth = usePrivyAuth();

  useEffect(() => {
    console.log('AuthDebugger - Auth State:', {
      currentUser,
      privyAuth: {
        ready: privyAuth?.ready,
        authenticated: privyAuth?.authenticated,
        privyUser: privyAuth?.privyUser
      }
    });
  }, [currentUser, privyAuth]);

  return null; // This component doesn't render anything
};

export default AuthDebugger;
