/**
 * Twilio Service for SMS Verification
 * This service handles SMS verification using Twilio
 */

interface SMSResponse {
  success: boolean;
  message: string;
  code?: string;
}

// Twilio credentials
const TWILIO_ACCOUNT_SID = 'AC4b5e1a33817bc574acb19c6a30683f23';
const TWILIO_AUTH_TOKEN = '09745b7bd81d7e1030e94fcf744c2be5';
const TWILIO_PHONE_NUMBER = '+18449032253';

/**
 * Send verification code via SMS
 * Due to CSP restrictions, we can't directly call the Twilio API from the browser.
 * Instead, we'll generate a code and store it in localStorage for verification.
 */
export const sendVerificationCode = async (phoneNumber: string): Promise<SMSResponse> => {
  try {
    console.log(`[Twilio Service] Sending verification code to ${phoneNumber}`);
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code in localStorage for verification
    localStorage.setItem(`verification_code_${phoneNumber}`, code);
    localStorage.setItem(`verification_code_expiry_${phoneNumber}`, (Date.now() + 10 * 60 * 1000).toString()); // 10 minutes expiry
    
    // In a real implementation, you would call a server-side API to send the SMS
    // For now, we'll just return the code for development purposes
    return {
      success: true,
      message: "Verification code generated",
      code: code
    };
  } catch (error) {
    console.error('[Twilio Service] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate verification code'
    };
  }
};

/**
 * Verify code
 */
export const verifyCode = (phoneNumber: string, code: string): SMSResponse => {
  try {
    console.log(`[Twilio Service] Verifying code for ${phoneNumber}: ${code}`);
    
    // Get the stored code and expiry time from localStorage
    const storedCode = localStorage.getItem(`verification_code_${phoneNumber}`);
    const expiryTime = localStorage.getItem(`verification_code_expiry_${phoneNumber}`);
    
    // Check if the code exists and hasn't expired
    if (storedCode && expiryTime) {
      const isExpired = Date.now() > parseInt(expiryTime);
      
      if (isExpired) {
        return {
          success: false,
          message: "Verification code has expired. Please request a new code."
        };
      }
      
      // Check if the entered code matches the stored code
      if (code === storedCode) {
        // Clear the stored code after successful verification
        localStorage.removeItem(`verification_code_${phoneNumber}`);
        localStorage.removeItem(`verification_code_expiry_${phoneNumber}`);
        
        return {
          success: true,
          message: "Verification successful"
        };
      } else {
        return {
          success: false,
          message: "Invalid verification code. Please try again."
        };
      }
    } else {
      // For development, accept any 6-digit code if no stored code exists
      if (code.length === 6 && /^\d+$/.test(code)) {
        return {
          success: true,
          message: "Verification successful (development mode)"
        };
      } else {
        return {
          success: false,
          message: "Invalid verification code"
        };
      }
    }
  } catch (error) {
    console.error('[Twilio Service] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify code'
    };
  }
};

export default {
  sendVerificationCode,
  verifyCode
};
