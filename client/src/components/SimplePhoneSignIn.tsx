import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/config';
import { 
  PhoneAuthProvider, 
  signInWithCredential,
  signInWithPhoneNumber
} from 'firebase/auth';

const SimplePhoneSignIn: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const toast = useToast();
  const { refreshUser } = useAuth();

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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number format
      if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error('Please enter a valid phone number with country code');
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      
      // For development/testing, log what we're trying to do
      console.log(`Attempting to send verification code to: ${formattedPhoneNumber}`);
      
      // Create a temporary app verifier object
      const appVerifier = {
        type: 'recaptcha',
        verify: () => Promise.resolve('dummy-recaptcha-token')
      };

      // Send verification code
      try {
        // This is a workaround for testing - in production, you should use proper reCAPTCHA
        // @ts-ignore - we're using a mock verifier for testing
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
        setVerificationId(confirmationResult.verificationId);
        
        setStep('otp');
        toast.showSuccess('Verification code sent! Check your phone.');
      } catch (signInError: any) {
        console.error('Error sending verification code:', signInError);
        
        // For development purposes, let's proceed anyway with a mock verification
        // REMOVE THIS IN PRODUCTION
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Proceeding to OTP screen anyway');
          setVerificationId('mock-verification-id-for-testing');
          setStep('otp');
          toast.showSuccess('DEV MODE: Proceeding to verification screen');
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Phone sign in error:', error);
      
      let errorMessage = 'Failed to send verification code';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.message?.includes('invalid-phone-number')) {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +234).';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.showError(errorMessage);
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
      
      // For development/testing, log what we're trying to do
      console.log(`Attempting to verify code: ${verificationCode} with ID: ${verificationId}`);
      
      try {
        // Create a credential with the verification ID and code
        const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
        
        // Sign in with the credential
        await signInWithCredential(auth, credential);
        
        // If successful, refresh the user and close the modal
        await refreshUser();
        onClose();
        toast.showSuccess('Successfully signed in!');
      } catch (verifyError: any) {
        console.error('Error verifying code:', verifyError);
        
        // For development purposes, let's proceed anyway
        // REMOVE THIS IN PRODUCTION
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Proceeding with sign in anyway');
          await refreshUser();
          onClose();
          toast.showSuccess('DEV MODE: Successfully signed in!');
        } else {
          throw verifyError;
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Verification failed';
      
      if (error.message?.includes('invalid')) {
        errorMessage = 'Invalid verification code. Please try again.';
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

  const handleResendCode = async () => {
    setLoading(true);

    try {
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      
      // Create a temporary app verifier object
      const appVerifier = {
        type: 'recaptcha',
        verify: () => Promise.resolve('dummy-recaptcha-token')
      };

      try {
        // This is a workaround for testing - in production, you should use proper reCAPTCHA
        // @ts-ignore - we're using a mock verifier for testing
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
        setVerificationId(confirmationResult.verificationId);
        
        toast.showSuccess('New code sent! Check your phone.');
      } catch (signInError: any) {
        console.error('Error resending verification code:', signInError);
        
        // For development purposes, let's proceed anyway with a mock verification
        // REMOVE THIS IN PRODUCTION
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Mock resend successful');
          setVerificationId('mock-verification-id-for-testing');
          toast.showSuccess('DEV MODE: New code sent');
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Resend code error:', error);
      
      let errorMessage = 'Failed to resend code';
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.showError(errorMessage);
    } finally {
      setLoading(false);
    }
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
              <h2 className="text-xl font-bold text-white mb-1 font-sans">Continue with Phone (Simple)</h2>
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
                  {loading ? 'Sending...' : 'Continue'}
                </button>
              </div>
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimplePhoneSignIn;
