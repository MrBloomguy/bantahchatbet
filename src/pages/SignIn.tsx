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
import WhatsAppAuth from '../components/WhatsAppAuth'; // WhatsApp authentication
import SnapchatAuth from '../components/SnapchatAuth'; // Snapchat authentication

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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSnapchatModal, setShowSnapchatModal] = useState(false);
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

          {/* WhatsApp Sign In Button */}
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Sign in with WhatsApp
          </button>

          {/* Snapchat Sign In Button */}
          <button
            type="button"
            onClick={() => setShowSnapchatModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFFC00" stroke="none">
              <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.36-.135-.553-.045-.195-.105-.42-.164-.575-1.918-.222-2.95-.642-3.189-1.226-.031-.075-.045-.165-.045-.239-.015-.225.15-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.007-.514c-.105-1.636-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
            </svg>
            Sign in with Snapchat
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

      {/* WhatsApp Sign In Modal */}
      {showWhatsAppModal && (
        <WhatsAppAuth onClose={() => setShowWhatsAppModal(false)} />
      )}

      {/* Snapchat Sign In Modal */}
      {showSnapchatModal && (
        <SnapchatAuth onClose={() => setShowSnapchatModal(false)} />
      )}

      {/* Telegram Sign In Modal */}
      {showTelegramModal && (
        <TelegramLoginModal onClose={() => setShowTelegramModal(false)} />
      )}
    </div>
  );
};

export default SignIn;

