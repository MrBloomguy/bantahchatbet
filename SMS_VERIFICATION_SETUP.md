# SMS Verification Setup Guide

This document provides instructions for setting up SMS verification with Twilio in your application.

## Current Implementation

The current implementation simulates SMS sending for development purposes. When a user requests a verification code:

1. A random 6-digit code is generated
2. The code is displayed in the console and in a toast message
3. The user can enter this code to complete verification

## Setting Up Twilio for Production

To send real SMS messages in production, follow these steps:

### 1. Twilio Account Setup

You already have a Twilio account with the following credentials:
- Account SID: `AC4b5e1a33817bc574acb19c6a30683f23`
- Auth Token: `09745b7bd81d7e1030e94fcf744c2be5`
- User SID: `USf49ec21471f331f2b49aeb79c91238ae`

### 2. Purchase a Twilio Phone Number

1. Log in to your Twilio account
2. Go to "Phone Numbers" > "Buy a Number"
3. Search for a number with SMS capabilities
4. Purchase the number
5. Note down the phone number for use in your application

### 3. Install Twilio SDK

```bash
npm install twilio
```

### 4. Update the SMS Service

Edit `src/services/smsService.ts` to use your Twilio credentials:

```typescript
export const sendSMS = async (phoneNumber: string, message: string): Promise<SMSResponse> => {
  try {
    // Log the message for debugging
    console.log(`[SMS Service] Sending to: ${phoneNumber}, Message: ${message}`);
    
    // Twilio credentials
    const accountSid = 'AC4b5e1a33817bc574acb19c6a30683f23';
    const authToken = '09745b7bd81d7e1030e94fcf744c2be5';
    const twilioNumber = 'YOUR_TWILIO_PHONE_NUMBER'; // Replace with your purchased number
    
    try {
      // Import Twilio dynamically
      const twilioModule = await import('twilio');
      const client = twilioModule.default(accountSid, authToken);
      
      // Send the message
      const result = await client.messages.create({
        body: message,
        from: twilioNumber,
        to: phoneNumber
      });
      
      console.log(`[SMS Service] SMS sent successfully, SID: ${result.sid}`);
      
      return {
        success: true,
        message: 'SMS sent successfully',
        sid: result.sid
      };
    } catch (twilioError) {
      console.error('[SMS Service] Twilio error:', twilioError);
      
      // Handle Twilio errors appropriately in production
      return {
        success: false,
        message: twilioError instanceof Error ? twilioError.message : 'Failed to send SMS'
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
```

### 5. Test the Implementation

1. Test with a real phone number
2. Verify that SMS messages are being sent
3. Check your Twilio logs for any errors

### 6. Monitor Usage and Costs

1. Set up usage alerts in your Twilio account
2. Monitor SMS delivery rates
3. Keep track of costs

## Security Considerations

1. **Protect Your Auth Token**: Never expose your Twilio Auth Token in client-side code
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Verification Expiry**: Set verification codes to expire after a reasonable time (e.g., 10 minutes)
4. **Secure Storage**: Store verification attempts securely to prevent brute force attacks

## Troubleshooting

Common issues and solutions:

1. **SMS Not Delivered**: Check Twilio logs for delivery status
2. **Invalid Number Format**: Ensure phone numbers are in E.164 format (+[country code][number])
3. **Authentication Errors**: Verify your Twilio credentials are correct
4. **Rate Limiting**: Twilio may rate limit your account if you send too many messages

## Additional Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Console](https://www.twilio.com/console)
- [E.164 Phone Number Format](https://www.twilio.com/docs/glossary/what-e164)
