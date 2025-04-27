import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from '../firebase/config';

const FirebasePhoneSignIn: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const toast = useToast();
  const { refreshUser } = useAuth();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA only when needed, not on component mount
  const initializeRecaptcha = () => {
    try {
      // Clear any existing reCAPTCHA
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      // Create a new RecaptchaVerifier instance with normal size
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal', // Use normal size for better compatibility
        callback: () => {
          console.log('reCAPTCHA verified');
          // Automatically submit the form when reCAPTCHA is verified
          handlePhoneSubmitAfterRecaptcha();
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          toast.showError('reCAPTCHA expired. Please try again.');
          setLoading(false);
        }
      });

      // Render the reCAPTCHA
      return recaptchaVerifierRef.current.render();
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      toast.showError('Failed to initialize reCAPTCHA. Please try again.');
      setLoading(false);
      throw error;
    }
  };

  // Clean up reCAPTCHA when component unmounts
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Format phone number to include country code
  const formatPhoneNumber = (number: string): string => {
    if (!number.startsWith('+')) {
      if (number.startsWith('0')) {
        return '+234' + number.substring(1);
      } else {
        return '+234' + number;
      }
    }
    return number;
  };

  // First step: validate phone and show reCAPTCHA
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number format
      if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error('Please enter a valid phone number with country code');
      }

      // Initialize and render reCAPTCHA
      initializeRecaptcha();

    } catch (error: any) {
      console.error('Phone validation error:', error);
      toast.showError(error.message || 'Failed to initialize verification');
      setLoading(false);
    }
  };

  // Second step: after reCAPTCHA is verified, send the verification code
  const handlePhoneSubmitAfterRecaptcha = async () => {
    try {
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Make sure we have a reCAPTCHA verifier
      if (!recaptchaVerifierRef.current) {
        throw new Error('reCAPTCHA not initialized');
      }

      // Send verification code
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        recaptchaVerifierRef.current
      );

      // Store the verification ID for later use
      setVerificationId(confirmationResult.verificationId);

      setStep('otp');
      toast.showSuccess('Verification code sent! Check your phone.');
      setRetryCount(0); // Reset retry count on successful send
    } catch (error: any) {
      console.error('Phone sign in error:', error);

      // Handle specific error messages
      let errorMessage = 'Failed to send verification code';

      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +234).';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.showError(errorMessage);
      setRetryCount(prev => prev + 1);

      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input or submit if last digit
      if (value) {
        if (index < 5) {
          const nextInput = document.getElementById(`otp-${index + 1}`);
          nextInput?.focus();
        } else {
          // Auto-submit when all digits are filled
          const allDigitsFilled = newOtp.every(digit => digit.length === 1);
          if (allDigitsFilled) {
            handleOtpSubmit();
          }
        }
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || otp.some(d => !d)) return;

    setLoading(true);

    try {
      const verificationCode = otp.join('');

      if (!verificationId) {
        throw new Error('Verification ID not found. Please request a new verification code.');
      }

      // Create a credential with the verification ID and code
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);

      // Sign in with the credential
      await signInWithCredential(auth, credential);

      // If successful, refresh the user and close the modal
      await refreshUser();
      onClose();
      toast.showSuccess('Successfully signed in!');
    } catch (error: any) {
      console.error('OTP verification error:', error);

      let errorMessage = 'Verification failed';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new code.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.showError(errorMessage);

      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (retryCount >= 3) {
      toast.showError('Maximum retry attempts reached. Please try again later.');
      return;
    }

    // Go back to phone step to re-verify with reCAPTCHA
    setStep('phone');
    setLoading(false);
    toast.showInfo('Please verify with reCAPTCHA to resend the code.');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="relative w-full max-w-sm mx-4">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 rounded-xl"></div>

        {/* Content */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 shadow-lg relative">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-3">
              <h2 className="text-xl font-bold text-white mb-1 font-sans">Continue with Phone (Firebase)</h2>
              <p className="text-white/70 mb-3 text-xs font-sans">
                Enter your phone number to receive a verification code
              </p>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+2348012345678"
                className="w-full bg-white/10 text-white rounded-full px-3 py-2 text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
                required
                pattern="^\+?\d{10,15}$"
                title="Please enter a valid phone number with country code"
              />

              {/* reCAPTCHA container */}
              <div id="recaptcha-container" className="flex justify-center my-3"></div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-colors font-sans border border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || retryCount >= 3}
                  className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50 font-sans"
                >
                  {loading ? 'Verifying...' : 'Verify Phone'}
                </button>
              </div>

              <p className="text-white/50 text-[10px] text-center mt-2 font-sans">
                Complete the reCAPTCHA verification to continue
              </p>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-3">
              <h2 className="text-xl font-bold text-white mb-1 font-sans">Verification Code</h2>
              <p className="text-white/70 mb-2 text-xs font-sans">
                Enter the 6-digit code sent to {phoneNumber}
              </p>

              <div className="grid grid-cols-6 gap-1 mb-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    aria-label={`Digit ${index + 1} of verification code`}
                    title={`Digit ${index + 1} of verification code`}
                    className="w-full aspect-square bg-white/10 text-white text-center text-sm font-bold rounded-md focus:outline-none focus:ring-1 focus:ring-[#CCFF00] border border-white/20 font-sans"
                    disabled={loading}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.some(d => !d)}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50 font-sans"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex justify-between items-center text-[10px] text-white/70">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading || retryCount >= 3}
                  className="hover:text-white transition-colors font-sans"
                >
                  {loading ? 'Sending...' : `Resend Code (${3 - retryCount} left)`}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="hover:text-white transition-colors font-sans"
                >
                  Change Number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirebasePhoneSignIn;
