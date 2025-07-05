import React, { useEffect, useState } from 'react';
import { useFlutterwave } from '../hooks/useFlutterwave';
import { useToast } from '../contexts/ToastContext';
import { useWallet } from '../contexts/WalletContext';
import LoadingSpinner from './LoadingSpinner';

interface FlutterwaveWidgetProps {
  amount: number;
  type?: 'fiat' | 'coins';
  mode: 'deposit' | 'withdrawal';
  onSuccess?: (data?: any) => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

const FlutterwaveWidget: React.FC<FlutterwaveWidgetProps> = ({ 
  amount, 
  type = 'fiat',
  mode = 'deposit',
  onSuccess, 
  onClose,
  onError 
}) => {
  const { initializePayment } = useFlutterwave();
  const { refreshWallet } = useWallet();
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (window.FlutterwaveCheckout) {
      setScriptLoaded(true);
      return;
    }

    // Add Flutterwave inline script
    const script = document.createElement('script');
    script.innerHTML = `
      window.FlutterwaveCheckout = function(config) {
        var checkout = new Promise(function(resolve) {
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = 'https://checkout.flutterwave.com/v3.js';
          script.async = true;
          script.onload = function() {
            resolve(window.FlutterwaveCheckout(config));
          };
          document.body.appendChild(script);
        });
        return checkout;
      };
    `;
    document.body.appendChild(script);
    setScriptLoaded(true);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleFlutterwavePayment = async () => {
    if (!scriptLoaded) {
      toast.showError('Payment gateway is still loading');
      return;
    }

    if (!amount || amount < 100) {
      toast.showError('Minimum deposit amount is ₦100');
      return;
    }

    try {
      setLoading(true);
      const config = await initializePayment(amount);
      
      await window.FlutterwaveCheckout({
        ...config,
        callback: async (response: any) => {
          try {
            await config.callback(response);
            // Add delay before refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
            await refreshWallet();
            window.location.href = '/wallet?status=success';
          } catch (error: any) {
            toast.showError(error.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        onclose: () => {
          setLoading(false);
          config.onclose?.();
          // Refresh wallet on close
          setTimeout(async () => {
            await refreshWallet();
          }, 2000);
        }
      });
    } catch (error: any) {
      console.error('Flutterwave payment error:', error);
      toast.showError(error.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleFlutterwavePayment}
        disabled={loading || !scriptLoaded}
        className="w-full px-4 py-3 rounded-xl font-medium bg-[#F5A623] text-white hover:bg-[#E69512] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" color="#FFFFFF" />
            <span>Processing...</span>
          </>
        ) : (
          `${mode === 'deposit' ? 'Pay' : 'Withdraw'} with Flutterwave`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        Secured by Flutterwave
      </div>
    </div>
  );
};

export default FlutterwaveWidget;
