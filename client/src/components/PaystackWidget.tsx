import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useWallet } from '../contexts/WalletContext';
import { formatNaira } from '../utils/currency';
import { supabase } from '../lib/supabase';

// Define the PaystackResponse interface
interface PaystackResponse {
  reference: string;
  status: string;
  transaction: string;
  message: string;
}

// Add paystackLoaded to the window object type
declare global {
  interface Window {
    PaystackPop: any;
    paystackLoaded: boolean;
  }
}

interface PaystackWidgetProps {
  amount: number;
  onSuccess?: () => void;
  onClose?: () => void;
  className?: string;
}

// Direct implementation
export const PaystackWidget: React.FC<PaystackWidgetProps> = ({
  amount,
  onSuccess,
  onClose,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paystackReady, setPaystackReady] = useState(false);

  // Check if Paystack is available
  useEffect(() => {
    // Function to check if Paystack is loaded
    function checkPaystack() {
      if (typeof window.PaystackPop !== 'undefined') {
        console.log('PaystackPop is available in component');
        setPaystackReady(true);
        return;
      }

      // If window.paystackLoaded is true (set by our inline script), but PaystackPop is not defined
      // This is a strange edge case
      if (window.paystackLoaded && typeof window.PaystackPop === 'undefined') {
        console.error('window.paystackLoaded is true but PaystackPop is undefined');
        setError('Payment system error. Please refresh the page.');
        return;
      }

      // Check again in 500ms
      setTimeout(checkPaystack, 500);
    }

    // Start checking
    checkPaystack();

    // Set a timeout to stop checking after 10 seconds
    const timeout = setTimeout(() => {
      if (!paystackReady) {
        console.error('PaystackPop not available after timeout');
        setError('Payment system could not be loaded. Please refresh the page.');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const handlePayment = () => {
    setError(null);

    // Double-check if PaystackPop is available
    if (typeof window.PaystackPop === 'undefined') {
      console.error('PaystackPop is not available');
      setError('Payment system is not available. Please refresh the page.');
      return;
    }

    // Basic validation
    if (!currentUser?.id) {
      setError('Please sign in to make a deposit.');
      return;
    }

    if (!wallet?.id) {
      setError('Wallet not initialized. Please refresh the page.');
      return;
    }

    if (amount < 100) {
      setError('Minimum deposit amount is ₦100.');
      return;
    }

    setLoading(true);

    // Generate a unique reference
    const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    console.log('Generated reference:', reference);

    // Create transaction record
    supabase
      .from('transactions')
      .insert({
        user_id: currentUser.id,
        wallet_id: wallet.id,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        reference: reference,
        payment_provider: 'paystack',
        metadata: {
          provider: 'paystack',
          initiated_at: new Date().toISOString()
        }
      })
      .then(({ data, error: txError }) => {
        if (txError) {
          console.error('Transaction creation error:', txError);
          setError(`Failed to create transaction: ${txError.message}`);
          setLoading(false);
          return;
        }

        console.log('Transaction created:', data);

        // Get Paystack public key
        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        console.log('Using Paystack key:', paystackKey ? 'Key is set' : 'Key is missing');

        // Initialize Paystack payment
        try {
          console.log('Setting up Paystack payment...');

          const config = {
            key: paystackKey,
            email: currentUser.email,
            amount: amount * 100, // Convert to kobo
            currency: 'NGN',
            ref: reference,
            callback: function(response: PaystackResponse) {
              console.log('Payment callback received:', response);

              if (response.status === 'success') {
                console.log('Payment successful, verifying transaction...');

                // Verify the transaction
                supabase.rpc(
                  'verify_paystack_transaction',
                  {
                    p_reference: response.reference,
                    p_amount: Math.floor(amount),
                    p_status: 'completed',
                    p_transaction_id: response.transaction || ''
                  }
                ).then(({ data, error: verifyError }) => {
                  if (verifyError) {
                    console.error('Verification error:', verifyError);
                    toast.showError('Payment verification failed. Please contact support.');
                  } else {
                    console.log('Transaction verified:', data);
                    refreshWallet();
                    toast.showSuccess('Payment successful! Your wallet has been credited.');
                    onSuccess?.();
                  }
                  setLoading(false);
                }).catch(err => {
                  console.error('Verification error:', err);
                  toast.showError('An error occurred during payment verification.');
                  setLoading(false);
                });
              } else {
                toast.showError('Payment was not successful. Please try again.');
                setLoading(false);
              }
            },
            onClose: function() {
              console.log('Payment modal closed');
              setLoading(false);
              onClose?.();
            }
          };

          console.log('Opening Paystack iframe...');
          const handler = window.PaystackPop.setup(config);
          handler.openIframe();
          console.log('Paystack iframe opened');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to open payment form';
          console.error('Paystack error:', err);
          setError(errorMessage);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Transaction creation error:', err);
        setError('Failed to create transaction. Please try again.');
        setLoading(false);
      });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount:</span>
          <span className="font-medium">{formatNaira(amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fee:</span>
          <span className="font-medium">₦0.00</span>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>{formatNaira(amount)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePayment}
        disabled={loading || !paystackReady}
        className={`w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors ${className}`}
      >
        {loading ? 'Processing...' : paystackReady ? 'Pay with Paystack' : 'Loading Payment System...'}
      </button>

      {!loading && (
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
        >
          Cancel
        </button>
      )}

      <div className="text-xs text-gray-500 text-center mt-2">
        Secured by Paystack. Your payment information is encrypted.
      </div>
    </div>
  );
};
