import { useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import type { TransactionType } from '../types/wallet';

interface UseWalletOperations {
  isProcessing: boolean;
  processTransaction: (params: {
    amount: number;
    type: 'real' | 'bonus';
    operation: 'add' | 'deduct';
    reason: TransactionType;
    metadata?: Record<string, any>;
  }) => Promise<boolean>;
  getTransactionHistory: (limit?: number) => Promise<void>;
  validateAmount: (amount: number, type: 'real' | 'bonus') => boolean;
  formatBalance: (amount: number) => string;
}

export function useWalletOperations(): UseWalletOperations {
  const { wallet, checkBalance, deductBalance, addBalance } = useWallet();
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const validateAmount = useCallback((amount: number, type: 'real' | 'bonus'): boolean => {
    if (!wallet) {
      toast.showError('Wallet not initialized');
      return false;
    }

    if (amount <= 0) {
      toast.showError('Amount must be greater than 0');
      return false;
    }

    if (type === 'real' && amount < 100) {
      toast.showError('Minimum amount is ₦100');
      return false;
    }

    if (!checkBalance(amount, type)) {
      toast.showError(`Insufficient ${type} balance`);
      return false;
    }

    return true;
  }, [wallet, checkBalance, toast]);

  const processTransaction = useCallback(async ({
    amount,
    type,
    operation,
    reason,
    metadata = {}
  }) => {
    if (!currentUser?.id) {
      toast.showError('Please sign in to continue');
      return false;
    }

    if (isProcessing) {
      toast.showError('Transaction in progress');
      return false;
    }

    if (!validateAmount(amount, type)) {
      return false;
    }

    setIsProcessing(true);

    try {
      // Create transaction record first
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet!.id,
          user_id: currentUser.id,
          type: reason,
          amount: amount,
          balance_type: type,
          status: 'pending',
          metadata: {
            ...metadata,
            operation,
            initiated_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (txError) throw txError;

      // Process the balance change
      const success = operation === 'deduct' 
        ? await deductBalance(amount, type, reason)
        : await addBalance(amount, type, reason);

      if (!success) {
        throw new Error('Failed to process transaction');
      }

      // Update transaction status
      await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'completed',
          metadata: {
            ...txData.metadata,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', txData.id);

      toast.showSuccess('Transaction successful');
      return true;

    } catch (error: any) {
      toast.showError(error.message || 'Transaction failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, wallet, isProcessing, validateAmount, deductBalance, addBalance, toast]);

  const getTransactionHistory = useCallback(async (limit = 50) => {
    if (!wallet) return;

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          users (
            name,
            username,
            avatar_url
          )
        `)
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error: any) {
      toast.showError('Failed to fetch transaction history');
      return [];
    }
  }, [wallet, toast]);

  const formatBalance = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }, []);

  return {
    isProcessing,
    processTransaction,
    getTransactionHistory,
    validateAmount,
    formatBalance
  };
}
