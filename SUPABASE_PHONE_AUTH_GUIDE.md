# Supabase Phone Authentication Guide

This guide explains how to set up and use Supabase's built-in phone authentication with Twilio.

## Overview

Supabase provides native phone authentication that integrates with Twilio for sending SMS verification codes. This approach is more secure and reliable than client-side implementations because:

1. Verification codes are generated and stored securely on the server
2. SMS messages are sent directly from Twilio to the user's phone
3. Verification is handled by Supabase's secure authentication system

## Configuration Steps

### 1. Configure Twilio in Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to "Authentication" > "Providers" > "Phone"
4. Enable the Phone provider
5. Enter your Twilio credentials:
   - **Twilio Account SID**: `AC4b5e1a33817bc574acb19c6a30683f23`
   - **Twilio Auth Token**: `09745b7bd81d7e1030e94fcf744c2be5`
   - **Twilio Message Service SID**: (Optional, create one in Twilio if needed)

6. Configure SMS settings:
   - **Enable phone confirmations**: Check this box
   - **SMS OTP Expiry**: `60` seconds (or your preferred duration)
   - **SMS OTP Length**: `6` digits
   - **SMS Message**: `Your BantahChat verification code is: {{ .Code }}`

7. (Optional) Add test phone numbers for development:
   - Format: `+1234567890=123456` (comma-separated list)
   - This allows testing without actual SMS costs

8. Click "Save" to apply the changes

### 2. Purchase a Twilio Phone Number

If you don't already have a Twilio phone number:

1. Log in to your [Twilio Console](https://console.twilio.com)
2. Go to "Phone Numbers" > "Buy a Number"
3. Search for a number with SMS capabilities
4. Purchase the number
5. Use this number in your Twilio configuration

### 3. Test the Implementation

1. Open your application
2. Click "Sign in with Phone"
3. Enter your phone number
4. You should receive an SMS with a verification code
5. Enter the code to complete authentication

## How It Works

1. **Request Verification Code**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithOtp({
     phone: phoneNumber
   });
   ```

2. **Verify Code**:
   ```typescript
   const { data, error } = await supabase.auth.verifyOtp({
     phone: phoneNumber,
     token: code,
     type: 'sms'
   });
   ```

3. **User Management**:
   - If the user doesn't exist in your `users` table, create a new record
   - If the user exists, update their profile as needed

## Troubleshooting

### SMS Not Being Received

1. **Check Twilio Logs**:
   - Log in to your Twilio Console
   - Go to "Monitor" > "Logs" > "SMS"
   - Check for any errors or failed deliveries

2. **Verify Phone Number Format**:
   - Phone numbers must be in E.164 format: `+[country code][number]`
   - Example: `+2348012345678` for Nigeria

3. **Check Twilio Balance**:
   - Ensure your Twilio account has sufficient funds

### Verification Failures

1. **Check OTP Expiry**:
   - Verification codes expire after the configured time (default: 60 seconds)
   - Make sure users enter the code before it expires

2. **Check Rate Limits**:
   - Supabase has rate limits for authentication attempts
   - Too many failed attempts may trigger temporary blocks

## Security Considerations

1. **Rate Limiting**:
   - Implement client-side rate limiting to prevent abuse
   - Limit the number of verification attempts per phone number

2. **User Education**:
   - Inform users to expect an SMS and to enter the code promptly
   - Warn users about potential SMS delivery delays

3. **Fallback Authentication**:
   - Provide alternative authentication methods (email, social login)
   - Have a support process for users who can't receive SMS

## Conclusion

Supabase's built-in phone authentication with Twilio provides a secure, reliable way to implement phone verification in your application. By following this guide, you can ensure that your users can authenticate securely using their phone numbers.
