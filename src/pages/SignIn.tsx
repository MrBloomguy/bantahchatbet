import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import backgroundVideo from '../new_background_video.mp4';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { Eye, EyeOff } from 'lucide-react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SignIn: React.FC = () => {
  const { currentUser, signInWithEmail, signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [isSignIn, setIsSignIn] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [timeSinceLastRequest, setTimeSinceLastRequest] = useState(0);
  const [currentRetryCount, setCurrentRetryCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [referral, setReferral] = useState('');
  const { login: privyLogin, ready: privyReady } = usePrivy();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Prefill referral code from ?ref= param if present
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) setReferral(ref);
  }, [location.search]);

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
      // If your signUp function supports referral, pass it here
      await signUp(email, password, referral); // If not, just ignore referral for now
      setIsSignIn(true);
      navigate('/');
    } catch (error: any) {
      toast.showError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm);
    // Always set to sign in mode when toggling the form
    setIsSignIn(true);
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
    setResetError(null);
    let retries = 0;
    let didSucceed = false;
    const timeout = setTimeout(() => {
      setLoading(false);
      setResetError('Request timed out. Please try again.');
    }, 15000); // 15s failsafe

    while (retries < MAX_RETRIES) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          resetEmail.toLowerCase().trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`
          }
        );

        if (error) {
          if (!error.message?.includes('RetryableFetch')) {
            throw error;
          }
          retries++;
          setCurrentRetryCount(retries);
          if (retries === MAX_RETRIES) {
            throw new Error('Service temporarily unavailable. Please try again in a few minutes.');
          }
          await sleep(RETRY_DELAY);
          continue;
        }
        // Success
        toast.showSuccess('Reset instructions sent! Please check your email');
        setShowForgotPassword(false);
        setResetEmail('');
        setTimeSinceLastRequest(Date.now());
        didSucceed = true;
        break;
      } catch (error: any) {
        console.error('Reset password error:', error);
        const errorMessage = error.message === '{}' || error.name === 'AuthRetryableFetchError'
          ? 'Network or server error. Please check your connection and try again later.'
          : error.message || 'Failed to send reset instructions';
        setResetError(errorMessage);
        toast.showError(errorMessage);
        break;
      }
    }
    clearTimeout(timeout);
    setLoading(false);
    if (!didSucceed && !resetError) setResetError('Failed to send reset instructions. Please try again.');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.showError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Twitter sign in error:', error);
      toast.showError('Failed to sign in with Twitter');
    } finally {
      setLoading(false);
    }
  };

  const now = Date.now();
  const cooldownTime = now - timeSinceLastRequest;
  const isInCooldown = cooldownTime < 11000;
  const cooldownSeconds = Math.ceil((11000 - cooldownTime) / 1000);

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          src={backgroundVideo}
        />

        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

        <div className="z-10 w-full max-w-sm px-6 flex flex-col items-center justify-center min-h-[85vh]">
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 shadow-lg max-w-[240px]">
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center text-white/70 hover:text-white transition-colors text-xs font-sans"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-1 font-sans">Reset Password</h2>
            <p className="text-white/70 mb-3 text-xs font-sans">
              Enter your email address to receive reset instructions.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
              />

              <button
                type="submit"
                disabled={loading || isInCooldown}
                className={`w-full ${
                  isInCooldown ? 'bg-gray-600' : 'bg-[#CCFF00] hover:bg-[#b3ff00]'
                } ${isInCooldown ? 'text-white/70' : 'text-black'} rounded-full px-3 py-2 text-xs font-medium transition-colors font-sans`}
              >
                {loading
                  ? currentRetryCount > 0
                    ? `Retrying (${currentRetryCount}/${MAX_RETRIES})...`
                    : 'Sending...'
                  : isInCooldown
                    ? `Wait ${cooldownSeconds}s`
                    : 'Send Reset Instructions'}
              </button>

              {resetError && (
                <p className="text-xs text-red-400 text-center font-sans mt-1">{resetError}</p>
              )}

              {isInCooldown && (
                <p className="text-[10px] text-white/60 text-center font-sans">
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
    <div className="min-h-screen h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Video background and overlay */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={backgroundVideo}
      />
      <div className="absolute inset-0 bg-black/60 z-10" />
      <div className="relative z-20 w-full max-w-xs mx-auto flex flex-col items-center justify-center min-h-screen h-screen px-0">
        <div className="flex flex-col items-center mt-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo className="w-16 h-16" />
          </div>

          {/* Tagline */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1 font-sans"></h1>
            <p className="text-2x1 text-[#ffffff] font-medium font-sans">Chat, challenge and win your friends.</p>
          </div>
        </div>

        {/* Spacer to push content down */}
        <div className="flex-grow"></div>

        {/* Social Login Buttons - Positioned at bottom */}
        <div className="w-full space-y-2 mb-2 max-w-[240px]">
          {/* Log In Button (opens email form) */}
          <button
            type="button"
            onClick={toggleEmailForm}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Sign in with Email
          </button>


          {/* Add Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
              <path d="M3.15302 7.3455L6.43852 9.755C7.32752 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z" fill="#FF3D00"/>
              <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3037 18.001 12 18C9.39897 18 7.19047 16.3415 6.35847 14.027L3.09747 16.5395C4.75247 19.778 8.11347 22 12 22Z" fill="#4CAF50"/>
              <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.785L18.7045 19.404C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
            </svg>
            Sign in with Google
          </button>

          {/* Twitter Sign-in Button */}
          <button
            type="button"
            onClick={handleTwitterSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a94e4] text-white font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
            </svg>
            Sign in with X
          </button>

          {/* Privy Sign-in Button */}
          <button
            type="button"
            onClick={() => privyLogin()}
            disabled={!privyReady || loading}
            className="w-full flex items-center justify-center gap-2 bg-[#191C26] hover:bg-[#23263a] text-white font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans border border-[#CCFF00]"
          >
            <img src="https://privy.io/favicon.ico" alt="Privy" className="w-5 h-5" />
            Sign in with Privy
          </button>
        </div>

        {/* Email Form */}
        {showEmailForm && (
          <div className="w-full bg-black/40 backdrop-blur-md rounded-xl p-3 mb-3 max-w-[240px]">
            <form onSubmit={isSignIn ? handleEmailSignIn : handleSignUp} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-black/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#CCFF00] focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isSignIn && (
                <>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      required
                      className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#CCFF00] focus:outline-none"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    placeholder="Referral Code (optional)"
                    className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
                  />
                </>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-full px-3 py-2 text-xs font-medium transition-colors font-sans"
              >
                {loading ? 'Loading...' : isSignIn ? 'Sign in' : 'Sign up'}
              </button>

              <div className="flex justify-between items-center text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-white hover:text-white/80 transition-colors font-sans"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignIn(!isSignIn)}
                  className="text-white hover:text-white/80 transition-colors font-sans"
                >
                  {isSignIn ? 'Create account' : 'Sign in instead'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap SignIn with PrivyProvider
const PrivySignInWrapper: React.FC = () => (
  <PrivyProvider appId={process.env.PRIVY_APP_ID || 'cmc9a12oh01lnky0m1agzgdoc'}>
    <SignIn />
  </PrivyProvider>
);

export default PrivySignInWrapper;

