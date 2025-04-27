import React, { useState, useEffect } from 'react';
import { usePrivyAuth } from '../contexts/PrivyAuthContext';
import { usePrivy } from '@privy-io/react-auth';

interface PrivyLoginButtonProps {
  className?: string;
  label?: string;
}

const PrivyLoginButton: React.FC<PrivyLoginButtonProps> = ({
  className = "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors font-sans",
  label = "Continue with Privy"
}) => {
  const privyAuth = usePrivyAuth();
  const directPrivy = usePrivy();
  const [isReady, setIsReady] = useState(false);

  // Wait for Privy to be ready
  useEffect(() => {
    if (directPrivy.ready) {
      console.log('Privy is ready in custom button');
      setIsReady(true);
    }
  }, [directPrivy.ready]);

  const handleClick = () => {
    console.log('Privy login button clicked');

    // Try using our custom login first
    if (privyAuth?.login) {
      try {
        console.log('Using custom Privy login');
        privyAuth.login();
        return;
      } catch (error) {
        console.error('Error with custom Privy login:', error);
      }
    }

    // Fall back to direct Privy login if custom fails
    if (directPrivy?.login) {
      try {
        console.log('Falling back to direct Privy login');
        directPrivy.login();
      } catch (error) {
        console.error('Error with direct Privy login:', error);
      }
    } else {
      console.error('No Privy login function is available');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isReady}
      className={`${className} ${!isReady ? 'opacity-70' : ''}`}
    >
      {!isReady ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"
            fill="currentColor"
          />
        </svg>
      )}
      {isReady ? label : 'Loading Privy...'}
    </button>
  );
};

export default PrivyLoginButton;
