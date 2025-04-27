import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithCredential,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from './config';

// Store the verification ID for later use
let storedVerificationId: string | null = null;

/**
 * Initialize the reCAPTCHA verifier
 * @param containerId - The ID of the container element for reCAPTCHA
 * @returns The RecaptchaVerifier instance
 */
export const initRecaptchaVerifier = (containerId: string) => {
  try {
    // Clear any existing reCAPTCHA widgets
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    // Create a new RecaptchaVerifier instance with invisible size
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible', // Change to invisible for better UX
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        console.log('reCAPTCHA expired');
      }
    });

    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    throw error;
  }
};

/**
 * Send verification code to the phone number
 * @param phoneNumber - The phone number to send the verification code to
 * @param recaptchaVerifier - The RecaptchaVerifier instance
 * @returns Promise that resolves when the verification code is sent
 */
export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
) => {
  try {
    // Format the phone number if needed (e.g., add country code)
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    // Send the verification code
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhoneNumber,
      recaptchaVerifier
    );

    // Store the verification ID for later use
    storedVerificationId = confirmationResult.verificationId;

    return confirmationResult;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

/**
 * Verify the code entered by the user
 * @param verificationCode - The verification code entered by the user
 * @returns Promise that resolves with the user credential
 */
export const verifyCode = async (verificationCode: string) => {
  try {
    if (!storedVerificationId) {
      throw new Error('Verification ID not found. Please request a new verification code.');
    }

    // Create a credential with the verification ID and code
    const credential = PhoneAuthProvider.credential(
      storedVerificationId,
      verificationCode
    );

    // Sign in with the credential
    const result = await signInWithCredential(auth, credential);

    // Clear the stored verification ID
    storedVerificationId = null;

    return result;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

/**
 * Format the phone number to include the country code if needed
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  // If the phone number doesn't start with +, assume it's a Nigerian number
  if (!phoneNumber.startsWith('+')) {
    // Add Nigerian country code (+234)
    if (phoneNumber.startsWith('0')) {
      // Remove the leading 0 and add +234
      return '+234' + phoneNumber.substring(1);
    } else if (phoneNumber.length >= 10) {
      // Just add +234
      return '+234' + phoneNumber;
    } else {
      // If it's too short, it might be missing the area code
      throw new Error('Please enter a valid phone number with area code');
    }
  }

  // Return the phone number as is if it already has a country code
  return phoneNumber;
};

/**
 * Get the current user
 * @returns The current user or null if not signed in
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Sign out the current user
 * @returns Promise that resolves when the user is signed out
 */
export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
