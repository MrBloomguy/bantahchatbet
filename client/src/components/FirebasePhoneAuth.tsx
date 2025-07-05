import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider } from 'firebase/auth';

interface FirebasePhoneAuthProps {
  onClose: () => void;
}

const FirebasePhoneAuth: React.FC<FirebasePhoneAuthProps> = ({ onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [countdown, setCountdown] = useState(0);
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

  // Validate phone number
  const validatePhoneNumber = (number: string): boolean => {
    return /^\+?[1-9]\d{1,14}$/.test(number);
  };

  // Initialize reCAPTCHA verifier
  const initializeRecaptcha = () => {
    try {
      // Use a visible reCAPTCHA instead of invisible
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal', // Use normal size for visible reCAPTCHA
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA verified');
          // Enable the send button when reCAPTCHA is solved
          document.getElementById('send-code-button')?.removeAttribute('disabled');
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          toast.showError('reCAPTCHA expired. Please try again.');
          // Disable the send button when reCAPTCHA expires
          document.getElementById('send-code-button')?.setAttribute('disabled', 'true');
        }
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
    }
  };

  // Request verification code from Firebase
  const requestVerificationCode = async (phoneNumber: string) => {
    try {
      console.log(`[Firebase] Requesting verification code for ${phoneNumber}`);

      // Use the existing reCAPTCHA verifier
      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized. Please refresh the page and try again.');
      }

      const appVerifier = window.recaptchaVerifier;

      // Request verification code from Firebase
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

      // Store the verification ID for later use
      setVerificationId(confirmationResult.verificationId);

      console.log('Verification code sent via Firebase');

      return {
        success: true,
        message: "Verification code sent to your phone"
      };
    } catch (error: any) {
      console.error('Error requesting verification code:', error);

      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;

        // Reinitialize reCAPTCHA after a short delay
        setTimeout(() => {
          initializeRecaptcha();
        }, 1000);
      }

      throw new Error(error.message || 'Failed to send verification code');
    }
  };

  // Handle phone number submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        throw new Error('Please enter a valid phone number with country code');
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Request verification code from Firebase
      const result = await requestVerificationCode(formattedPhoneNumber);

      if (!result.success) {
        throw new Error(result.message || 'Failed to send verification code');
      }

      // Move to OTP screen
      setStep('otp');
      toast.showSuccess('Verification code sent! Check your phone.');

      // Start countdown for resend
      setCountdown(60);
    } catch (error: any) {
      console.error('Phone sign in error:', error);
      toast.showError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    setLoading(true);

    try {
      const enteredOTP = otp.join('');

      if (enteredOTP.length !== 6) {
        throw new Error('Please enter all 6 digits of the verification code');
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Create a credential with the verification ID and OTP
      const credential = PhoneAuthProvider.credential(verificationId, enteredOTP);

      // Sign in with the credential
      const result = await auth.signInWithCredential(credential);

      if (!result.user) {
        throw new Error('Failed to sign in with the provided code');
      }

      console.log('Firebase authentication successful:', result.user);

      // Check if user exists in our users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', formattedPhoneNumber)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', fetchError);
      }

      if (existingUser) {
        // User exists, update their profile
        const { error: updateError } = await supabase
          .from('users')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('Error updating user:', updateError);
        }

        // Set the user in auth context
        refreshUser({
          ...existingUser,
          points: existingUser.reputation_score || 0
        });

        toast.showSuccess('Signed in successfully!');
        onClose();
      } else {
        // Create a new user
        const phoneUsername = `phone_${formattedPhoneNumber.replace(/[^0-9]/g, '')}_${Math.floor(Math.random() * 1000)}`;

        const newUser = {
          id: result.user.uid,
          name: `User ${formattedPhoneNumber.slice(-4)}`,
          username: phoneUsername,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formattedPhoneNumber}`,
          bio: `Phone user (${formattedPhoneNumber})`,
          phone_number: formattedPhoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reputation_score: 0
        };

        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw new Error('Failed to create user account');
        }

        // Set the user in auth context
        refreshUser({
          ...insertedUser,
          points: 0
        });

        toast.showSuccess('Account created successfully!');
        onClose();
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.showError(error.message || 'Verification failed');

      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    // Check if all digits are filled
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleVerifyOTP();
    }
  };

  // Handle OTP input paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);

      // Check if all digits are filled
      if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
        setTimeout(() => {
          handleVerifyOTP();
        }, 100);
      }
    }
  };

  // Handle OTP input keydown
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current input is empty
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);

    try {
      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Request verification code from Firebase
      const result = await requestVerificationCode(formattedPhoneNumber);

      if (!result.success) {
        throw new Error(result.message || 'Failed to resend verification code');
      }

      // Clear OTP fields
      setOtp(['', '', '', '', '', '']);

      // Focus first input
      setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 100);

      // Start countdown for resend
      setCountdown(60);

      toast.showSuccess('New code sent! Check your phone.');
    } catch (error: any) {
      console.error('Resend code error:', error);
      toast.showError(error.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Initialize reCAPTCHA when component mounts and clean up on unmount
  useEffect(() => {
    // Initialize reCAPTCHA when the component mounts
    if (step === 'phone') {
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        initializeRecaptcha();
      }, 1000);
    }

    // Clean up reCAPTCHA on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-md w-full mx-4 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="absolute top-3 left-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-6 mt-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 'phone' ? 'Sign in with Phone' : 'Verify Phone Number'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {step === 'phone'
              ? 'Enter your phone number to receive a verification code'
              : 'Enter the 6-digit code sent to your phone'}
          </p>
        </div>

        {/* reCAPTCHA will be rendered in the form */}

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                placeholder="+234 800 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Include country code (e.g., +234 for Nigeria)
              </p>
            </div>

            {/* Visible reCAPTCHA container */}
            <div id="recaptcha-container" className="flex justify-center my-4"></div>

            <button
              id="send-code-button"
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="otp-0" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verification Code
              </label>
              <div className="flex justify-between gap-2">
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
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                    disabled={loading}
                    aria-label={`Verification code digit ${index + 1}`}
                    title={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading || countdown > 0}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add RecaptchaVerifier to the Window interface
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
  }
}

// Initialize the recaptchaVerifier property
window.recaptchaVerifier = null;

export default FirebasePhoneAuth;
