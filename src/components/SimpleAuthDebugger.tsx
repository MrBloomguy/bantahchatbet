import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SimpleAuthDebugger: React.FC = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log('SimpleAuthDebugger - Auth State:', {
      currentUser
    });
  }, [currentUser]);

  return null; // This component doesn't render anything
};

export default SimpleAuthDebugger;
