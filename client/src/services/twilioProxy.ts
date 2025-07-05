// This file provides a proxy service for Twilio API calls
// It helps avoid CORS and CSP issues by using a server-side proxy

import { supabase } from '../lib/supabase';

interface TwilioProxyResponse {
  success: boolean;
  message: string;
  sid?: string;
}

/**
 * Send SMS via Supabase function proxy
 * This avoids CORS and CSP issues by using a server-side proxy
 */
export const sendSMSViaProxy = async (
  phoneNumber: string,
  message: string
): Promise<TwilioProxyResponse> => {
  try {
    // For development, we'll just log the message
    console.log(`[Twilio Proxy] Sending to: ${phoneNumber}, Message: ${message}`);
    
    // Extract verification code for logging
    const verificationCode = message.match(/\d{6}/)?.[0] || '';
    if (verificationCode) {
      console.log(`[Twilio Proxy] Verification code: ${verificationCode}`);
    }
    
    // In a real implementation, you would call a Supabase Edge Function
    // that handles the Twilio API call server-side
    /*
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: phoneNumber,
        message: message
      }
    });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      message: 'SMS sent successfully',
      sid: data.sid
    };
    */
    
    // For now, simulate a successful response
    return {
      success: true,
      message: 'SMS sent successfully (simulated)',
      sid: 'SM' + Math.random().toString(36).substring(2, 15)
    };
  } catch (error) {
    console.error('[Twilio Proxy] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
};

export default {
  sendSMSViaProxy
};
