import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import backgroundVideo from '../new_background_video.mp4';
import Logo from '../components/Logo';
// import PhoneSignIn from '../components/PhoneSignIn'; // Original component
// import FirebasePhoneSignIn from '../components/FirebasePhoneSignIn'; // Firebase with reCAPTCHA
// import SimplePhoneSignIn from '../components/SimplePhoneSignIn'; // Simplified version
// import SupabasePhoneSignIn from '../components/SupabasePhoneSignIn'; // Supabase version
// import CustomPhoneSignIn from '../components/CustomPhoneSignIn'; // Custom implementation
// import DevFirebasePhoneSignIn from '../components/DevFirebasePhoneSignIn'; // Firebase dev implementation
import CustomPhoneAuthWithoutCaptcha from '../components/CustomPhoneAuthWithoutCaptcha'; // Custom implementation without CAPTCHA
import DirectPhoneAuth from '../components/DirectPhoneAuth'; // Direct phone authentication
import RealPhoneAuth from '../components/RealPhoneAuth'; // Real phone authentication
import SupabasePhoneAuth from '../components/SupabasePhoneAuth'; // Supabase phone authentication
import FirebasePhoneAuth from '../components/FirebasePhoneAuth'; // Firebase phone authentication
import SimpleFirebasePhoneAuth from '../components/SimpleFirebasePhoneAuth'; // Simple Firebase phone authentication
import NoRecaptchaPhoneAuth from '../components/NoRecaptchaPhoneAuth'; // Phone auth without reCAPTCHA

import FacebookLogin from '../components/FacebookLogin'; // Facebook authentication
import TikTokLogin from '../components/TikTokLogin'; // TikTok authentication

import EmailLoginButton from '../components/EmailLoginButton'; // Custom email login button
import TelegramLoginModal from '../components/TelegramLoginModal'; // Telegram login modal
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
  const [showDirectPhoneModal, setShowDirectPhoneModal] = useState(false);
  const [showRealPhoneModal, setShowRealPhoneModal] = useState(false);
  const [showSupabasePhoneModal, setShowSupabasePhoneModal] = useState(false);
  const [showFirebasePhoneModal, setShowFirebasePhoneModal] = useState(false);
  const [showSimpleFirebasePhoneModal, setShowSimpleFirebasePhoneModal] = useState(false);
  const [showNoRecaptchaPhoneModal, setShowNoRecaptchaPhoneModal] = useState(false);

  const [showTelegramModal, setShowTelegramModal] = useState(false);
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
                  ? retryCount > 0
                    ? `Retrying (${retryCount}/${MAX_RETRIES})...`
                    : 'Sending...'
                  : isInCooldown
                    ? `Wait ${cooldownSeconds}s`
                    : 'Send Reset Instructions'}
              </button>

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

      <div className="z-10 w-full max-w-sm px-6 flex flex-col items-center min-h-[100vh] py-8">
        <div className="flex flex-col items-center mt-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo className="w-16 h-16" />
          </div>

          {/* Tagline */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1 font-sans">Bet on Anything</h1>
            <p className="text-base text-[#CCFF00] font-medium font-sans">Challenge Friends & Win</p>
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

          {/* Facebook Sign In Button */}
          <FacebookLogin />

          {/* TikTok Sign In Button */}
          <TikTokLogin />

          {/* Phone Sign In Button */}
          <button
            type="button"
            onClick={() => setShowNoRecaptchaPhoneModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Sign in with Phone
          </button>



          {/* Telegram Sign In Button */}
          <button
            type="button"
            onClick={() => setShowTelegramModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.269c-.145.658-.537.818-1.084.51l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.538-.196 1.006.128.833.95z"/>
            </svg>
            Sign in with Telegram
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
              />
              {!isSignIn && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
                />
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

        {/* No additional login button needed */}
      </div>

      {/* Legacy Phone Sign In Modal */}
      {showPhoneModal && (
        <CustomPhoneAuthWithoutCaptcha onClose={() => setShowPhoneModal(false)} />
      )}

      {/* Direct Phone Sign In Modal */}
      {showDirectPhoneModal && (
        <DirectPhoneAuth onClose={() => setShowDirectPhoneModal(false)} />
      )}

      {/* Real Phone Sign In Modal */}
      {showRealPhoneModal && (
        <RealPhoneAuth onClose={() => setShowRealPhoneModal(false)} />
      )}

      {/* Supabase Phone Sign In Modal */}
      {showSupabasePhoneModal && (
        <SupabasePhoneAuth onClose={() => setShowSupabasePhoneModal(false)} />
      )}

      {/* Firebase Phone Sign In Modal */}
      {showFirebasePhoneModal && (
        <FirebasePhoneAuth onClose={() => setShowFirebasePhoneModal(false)} />
      )}

      {/* Simple Firebase Phone Sign In Modal */}
      {showSimpleFirebasePhoneModal && (
        <SimpleFirebasePhoneAuth onClose={() => setShowSimpleFirebasePhoneModal(false)} />
      )}

      {/* No reCAPTCHA Phone Sign In Modal */}
      {showNoRecaptchaPhoneModal && (
        <NoRecaptchaPhoneAuth onClose={() => setShowNoRecaptchaPhoneModal(false)} />
      )}



      {/* Telegram Sign In Modal */}
      {showTelegramModal && (
        <TelegramLoginModal onClose={() => setShowTelegramModal(false)} />
      )}
    </div>
  );
};

export default SignIn;

