# Real SMS Verification Implementation Guide

This guide explains how to implement real SMS verification using Twilio and Supabase Edge Functions.

## Overview

The SMS verification system consists of two parts:

1. **Client-Side**: The React components that handle user interaction
2. **Server-Side**: The Supabase Edge Functions that handle code generation, SMS sending, and verification

## Server-Side Implementation

### 1. Deploy the Supabase Edge Functions

```bash
# Deploy the request-verification function
supabase functions deploy request-verification

# Deploy the verify-code function
supabase functions deploy verify-code
```

### 2. Set Environment Variables

```bash
# Set the Twilio credentials
supabase secrets set \
  TWILIO_ACCOUNT_SID=AC4b5e1a33817bc574acb19c6a30683f23 \
  TWILIO_AUTH_TOKEN=09745b7bd81d7e1030e94fcf744c2be5 \
  TWILIO_PHONE_NUMBER=+18449032253
```

### 3. Create the Verification Codes Table

Run the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_number ON verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
```

## Client-Side Implementation

### 1. Update the RealPhoneAuth Component

Update the `RealPhoneAuth.tsx` component to call the Supabase Edge Functions:

```typescript
// Request verification code from server
const requestVerificationCode = async (phoneNumber: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('request-verification', {
      body: { phoneNumber }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error requesting verification code:', error);
    throw error;
  }
};

// Verify code with server
const verifyCodeWithServer = async (phoneNumber: string, code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-code', {
      body: { phoneNumber, code }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};
```

## How It Works

1. **User Enters Phone Number**:
   - The client calls the `request-verification` function
   - The function generates a random 6-digit code
   - The function stores the code in the database
   - The function sends the code via Twilio SMS

2. **User Enters Verification Code**:
   - The client calls the `verify-code` function
   - The function checks if the code is valid and not expired
   - The function marks the code as used
   - The function returns success or failure

3. **User Authentication**:
   - If verification is successful, the client checks if the user exists
   - If the user exists, they are logged in
   - If the user doesn't exist, a new account is created

## Security Considerations

1. **Code Generation**: Codes are generated on the server, not the client
2. **Code Storage**: Codes are stored securely in the database with expiration
3. **Code Verification**: Codes are verified on the server, not the client
4. **Twilio Credentials**: Credentials are stored securely as environment variables

## Troubleshooting

1. **SMS Not Delivered**:
   - Check the Twilio logs for delivery status
   - Verify the phone number format (E.164 format: +[country code][number])
   - Check if the Twilio account has sufficient funds

2. **Verification Fails**:
   - Check if the code has expired (10-minute expiration)
   - Verify that the user is entering the correct code
   - Check the server logs for any errors

## Development vs. Production

In development mode, the system will:
- Accept any 6-digit code for verification
- Show detailed error messages

In production mode, the system will:
- Only accept valid codes from the database
- Show generic error messages for security

## Conclusion

This implementation provides a secure, production-ready SMS verification system using Twilio and Supabase Edge Functions. It follows best practices for security and user experience.
