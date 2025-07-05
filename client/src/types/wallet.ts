export type WalletStatus = 'active' | 'suspended' | 'closed';

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'bet_lock' 
  | 'bet_win' 
  | 'bet_loss' 
  | 'bet_refund';

export type TransactionStatus = 
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Wallet {
  id: string;
  user_id: string;
  real_balance: number;
  bonus_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  status: TransactionStatus;
  reference: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WalletUser {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}
