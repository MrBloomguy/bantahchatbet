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

interface SimplePaystackWidgetProps {
  amount: number;
  onSuccess?: () => void;
  onClose?: () => void;
  className?: string;
}

// Very simple implementation
export const SimplePaystackWidget: React.FC<SimplePaystackWidgetProps> = ({
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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Paystack script
  useEffect(() => {
    // Only check for PaystackPop, do not add the script again (already in index.html)
    if (window.PaystackPop) {
      setScriptLoaded(true);
    } else {
      setError('Payment system could not be initialized. Please refresh the page.');
    }
  }, []);

  const handlePayment = () => {
    if (!scriptLoaded) {
      setError('Payment system is not ready. Please refresh the page.');
      return;
    }

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

    // Validate email
    const email = currentUser.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Your account email is missing or invalid. Please update your profile with a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    // Generate reference
    const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
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
      .then(({ error: txError }) => {
        if (txError) {
          console.error('Transaction creation error:', txError);
          setError(`Failed to create transaction: ${txError.message}`);
          setLoading(false);
          return;
        }

        // Get Paystack public key
        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        
        if (!paystackKey) {
          console.error('Paystack public key is not set');
          setError('Payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        try {
          // Initialize Paystack
          const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: email,
            amount: amount * 100, // Convert to kobo
            currency: 'NGN',
            ref: reference,
            callback: function(response: PaystackResponse) {
              if (response.status === 'success') {
                // Verify transaction
                supabase.rpc(
                  'verify_paystack_transaction',
                  {
                    p_reference: response.reference,
                    p_amount: Math.floor(amount),
                    p_status: 'completed',
                    p_transaction_id: response.transaction || ''
                  }
                ).then(({ error: verifyError }) => {
                  if (verifyError) {
                    console.error('Verification error:', verifyError);
                    toast.showError('Payment verification failed. Please contact support.');
                  } else {
                    refreshWallet();
                    toast.showSuccess('Payment successful! Your wallet has been credited.');
                    onSuccess?.();
                  }
                  setLoading(false);
                });
              } else {
                toast.showError('Payment was not successful. Please try again.');
                setLoading(false);
              }
            },
            onClose: function() {
              setLoading(false);
              onClose?.();
            }
          });
          
          handler.openIframe();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to open payment form';
          console.error('Paystack error:', err);
          setError(errorMessage);
          setLoading(false);
        }
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
        disabled={loading || !scriptLoaded}
        className={`w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors ${className}`}
      >
        {loading ? 'Processing...' : scriptLoaded ? 'Pay with Paystack' : 'Loading Payment System...'}
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

// Add PaystackPop to the window object type
declare global {
  interface Window {
    PaystackPop: any;
  }
}
