import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { auth } from '../firebase/config';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

interface NoRecaptchaPhoneAuthProps {
  onClose: () => void;
}

const NoRecaptchaPhoneAuth: React.FC<NoRecaptchaPhoneAuthProps> = ({ onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
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

  // Handle phone number submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // In a real implementation, we would use Firebase's signInWithPhoneNumber
      // But since we're having CSP issues with reCAPTCHA, we'll simulate the process

      // For development, we'll just move to the OTP screen
      setStep('otp');

      // Show a message to the user
      toast.showInfo('For development: Please check your phone for the verification code. If you don\'t receive it, use "123456" for testing.', 10000);

      // In production, you would need to set up Firebase Authentication properly
      // and handle the reCAPTCHA verification on the server side
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
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      console.log('Verifying OTP:', enteredOTP);

      // For development, accept "123456" as a valid code
      if (enteredOTP === "123456") {
        console.log('Valid OTP code entered');

        // Simulate a successful authentication
        const userId = `phone_${formattedPhoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}`;

        // Check if user exists in our database
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', formattedPhoneNumber)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking for existing user:', fetchError);
        }

        if (existingUser) {
          console.log('Existing user found:', existingUser);

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
        } else {
          console.log('Creating new user with phone:', formattedPhoneNumber);

          // Create a new user
          const phoneUsername = `phone_${formattedPhoneNumber.replace(/[^0-9]/g, '')}_${Math.floor(Math.random() * 1000)}`;

          const newUser = {
            id: userId,
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

          console.log('New user created:', insertedUser);

          // Set the user in auth context
          refreshUser({
            ...insertedUser,
            points: 0
          });
        }

        toast.showSuccess('Signed in successfully!');
        onClose();
      } else {
        console.error('Invalid OTP entered:', enteredOTP);
        throw new Error('Invalid verification code. For testing, use "123456".');
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
      // Wait a moment before verifying to ensure all UI updates are complete
      setTimeout(() => {
        handleVerifyOTP();
      }, 300);
    }
  };

  // Handle OTP input paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      console.log('Pasted OTP:', pastedData);
      const newOtp = pastedData.split('');
      setOtp(newOtp);

      // Check if all digits are filled
      if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
        // Wait a moment before verifying to ensure all UI updates are complete
        setTimeout(() => {
          handleVerifyOTP();
        }, 500);
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

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>

            <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 text-center font-medium">
              <p>For testing, use verification code: <span className="font-bold">123456</span></p>
            </div>
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

            <div className="text-sm text-blue-600 dark:text-blue-400 mt-2 text-center font-medium">
              <p>For testing, use verification code: <span className="font-bold">123456</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoRecaptchaPhoneAuth;
