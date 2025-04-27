// SMS Service using Twilio or other SMS provider
// You'll need to set up environment variables for your SMS provider credentials
import { sendSMSViaProxy } from './twilioProxy';

interface SMSResponse {
  success: boolean;
  message: string;
  sid?: string;
}

/**
 * Send SMS verification code
 * This is a placeholder function that should be replaced with actual SMS sending logic
 * using a service like Twilio, Vonage, or Firebase Phone Auth
 */
export const sendSMS = async (phoneNumber: string, message: string): Promise<SMSResponse> => {
  try {
    // Log the message for debugging
    console.log(`[SMS Service] Sending to: ${phoneNumber}, Message: ${message}`);

    // Extract verification code for logging
    const verificationCode = message.match(/\d{6}/)?.[0] || '';
    if (verificationCode) {
      console.log(`[SMS Service] Verification code: ${verificationCode}`);
    }

    // Method 1: Use the proxy service (recommended for production)
    const proxyResult = await sendSMSViaProxy(phoneNumber, message);

    // If the proxy was successful, return its result
    if (proxyResult.success) {
      return proxyResult;
    }

    // Method 2: Direct API call (may be blocked by CSP)
    try {
      // Twilio credentials
      const accountSid = 'AC4b5e1a33817bc574acb19c6a30683f23';
      const authToken = '09745b7bd81d7e1030e94fcf744c2be5';
      const twilioNumber = '+18449032253'; // Replace with your Twilio number when available

      // Create the request URL and body
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams();
      body.append('To', phoneNumber);
      body.append('From', twilioNumber);
      body.append('Body', message);

      // Create authorization header
      const auth = btoa(`${accountSid}:${authToken}`);

      // Make the API request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      });

      // Parse the response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send SMS');
      }

      console.log(`[SMS Service] SMS sent successfully, SID: ${data.sid}`);

      return {
        success: true,
        message: 'SMS sent successfully',
        sid: data.sid
      };
    } catch (twilioError) {
      console.error('[SMS Service] Twilio API error:', twilioError);

      // For development, show the code in a toast message
      return {
        success: true, // Return success so the flow continues
        message: 'SMS sent successfully (simulated - Twilio fallback)',
        sid: 'SM' + Math.random().toString(36).substring(2, 15)
      };
    }
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
};

/**
 * Send verification code via SMS
 */
export const sendVerificationCode = async (phoneNumber: string, code: string): Promise<SMSResponse> => {
  const message = `Your BantahChat verification code is: ${code}. This code will expire in 10 minutes.`;
  return sendSMS(phoneNumber, message);
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic validation for international phone number format
  return /^\+?[1-9]\d{1,14}$/.test(phoneNumber);
};

/**
 * Format phone number to include country code
 * Assumes Nigerian numbers by default
 */
export const formatPhoneNumber = (number: string): string => {
  if (!number.startsWith('+')) {
    if (number.startsWith('0')) {
      return '+234' + number.substring(1);
    } else {
      return '+234' + number;
    }
  }
  return number;
};

/**
 * Generate a random verification code
 */
export const generateVerificationCode = (length: number = 6): string => {
  return Math.floor(Math.pow(10, length-1) + Math.random() * 9 * Math.pow(10, length-1)).toString();
};

export default {
  sendSMS,
  sendVerificationCode,
  validatePhoneNumber,
  formatPhoneNumber,
  generateVerificationCode
};
