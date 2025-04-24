import { useEffect, useState } from 'react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const PaystackScript = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    if (window.PaystackPop) {
      setScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="paystack.co/v1/inline.js"]');
    if (existingScript) {
      // Script tag exists, wait for it to load
      const checkPaystack = setInterval(() => {
        if (window.PaystackPop) {
          clearInterval(checkPaystack);
          setScriptLoaded(true);
        }
      }, 100);

      return () => clearInterval(checkPaystack);
    }

    // Create and load the script
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
          // Script loaded but PaystackPop might not be available immediately
          const checkPaystack = setInterval(() => {
            if (window.PaystackPop) {
              clearInterval(checkPaystack);
              setScriptLoaded(true);
              resolve();
            }
          }, 100);

          // Set a timeout to avoid infinite checking
          setTimeout(() => {
            clearInterval(checkPaystack);
            if (!window.PaystackPop) {
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

    loadScript().catch(error => {
      console.error('Error loading Paystack script:', error);
    });

    return () => {
      // Don't remove the script on unmount as it might be needed by other components
    };
  }, []);

  return null;
};
