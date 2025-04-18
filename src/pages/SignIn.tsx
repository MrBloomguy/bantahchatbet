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
        
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-xl p-6">
          <div className="space-y-3">
            {/* Primary Sign In - Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl px-4 py-2.5 font-medium hover:bg-white transition-colors"
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            {/* Other Sign In Methods Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleTwitterSignIn}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[#1DA1F2]/80 hover:bg-[#1DA1F2] text-white rounded-xl px-3 py-2 font-medium transition-colors backdrop-blur-sm"
              >
                <img src="/twitter-icon.svg" alt="Twitter" className="w-5 h-5" />
                Twitter
              </button>

              <button
                onClick={toggleEmailForm}
                className="flex items-center justify-center gap-2 bg-gray-700/80 hover:bg-gray-700 text-white rounded-xl px-3 py-2 font-medium transition-colors backdrop-blur-sm"
              >
                <Mail className="w-5 h-5" />
                Email
              </button>

              <button
                onClick={() => setShowPhoneModal(true)}
                className="flex items-center justify-center gap-2 bg-gray-700/80 hover:bg-gray-700 text-white rounded-xl px-3 py-2 font-medium transition-colors backdrop-blur-sm"
              >
                <Phone className="w-5 h-5" />
                Phone
              </button>
            </div>

            {/* Email Form */}
            {showEmailForm && (
              <form onSubmit={isSignIn ? handleEmailSignIn : handleSignUp} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full bg-gray-700/50 text-white rounded-xl px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-gray-700/50 text-white rounded-xl px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {!isSignIn && (
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    className="w-full bg-gray-700/50 text-white rounded-xl px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl px-4 py-2 font-medium transition-colors backdrop-blur-sm"
                >
                  {loading ? 'Loading...' : isSignIn ? 'Sign in' : 'Sign up'}
                </button>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setIsSignIn(!isSignIn)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {isSignIn ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                  {isSignIn && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
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

