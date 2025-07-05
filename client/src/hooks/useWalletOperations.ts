import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';

export const useWalletOperations = () => {
  const [loading, setLoading] = useState(false);
  const { wallet, refreshWallet } = useWallet();
  const toast = useToast();

  const transfer = async (recipientId: string, amount: number, balanceType: 'real' | 'bonus' = 'real') => {
    if (!wallet?.id) {
      throw new Error('Wallet not initialized');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('transfer_between_users', {
          p_recipient_id: recipientId,
          p_amount: amount,
          p_balance_type: balanceType
        });

      if (error) {
        throw error;
      }

      await refreshWallet();
      toast.showSuccess('Transfer successful');

      return data;
    } catch (error: any) {
      toast.showError(error.message || 'Transfer failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { transfer, loading };
};
