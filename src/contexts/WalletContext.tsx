import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface WalletData {
  id: string;
  user_id: string;
  real_balance: number;
  bonus_balance: number;
  coins: number;
  created_at: string;
  updated_at: string;
}

interface WalletContextType {
  wallet: WalletData | null;
  loading: boolean;
  error: Error | null;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  const refreshWallet = async () => {
    try {
      if (!currentUser?.id) {
        setWallet(null);
        setLoading(false);
        return;
      }

      console.log('Refreshing wallet data...');
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        throw error;
      }

      console.log('Wallet data refreshed:', wallet);
      setWallet(wallet);
      setLoading(false);
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
      setError(error as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshWallet();
    } else {
      setWallet(null);
      setLoading(false);
    }
  }, [currentUser?.id]);

  return (
    <WalletContext.Provider value={{ wallet, loading, error, refreshWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }

  return {
    wallet: context.wallet,
    loading: context.loading,
    error: context.error,
    refreshWallet: context.refreshWallet,
  };
};
