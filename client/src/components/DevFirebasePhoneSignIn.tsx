import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/config';
import {
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

// This is a development-only component that simulates Firebase phone authentication
// without using reCAPTCHA, which can cause CSP issues
const DevFirebasePhoneSignIn: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const toast = useToast();
  const { refreshUser, currentUser } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    if (currentUser) {
      console.log('User already logged in:', currentUser);
      // If already logged in, close the modal
      toast.showInfo('You are already logged in');
      onClose();
    }
  }, [currentUser, onClose, toast]);

  // Create a direct login function for development
  const createDevUser = (phoneNum: string) => {
    // Store the phone number in localStorage
    localStorage.setItem('dev_firebase_phone', phoneNum);
    console.log(`DEV MODE: Stored phone number in localStorage: ${phoneNum}`);

    // Force a page reload to trigger the auth check
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

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

  // Generate a random verification ID (simulating Firebase)
  const generateVerificationId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number format
      if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error('Please enter a valid phone number with country code');
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // In a real implementation, Firebase would send an SMS with a verification code
      // For development, we'll simulate it

      // Generate a fake verification ID
      const fakeVerificationId = generateVerificationId();
      setVerificationId(fakeVerificationId);

      // Log for development
      console.log(`DEV MODE: Simulating SMS to ${formattedPhoneNumber}`);
      console.log(`DEV MODE: Verification ID: ${fakeVerificationId}`);
      console.log(`DEV MODE: Any 6-digit code will work`);

      // Move to OTP screen
      setStep('otp');
      toast.showSuccess('Verification code sent! Check your phone.');

      // In development mode, show a message
      toast.showInfo('DEV MODE: Any 6-digit code will work');

    } catch (error: any) {
      console.error('Phone sign in error:', error);
      toast.showError(error.message || 'Failed to send verification code');
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

      // In a real implementation, we would use Firebase to verify the code
      // For development, we'll simulate a successful verification

      try {
        // In production, this would be a real Firebase credential
        // For development, we're creating a fake credential
        console.log(`DEV MODE: Verifying code: ${verificationCode}`);

        // Simulate Firebase authentication
        // In development mode, any 6-digit code works
        if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
          // Use our direct login function
          createDevUser(phoneNumber);

          // Simulate a successful sign-in
          toast.showSuccess('DEV MODE: Successfully authenticated');
          onClose();
          return;
        } else {
          throw new Error('Invalid verification code');
        }
      } catch (authError: any) {
        console.error('Authentication error:', authError);
        throw authError;
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);

      let errorMessage = 'Verification failed';
      if (error.message) {
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
    // Go back to phone step to request a new code
    setStep('phone');
    setLoading(false);
    toast.showInfo('Please request a new verification code');
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
              <h2 className="text-xl font-bold text-white mb-1 font-sans">Continue with Phone</h2>
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
                pattern="^\+?[1-9]\d{1,14}$"
                title="Please enter a valid phone number with country code"
              />

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
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-full text-xs font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50 font-sans"
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              </div>

              <p className="text-white/50 text-[10px] text-center mt-2 font-sans">
                DEV MODE: No actual SMS will be sent
              </p>

              {/* Debug button for direct login - only in development */}
              <button
                type="button"
                onClick={() => {
                  const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
                  createDevUser(formattedPhoneNumber);
                  toast.showSuccess('DEV MODE: Direct login successful');
                  onClose();
                }}
                className="w-full mt-2 px-3 py-2 rounded-full text-[10px] font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors font-sans"
              >
                DEV MODE: Direct Login (Skip OTP)
              </button>
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
                  disabled={loading}
                  className="hover:text-white transition-colors font-sans"
                >
                  {loading ? 'Sending...' : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="hover:text-white transition-colors font-sans"
                >
                  Change Number
                </button>
              </div>

              <p className="text-white/50 text-[10px] text-center mt-2 font-sans">
                DEV MODE: Any 6-digit code will work
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevFirebasePhoneSignIn;
