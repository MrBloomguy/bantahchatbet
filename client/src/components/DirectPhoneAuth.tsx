import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import directSmsService from '../services/directSmsService';

interface DirectPhoneAuthProps {
  onClose: () => void;
}

const DirectPhoneAuth: React.FC<DirectPhoneAuthProps> = ({ onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const toast = useToast();
  const { refreshUser } = useAuth();

  // Format phone number
  const formatPhoneNumber = directSmsService.formatPhoneNumber;

  // Generate OTP
  const generateOTP = () => directSmsService.generateVerificationCode();

  // Handle phone number submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number
      if (!directSmsService.validatePhoneNumber(phoneNumber)) {
        throw new Error('Please enter a valid phone number with country code');
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Generate verification code
      const generatedOTP = generateOTP();
      setVerificationCode(generatedOTP);

      // Send verification code via SMS
      const smsResult = await directSmsService.sendVerificationCode(formattedPhoneNumber, generatedOTP);

      if (!smsResult.success) {
        throw new Error(smsResult.message || 'Failed to send verification code');
      }

      // Log for debugging
      console.log(`Verification code for ${formattedPhoneNumber}: ${generatedOTP}`);

      // Move to OTP screen
      setStep('otp');
      toast.showSuccess('Verification code sent! Check your phone.');

      // Start countdown for resend
      setCountdown(60);

      // Show the code in a toast as a fallback
      toast.showInfo(`Your verification code is: ${generatedOTP}`, 10000);
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

      if (enteredOTP !== verificationCode) {
        throw new Error('Invalid verification code. Please try again.');
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Create a username based on the phone number
      const phoneUsername = `phone_${formattedPhoneNumber.replace(/[^0-9]/g, '')}_${Math.floor(Math.random() * 1000)}`;

      // Check if a user with this phone number already exists
      const { data: existingUserByPhone, error: fetchPhoneError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', formattedPhoneNumber)
        .maybeSingle();

      if (fetchPhoneError && fetchPhoneError.code !== 'PGRST116') {
        console.error('Error checking for existing user by phone:', fetchPhoneError);
      }

      let existingUser = existingUserByPhone;

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
        const userId = uuidv4();

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
      // Generate a new verification code
      const newOTP = generateOTP();
      setVerificationCode(newOTP);

      // Clear OTP fields
      setOtp(['', '', '', '', '', '']);

      // Focus first input
      setTimeout(() => {
        document.getElementById('otp-0')?.focus();
      }, 100);

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Send the verification code via SMS
      const smsResult = await directSmsService.sendVerificationCode(formattedPhoneNumber, newOTP);

      if (!smsResult.success) {
        throw new Error(smsResult.message || 'Failed to send verification code');
      }

      // Start countdown for resend
      setCountdown(60);

      // Log for debugging
      console.log(`New verification code for ${formattedPhoneNumber}: ${newOTP}`);

      toast.showSuccess('New code sent! Check your phone.');

      // Show the code in a toast as a fallback
      toast.showInfo(`Your verification code is: ${newOTP}`, 10000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-md w-full mx-4 relative">
        <button
          type="button"
          onClick={onClose}
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

export default DirectPhoneAuth;
