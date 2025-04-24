import React, { useState } from 'react';
import { usePaystack } from '../hooks/usePaystack';
import { useToast } from '../contexts/ToastContext';
import { PaystackScript } from './PaystackScript';
import { useWallet } from '../contexts/WalletContext';
import { formatNaira } from '../utils/currency';

interface PaystackWidgetProps {
  amount: number;
  onSuccess?: () => void;
  onClose?: () => void;
  className?: string;
}

export const PaystackWidget: React.FC<PaystackWidgetProps> = ({
  amount,
  onSuccess,
  onClose,
  className = ''
}) => {
  const { initializePayment, loading, isScriptReady } = usePaystack();
  const { wallet } = useWallet();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setError(null);

    if (!isScriptReady) {
      setError('Payment system is still loading. Please try again in a few seconds.');
      toast.showError('Payment system is still loading. Please try again.');
      return;
    }

    if (!wallet?.id) {
      setError('Wallet not initialized. Please refresh the page and try again.');
      toast.showError('Wallet not initialized. Please refresh the page.');
      return;
    }

    if (amount < 100) {
      setError('Minimum deposit amount is ₦100.');
      toast.showError('Minimum deposit amount is ₦100.');
      return;
    }

    try {
      const success = await initializePayment(amount);
      if (success) {
        toast.showSuccess('Payment successful!');
        onSuccess?.();
      } else {
        // Payment was cancelled or failed
        onClose?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      console.error('Payment error:', error);
      setError(errorMessage);
      toast.showError(errorMessage);
      onClose?.();
    }
  };

  return (
    <div className="space-y-4">
      <PaystackScript />

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
        disabled={loading || !isScriptReady}
        className={`w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors ${className}`}
      >
        {loading ? 'Processing...' : isScriptReady ? 'Pay with Paystack' : 'Loading Payment System...'}
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
