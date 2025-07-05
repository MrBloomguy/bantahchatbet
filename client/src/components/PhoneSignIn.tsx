import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const PhoneSignIn: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const toast = useToast();
  const { refreshUser } = useAuth();

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(cleaned)) {
      throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)');
    }
    
    return cleaned;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
          data: {
            // Optional metadata
            signInMethod: 'phone',
            provider: 'vonage'
          }
        }
      });

      if (error) throw error;

      setStep('otp');
      toast.showSuccess('Verification code sent! Check your phone.');
      setRetryCount(0); // Reset retry count on successful send
    } catch (error: any) {
      console.error('Phone sign in error:', error);
      const errorMessage = error.message?.includes('rate limit')
        ? 'Too many attempts. Please try again later.'
        : error.message || 'Failed to send verification code';
      toast.showError(errorMessage);
      setRetryCount(prev => prev + 1);
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
      const token = otp.join('');
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms'
      });

      if (error) throw error;

      await refreshUser();
      onClose();
      toast.showSuccess('Successfully signed in!');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.message?.includes('Invalid')
        ? 'Invalid verification code. Please try again.'
        : error.message || 'Verification failed';
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
    if (retryCount >= 3) {
      toast.showError('Maximum retry attempts reached. Please try again later.');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms'
        }
      });

      if (error) throw error;

      toast.showSuccess('New code sent! Check your phone.');
      setRetryCount(prev => prev + 1);
    } catch (error: any) {
      console.error('Resend code error:', error);
      toast.showError(error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-[#0f1015] rounded-2xl p-6 w-full max-w-md mx-4">
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit}>
            <h2 className="text-2xl font-bold text-white mb-2">Sign in with phone</h2>
            <p className="text-gray-400 mb-6">
              Enter your phone number with country code
            </p>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full mb-6 bg-[#1a1b2e] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
              required
              pattern="^\+?\d{10,15}$"
              title="Please enter a valid phone number with country code"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#1a1b2e] text-white hover:bg-[#2f3049] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || retryCount >= 3}
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <h2 className="text-2xl font-bold text-white mb-2">Enter verification code</h2>
            <p className="text-gray-400 mb-6">
              We've sent a code to {phoneNumber}
            </p>
            <div className="grid grid-cols-6 gap-2 mb-6">
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
                  className="w-full aspect-square bg-[#1a1b2e] text-white text-center text-xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                  disabled={loading}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-[#CCFF00] text-black hover:bg-[#b3ff00] transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading || retryCount >= 3}
              className="w-full mt-3 px-4 py-3 rounded-xl font-medium text-[#CCFF00] hover:bg-[#1a1b2e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : `Resend Code (${3 - retryCount} attempts left)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneSignIn;