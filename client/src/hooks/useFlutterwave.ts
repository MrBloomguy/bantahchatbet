import { useCallback } from 'react';
import { useFlutterwave as useFlutterwaveSDK, closePaymentModal } from 'flutterwave-react-v3';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

export const useFlutterwave = () => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();

  const initializePayment = useCallback(async (amount: number) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    if (!wallet) {
      throw new Error('Wallet not initialized');
    }

    const reference = `FLW-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const config = {
      public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: reference,
      amount: amount,
      currency: 'NGN',
      payment_options: 'card,ussd,bank_transfer',
      customer: {
        email: currentUser.email,
        name: currentUser.full_name || currentUser.email,
      },
      customizations: {
        title: 'Wallet Deposit',
        description: 'Fund your wallet',
        logo: 'https://your-domain.com/logo.png',
      },
      callback: async (response: any) => {
        try {
          if (!response.status) {
            toast.showError('Invalid payment response received');
            return;
          }

          if (!['successful', 'completed'].includes(response.status?.toLowerCase())) {
            toast.showError(`Payment failed: ${response.status}`);
            return;
          }

          // Show processing message
          toast.showInfo('Processing payment...');

          const { data: verificationData, error: verificationError } = await supabase.rpc(
            'verify_flutterwave_transaction',
            {
              p_reference: response.tx_ref,
              p_amount: parseFloat(response.amount),
              p_status: response.status.toLowerCase(),
              p_transaction_id: response.transaction_id
            }
          );

          if (verificationError) {
            console.error('Payment verification error:', verificationError);
            toast.showError('Payment verification failed');
            return;
          }

          // Add delay before refresh to allow database updates to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          await refreshWallet();
          
          toast.showSuccess('Payment successful! Your wallet has been credited.');
          return verificationData;
        } catch (error) {
          console.error('Payment processing error:', error);
          toast.showError('Failed to process payment. Please contact support if your wallet is not updated.');
          return null;
        }
      },
      onclose: () => {
        // Always refresh wallet on modal close to ensure latest balance
        setTimeout(async () => {
          await refreshWallet();
        }, 2000);
      },
      meta: {
        consumer_id: currentUser.id,
        consumer_mac: navigator.userAgent,
      },
      options: {
        checkoutModal: {
          // Disable analytics to prevent CORS errors
          disableAnalytics: true,
        }
      }
    };

    return config;
  }, [currentUser, wallet, refreshWallet, toast]);

  return { initializePayment };
};
