/**
 * Vonage Service for SMS Verification
 * This service handles SMS verification using Vonage (formerly Nexmo)
 */

interface SMSResponse {
  success: boolean;
  message: string;
  code?: string;
  requestId?: string;
}

// For development, we'll store verification codes in localStorage
// In production, these should be stored securely on the server
const storeVerificationCode = (phoneNumber: string, code: string, expiryMinutes = 10) => {
  localStorage.setItem(`verification_code_${phoneNumber}`, code);
  localStorage.setItem(
    `verification_code_expiry_${phoneNumber}`, 
    (Date.now() + expiryMinutes * 60 * 1000).toString()
  );
};

const getStoredVerificationCode = (phoneNumber: string) => {
  const code = localStorage.getItem(`verification_code_${phoneNumber}`);
  const expiryTime = localStorage.getItem(`verification_code_expiry_${phoneNumber}`);
  
  if (!code || !expiryTime) {
    return { code: null, isExpired: true };
  }
  
  const isExpired = Date.now() > parseInt(expiryTime);
  return { code, isExpired };
};

const clearStoredVerificationCode = (phoneNumber: string) => {
  localStorage.removeItem(`verification_code_${phoneNumber}`);
  localStorage.removeItem(`verification_code_expiry_${phoneNumber}`);
};

/**
 * Send verification code via SMS using Vonage API
 * 
 * Note: Due to CORS restrictions, this would typically be done through a server-side API
 * For development, we'll simulate the API call and store the code locally
 */
export const sendVerificationCode = async (phoneNumber: string): Promise<SMSResponse> => {
  try {
    console.log(`[Vonage] Sending verification code to ${phoneNumber}`);
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real implementation, you would call a server-side API that uses Vonage
    // For development, we'll simulate the API call
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store the code for verification
    storeVerificationCode(phoneNumber, code);
    
    // For development, return the code for display
    // In production, this would not include the code
    return {
      success: true,
      message: "Verification code sent",
      code: code, // Remove this in production
      requestId: `VON-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };
  } catch (error) {
    console.error('[Vonage] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send verification code'
    };
  }
};

/**
 * Verify code against stored code
 */
export const verifyCode = (phoneNumber: string, code: string): SMSResponse => {
  try {
    console.log(`[Vonage] Verifying code for ${phoneNumber}: ${code}`);
    
    // Get the stored code
    const { code: storedCode, isExpired } = getStoredVerificationCode(phoneNumber);
    
    // Check if the code exists and hasn't expired
    if (!storedCode) {
      return {
        success: false,
        message: "No verification code found. Please request a new code."
      };
    }
    
    if (isExpired) {
      return {
        success: false,
        message: "Verification code has expired. Please request a new code."
      };
    }
    
    // Check if the entered code matches the stored code
    if (code === storedCode) {
      // Clear the stored code after successful verification
      clearStoredVerificationCode(phoneNumber);
      
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
  } catch (error) {
    console.error('[Vonage] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify code'
    };
  }
};

/**
 * In a real implementation, this would be a server-side function that calls the Vonage API
 * For reference, here's how you would call the Vonage API using their Node.js SDK:
 * 
 * ```
 * const Vonage = require('@vonage/server-sdk');
 * 
 * const vonage = new Vonage({
 *   apiKey: "YOUR_API_KEY",
 *   apiSecret: "YOUR_API_SECRET"
 * });
 * 
 * vonage.message.sendSms(
 *   "Vonage", // From
 *   phoneNumber, // To
 *   `Your verification code is: ${code}`, // Message
 *   (err, responseData) => {
 *     if (err) {
 *       console.log(err);
 *     } else {
 *       console.log(responseData);
 *     }
 *   }
 * );
 * ```
 */

export default {
  sendVerificationCode,
  verifyCode
};
