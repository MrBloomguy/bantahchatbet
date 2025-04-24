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
    const checkPaystackScript = setInterval(() => {
      if (window.PaystackPop) {
        setIsScriptReady(true);
        clearInterval(checkPaystackScript);
      }
    }, 100);

    return () => clearInterval(checkPaystackScript);
  }, []);

  const initializePayment = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!currentUser?.id) {
        throw new Error('Please sign in to make a deposit');
      }

      if (!wallet?.id) {
        throw new Error('Wallet not initialized');
      }

      if (!amount || amount < 100) {
        throw new Error('Minimum deposit amount is ₦100');
      }

      if (!isScriptReady || !window.PaystackPop) {
        throw new Error('Payment system is still initializing. Please try again.');
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
          const handler = window.PaystackPop.setup(config);
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
