import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface WhatsAppAuthProps {
  onClose: () => void;
}

const WhatsAppAuth: React.FC<WhatsAppAuthProps> = ({ onClose }) => {
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
      
      // In a real implementation, we would send a WhatsApp message with a verification code
      // For development, we'll simulate the process
      
      // Move to OTP screen
      setStep('otp');
      
      // Show a message to the user
      toast.showInfo('For development: A WhatsApp message would be sent to your phone. Use "123456" for testing.', 10000);
      
      // In production, you would integrate with the WhatsApp Business API
      // to send a verification code to the user's phone
    } catch (error: any) {
      console.error('WhatsApp sign in error:', error);
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
      
      console.log('Verifying WhatsApp OTP:', enteredOTP);
      
      // For development, accept "123456" as a valid code
      if (enteredOTP === "123456") {
        console.log('Valid WhatsApp OTP code entered');
        
        // Simulate a successful authentication
        const userId = `whatsapp_${formattedPhoneNumber.replace(/[^0-9]/g, '')}_${Date.now()}`;
        
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
              updated_at: new Date().toISOString(),
              whatsapp_verified: true
            })
            .eq('id', existingUser.id);
            
          if (updateError) {
            console.error('Error updating user:', updateError);
          }
          
          // Set the user in auth context
          refreshUser({
            ...existingUser,
            points: existingUser.reputation_score || 0,
            whatsapp_verified: true
          });
        } else {
          console.log('Creating new user with WhatsApp:', formattedPhoneNumber);
          
          // Create a new user
          const whatsappUsername = `whatsapp_${formattedPhoneNumber.replace(/[^0-9]/g, '')}_${Math.floor(Math.random() * 1000)}`;
          
          const newUser = {
            id: userId,
            name: `User ${formattedPhoneNumber.slice(-4)}`,
            username: whatsappUsername,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formattedPhoneNumber}`,
            bio: `WhatsApp user (${formattedPhoneNumber})`,
            phone_number: formattedPhoneNumber,
            whatsapp_verified: true,
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
          
          console.log('New WhatsApp user created:', insertedUser);
          
          // Set the user in auth context
          refreshUser({
            ...insertedUser,
            points: 0
          });
        }
        
        toast.showSuccess('Signed in with WhatsApp successfully!');
        onClose();
      } else {
        console.error('Invalid WhatsApp OTP entered:', enteredOTP);
        throw new Error('Invalid verification code. For testing, use "123456".');
      }
    } catch (error: any) {
      console.error('WhatsApp OTP verification error:', error);
      toast.showError(error.message || 'Verification failed');
      
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      document.getElementById('whatsapp-otp-0')?.focus();
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
      document.getElementById(`whatsapp-otp-${index + 1}`)?.focus();
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
      console.log('Pasted WhatsApp OTP:', pastedData);
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
      document.getElementById(`whatsapp-otp-${index - 1}`)?.focus();
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
            {step === 'phone' ? 'Sign in with WhatsApp' : 'Verify WhatsApp Number'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {step === 'phone' 
              ? 'Enter your WhatsApp number to receive a verification code' 
              : 'Enter the 6-digit code sent to your WhatsApp'}
          </p>
        </div>
        
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label htmlFor="whatsapp-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                id="whatsapp-phone"
                placeholder="+234 800 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send WhatsApp Code'}
            </button>
            
            <div className="text-sm text-green-600 dark:text-green-400 mt-2 text-center font-medium">
              <p>For testing, use verification code: <span className="font-bold">123456</span></p>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp-otp-0" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verification Code
              </label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`whatsapp-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                    required
                    disabled={loading}
                    aria-label={`WhatsApp verification code digit ${index + 1}`}
                    title={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <div className="text-sm text-green-600 dark:text-green-400 mt-2 text-center font-medium">
              <p>For testing, use verification code: <span className="font-bold">123456</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppAuth;
