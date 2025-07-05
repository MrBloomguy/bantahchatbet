import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FacebookLoginProps {
  onClose?: () => void;
}

const FacebookLogin: React.FC<FacebookLoginProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    // Check if FB SDK is loaded
    const checkFBSDK = setInterval(() => {
      if (window.FB) {
        clearInterval(checkFBSDK);
      }
    }, 100);

    return () => clearInterval(checkFBSDK);
  }, []);

  const handleFacebookLogin = async () => {
    if (!window.FB) {
      toast.showError('Facebook SDK not loaded. Please try again later.');
      return;
    }

    setLoading(true);

    try {
      // Prompt Facebook login
      window.FB.login(async (response: any) => {
        if (response.authResponse) {
          const { accessToken, userID } = response.authResponse;
          
          // Get user info from Facebook
          window.FB.api('/me', { fields: 'email,name,picture' }, async (userInfo: any) => {
            try {
              // Sign in with Supabase using the Facebook token
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'facebook',
                token: accessToken,
                nonce: 'NONCE', // Should be a random string in production
              });

              if (error) {
                // If direct token sign-in fails, try to create/link account manually
                const { data: userData, error: userError } = await supabase.auth.signUp({
                  email: userInfo.email,
                  password: `fb_${userID}_${Date.now()}`, // Generate a secure password
                  options: {
                    data: {
                      name: userInfo.name,
                      avatar_url: userInfo.picture?.data?.url,
                      provider: 'facebook',
                      provider_id: userID
                    }
                  }
                });

                if (userError) {
                  // If sign up fails, try to sign in (user might already exist)
                  const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
                    email: userInfo.email
                  });

                  if (signInError) {
                    throw signInError;
                  }
                  
                  toast.showSuccess('Check your email for a login link');
                } else {
                  toast.showSuccess('Account created successfully');
                  refreshUser();
                }
              } else {
                // Successful login with Facebook token
                toast.showSuccess('Logged in with Facebook');
                refreshUser();
              }
              
              if (onClose) onClose();
            } catch (err: any) {
              console.error('Facebook auth error:', err);
              toast.showError(err.message || 'Failed to authenticate with Facebook');
            } finally {
              setLoading(false);
            }
          });
        } else {
          // User cancelled login or did not fully authorize
          setLoading(false);
          toast.showInfo('Facebook login was cancelled');
        }
      }, { scope: 'email,public_profile' });
    } catch (error: any) {
      setLoading(false);
      console.error('Facebook login error:', error);
      toast.showError('Failed to initialize Facebook login');
    }
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
    >
      {loading ? (
        <LoadingSpinner size="sm" color="#FFFFFF" />
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
          </svg>
          Sign in with Facebook
        </>
      )}
    </button>
  );
};

export default FacebookLogin;
