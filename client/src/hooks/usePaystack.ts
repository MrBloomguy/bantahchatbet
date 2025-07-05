import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface PaystackResponse {
  reference: string;
  status: string;
  transaction: string;
  message: string;
}

interface TransferParams {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  balanceType: 'real' | 'bonus';
}

export const usePaystack = () => {
  const { currentUser } = useAuth();
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  useEffect(() => {
    console.log('Checking Paystack script status...');

    // Function to load Paystack script
    const loadPaystackScript = () => {
      // If already loaded
      if (window.PaystackPop) {
        console.log('PaystackPop already available in window object');
        setIsScriptReady(true);
        return;
      }

      // If script tag already exists but not loaded yet
      const existingScript = document.querySelector('script[src*="paystack.co/v1/inline.js"]');
      if (existingScript) {
        console.log('Paystack script tag found in document, waiting for it to load...');
        const checkPaystack = setInterval(() => {
          if (window.PaystackPop) {
            console.log('PaystackPop now available from existing script tag');
            setIsScriptReady(true);
            clearInterval(checkPaystack);
          }
        }, 100);

        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => {
          clearInterval(checkPaystack);
        }, 10000);

        return;
      }

      // Create and add script tag
      console.log('Creating new Paystack script tag...');
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;

      script.onload = () => {
        console.log('Paystack script tag loaded, checking for PaystackPop object...');
        // Check if PaystackPop is available
        const checkPaystack = setInterval(() => {
          if (window.PaystackPop) {
            console.log('PaystackPop now available from newly created script tag');
            setIsScriptReady(true);
            clearInterval(checkPaystack);
            console.log('Paystack script loaded successfully');
          }
        }, 100);

        // Clear interval after 10 seconds
        setTimeout(() => {
          clearInterval(checkPaystack);
          if (!window.PaystackPop) {
            console.error('Paystack script loaded but PaystackPop not available');
          }
        }, 10000);
      };

      script.onerror = () => {
        console.error('Failed to load Paystack script');
      };

      document.head.appendChild(script);
    };

    // Load the script
    loadPaystackScript();

    // Check every second if script is loaded (as a fallback)
    const intervalCheck = setInterval(() => {
      if (window.PaystackPop) {
        setIsScriptReady(true);
        clearInterval(intervalCheck);
      }
    }, 1000);

    return () => clearInterval(intervalCheck);
  }, []);

  const initializePayment = useCallback(
    async (amount: number): Promise<boolean> => {
      console.log('Initializing payment with Paystack...', {
        isScriptReady,
        paystackAvailable: !!window.PaystackPop,
        amount
      });

      if (!currentUser?.id) {
        throw new Error('Please sign in to make a deposit');
      }

      if (!wallet?.id) {
        throw new Error('Wallet not initialized');
      }

      if (!amount || amount < 100) {
        throw new Error('Minimum deposit amount is ₦100');
      }

      // Double-check if PaystackPop is available, regardless of isScriptReady state
      if (!window.PaystackPop) {
        console.error('PaystackPop not available despite checks');
        throw new Error('Payment system is not available. Please refresh the page and try again.');
      }

      // If we get here, we know PaystackPop is available, so ensure isScriptReady is true
      if (!isScriptReady) {
        setIsScriptReady(true);
      }

      try {
        setLoading(true);

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: currentUser.id,
            wallet_id: wallet.id,
            amount: amount,
            type: 'deposit',
            status: 'pending',
            reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            payment_provider: 'paystack',
            metadata: {
              provider: 'paystack',
              initiated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (txError) {
          throw new Error(`Failed to create transaction: ${txError.message}`);
        }

        if (!transaction) {
          throw new Error('No transaction data returned');
        }

        return new Promise((resolve) => {
          // Create the handler configuration
          const config = {
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: currentUser.email,
            amount: amount * 100, // Convert to kobo
            currency: 'NGN',
            ref: transaction.reference,
            callback: async function(response: PaystackResponse) {
              try {
                if (response.status === 'success') {
                  try {
                    const { data, error: verifyError } = await supabase.rpc(
                      'verify_paystack_transaction',
                      {
                        p_reference: response.reference,
                        p_amount: Math.floor(amount),
                        p_status: 'completed',
                        p_transaction_id: response.transaction
                      }
                    );

                    if (verifyError) {
                      console.error('Verification error:', verifyError);
                      toast.showError('Payment verification failed. Please contact support if your account is not credited.');
                      resolve(false);
                      return;
                    }

                    await refreshWallet();
                    toast.showSuccess('Payment successful! Your wallet has been credited.');
                    resolve(true);
                  } catch (err) {
                    console.error('Verification processing error:', err);
                    toast.showError('An error occurred during payment verification. Please check your wallet balance or contact support.');
                    resolve(false);
                  }
                } else {
                  try {
                    await supabase.rpc(
                      'verify_paystack_transaction',
                      {
                        p_reference: response.reference,
                        p_amount: Math.floor(amount),
                        p_status: 'failed',
                        p_transaction_id: response.transaction
                      }
                    );

                    toast.showError('Payment was not successful. Please try again.');
                    resolve(false);
                  } catch (err) {
                    console.error('Failed status update error:', err);
                    toast.showError('Payment failed. Please try again later.');
                    resolve(false);
                  }
                }
              } catch (error) {
                console.error('Callback processing error:', error);
                resolve(false);
              } finally {
                setLoading(false);
              }
            },
            onClose: function() {
              setLoading(false);
              resolve(false);
            }
          };

          // Initialize Paystack
          console.log('Setting up Paystack handler with config:', {
            email: config.email,
            amount: config.amount,
            ref: config.ref
          });
          const handler = window.PaystackPop.setup(config);
          console.log('Opening Paystack iframe...');
          handler.openIframe();
        });

      } catch (error) {
        console.error('Payment initialization error:', error);
        setLoading(false);
        throw error;
      }
    },
    [currentUser, wallet, refreshWallet, isScriptReady]
  );

  const initializeTransfer = useCallback(
    async (params: TransferParams): Promise<{ success: boolean; reference: string }> => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to make a withdrawal');
      }

      if (!wallet?.id) {
        throw new Error('Wallet not initialized');
      }

      if (!params.amount || params.amount < 100) {
        throw new Error('Minimum withdrawal amount is ₦100');
      }

      try {
        setLoading(true);

        const reference = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Call Supabase RPC to initiate transfer
        const { data: transferResult, error: transferError } = await supabase
          .rpc('initiate_paystack_transfer', {
            p_amount: params.amount,
            p_reference: reference,
            p_bank_name: params.bankName,
            p_account_number: params.accountNumber,
            p_account_name: params.accountName,
            p_balance_type: params.balanceType
          });

        if (transferError) {
          throw new Error(`Failed to initiate transfer: ${transferError.message}`);
        }

        if (!transferResult?.success) {
          throw new Error(transferResult?.message || 'Transfer failed');
        }

        await refreshWallet();

        return {
          success: true,
          reference: reference
        };

      } catch (error) {
        console.error('Transfer initialization error:', error);
        setLoading(false);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, wallet, refreshWallet]
  );

  return { initializePayment, initializeTransfer, loading, isScriptReady };
};
