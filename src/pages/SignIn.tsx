import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import backgroundVideo from '../new_background_video.mp4';
import Logo from '../components/Logo';
import PhoneSignIn from '../components/PhoneSignIn';
import { supabase } from '../lib/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SignIn: React.FC = () => {
  const { currentUser, signInWithEmail, signUp, signInWithGoogle, signInWithTwitter } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetRequestTime, setResetRequestTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.showError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (error: any) {
      toast.showError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.showError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      setIsSignIn(true);
      navigate('/');
    } catch (error: any) {
      toast.showError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle({
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.showError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithTwitter({
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.showError('Failed to sign in with Twitter');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.showError('Please enter your email address');
      return;
    }

    setLoading(true);
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(
          resetEmail.toLowerCase().trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`
          }
        );

        if (error) {
          // If it's not a retryable error, throw immediately
          if (!error.message?.includes('RetryableFetch')) {
            throw error;
          }
          
          retries++;
          if (retries === MAX_RETRIES) {
            throw new Error('Service temporarily unavailable. Please try again in a few minutes.');
          }
          
          // Wait before retrying
          await sleep(RETRY_DELAY);
          continue;
        }

        // Success
        toast.showSuccess('Reset instructions sent! Please check your email');
        setShowForgotPassword(false);
        setResetEmail('');
        break;
        
      } catch (error: any) {
        console.error('Reset password error:', error);
        
        const errorMessage = error.message === '{}'
          ? 'Connection error. Please try again'
          : error.message || 'Failed to send reset instructions';
        
        toast.showError(errorMessage);
        break;
      }
    }
    
    setLoading(false);
  };

  const now = Date.now();
  const timeSinceLastRequest = now - resetRequestTime;
  const isInCooldown = timeSinceLastRequest < 11000;
  const cooldownSeconds = Math.ceil((11000 - timeSinceLastRequest) / 1000);

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute w-full h-full object-cover opacity-30"
          src={backgroundVideo}
        />
        <div className="z-10 w-full max-w-md px-4">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Sign In
              </button>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
            <p className="text-gray-400 mb-6">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-gray-700/50 text-white rounded-xl px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              
              <button
                type="submit"
                disabled={loading || isInCooldown}
                className={`w-full ${
                  isInCooldown ? 'bg-gray-600' : 'bg-blue-600/80 hover:bg-blue-600'
                } text-white rounded-xl px-4 py-2 font-medium transition-colors backdrop-blur-sm`}
              >
                {loading 
                  ? retryCount > 0 
                    ? `Retrying (${retryCount}/${MAX_RETRIES})...` 
                    : 'Sending...'
                  : isInCooldown 
                    ? `Wait ${cooldownSeconds}s` 
                    : 'Send Reset Instructions'}
              </button>

              {isInCooldown && (
                <p className="text-sm text-gray-400 text-center">
                  Please wait {cooldownSeconds} seconds before requesting another reset
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        className="absolute w-full h-full object-cover opacity-30"
        src={backgroundVideo}
      />
      <div className="z-10 w-full max-w-md px-4">
        <div className="flex justify-center mb-6">
          <Logo className="w-24 h-24" />
        </div>
        
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-lg shadow-md p-4 border border-gray-600/50">
          <div className="flex justify-center space-x-3 mb-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex flex-col items-center gap-1 text-gray-900 hover:text-gray-700 transition-all"
            >
              <img src="/public/5296499_fb_facebook_facebook logo_icon.svg" alt="Google" className="w-8 h-8" />
              <span className="text-xs font-medium">Google</span>
            </button>

            <button
              onClick={handleTwitterSignIn}
              disabled={loading}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition-all"
            >
              <img src="/public/4375108_logo_telegram_icon.svg" alt="Twitter" className="w-8 h-8" />
              <span className="text-xs font-medium">Twitter</span>
            </button>

            <button
              onClick={() => setShowPhoneModal(true)}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition-all"
            >
              <img src="/public/5296520_bubble_chat_mobile_whatsapp_whatsapp logo_icon.svg" alt="Phone" className="w-8 h-8" />
              <span className="text-xs font-medium">Phone</span>
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={toggleEmailForm}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md px-3 py-2 text-sm font-medium transition-all shadow-sm"
            >
              Login
            </button>

            <button
              onClick={() => setIsSignIn(false)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-md px-3 py-2 text-sm font-medium transition-all shadow-sm"
            >
              Sign Up
            </button>
          </div>

          {/* Email Form */}
          {showEmailForm && (
            <form onSubmit={isSignIn ? handleEmailSignIn : handleSignUp} className="mt-3 space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-gray-700/40 text-white rounded-md px-3 py-2 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-gray-700/40 text-white rounded-md px-3 py-2 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
              />
              {!isSignIn && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-gray-700/40 text-white rounded-md px-3 py-2 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md px-3 py-2 text-sm font-medium transition-all shadow-sm"
              >
                {loading ? 'Loading...' : isSignIn ? 'Sign in' : 'Sign up'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Phone Sign In Modal */}
      {showPhoneModal && (
        <PhoneSignIn onClose={() => setShowPhoneModal(false)} />
      )}
    </div>
  );
};

export default SignIn;

