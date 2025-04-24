/**
 * Utility functions for Paystack integration
 */

// Function to load the Paystack script
export const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window.PaystackPop !== 'undefined') {
      console.log('PaystackPop already available');
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="paystack.co/v1/inline.js"]');
    if (existingScript) {
      // Script tag exists, wait for it to load
      const checkPaystack = setInterval(() => {
        if (typeof window.PaystackPop !== 'undefined') {
          clearInterval(checkPaystack);
          console.log('PaystackPop loaded from existing script');
          resolve();
        }
      }, 100);

      // Set a timeout to avoid infinite checking
      setTimeout(() => {
        clearInterval(checkPaystack);
        if (typeof window.PaystackPop === 'undefined') {
          console.error('Paystack script exists but PaystackPop not available');
          reject(new Error('Paystack initialization timed out'));
        }
      }, 5000);
      
      return;
    }

    // Create and load the script
    console.log('Creating new Paystack script tag');
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Paystack script loaded, checking for PaystackPop');
      
      // Check if PaystackPop is available
      const checkPaystack = setInterval(() => {
        if (typeof window.PaystackPop !== 'undefined') {
          clearInterval(checkPaystack);
          console.log('PaystackPop now available');
          resolve();
        }
      }, 100);
      
      // Set a timeout to avoid infinite checking
      setTimeout(() => {
        clearInterval(checkPaystack);
        if (typeof window.PaystackPop === 'undefined') {
          console.error('Paystack script loaded but PaystackPop not available');
          reject(new Error('Paystack initialization timed out'));
        }
      }, 5000);
    };
    
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      reject(new Error('Failed to load Paystack script'));
    };
    
    document.head.appendChild(script);
  });
};

// Function to check if Paystack is loaded
export const isPaystackLoaded = (): boolean => {
  return typeof window.PaystackPop !== 'undefined';
};

// Add PaystackPop to the window object type
declare global {
  interface Window {
    PaystackPop: any;
  }
}
