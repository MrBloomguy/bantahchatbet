import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Lock, Trophy, X, RotateCcw, CircleDot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatNaira } from '../utils/currency';
import LoadingSpinner from './LoadingSpinner';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  reference: string;
  metadata?: any;
  wallet?: {
    real_balance: number;
    bonus_balance: number;
  };
}

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
}

interface TransactionItemProps {
  transaction: Transaction;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'deposit':
      return <ArrowDownRight className="w-6 h-6 text-emerald-500" />;
    case 'withdrawal':
      return <ArrowUpRight className="w-6 h-6 text-rose-500" />;
    case 'bet_lock':
      return <Lock className="w-6 h-6 text-amber-500" />;
    case 'bet_win':
      return <Trophy className="w-6 h-6 text-emerald-500" />;
    case 'bet_loss':
      return <X className="w-6 h-6 text-rose-500" />;
    case 'bet_refund':
      return <RotateCcw className="w-6 h-6 text-blue-500" />;
    default:
      return <CircleDot className="w-6 h-6 text-gray-500" />;
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'failed':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div 
      className="p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer rounded-xl mx-2 my-1" 
      onClick={() => setShowDetails(true)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {transaction.type.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(transaction.created_at), 'MMM d, yyyy • HH:mm')}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg ${
            ['withdrawal', 'bet_loss'].includes(transaction.type) 
              ? 'text-rose-600' 
              : 'text-emerald-600'
          }`}>
            {['withdrawal', 'bet_loss'].includes(transaction.type) ? '-' : '+'}
            {formatNaira(transaction.amount)}
          </div>
          <div className={`text-xs px-3 py-1 rounded-full inline-block mt-1 font-medium ${
            getStatusBadgeColor(transaction.status)
          }`}>
            {formatStatus(transaction.status)}
          </div>
        </div>
      </div>

      {showDetails && (
        <TransactionDetailsModal
          transaction={transaction}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

const WalletTransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bets' | 'deposits'>('all');
  const { currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchTransactions();

    // Subscribe to real-time updates for both transactions and wallet_transactions
    const subscription = supabase
      .channel('wallet_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${currentUser?.id}`
        },
        (payload) => {
          console.log('Transaction updated:', payload);
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${currentUser?.id}`
        },
        (payload) => {
          console.log('Wallet transaction updated:', payload);
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(`
          *,
          wallet:wallets!transactions_wallet_id_fkey (
            real_balance,
            bonus_balance
          )
        `)
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (filter === 'bets') {
        query = query.in('type', ['bet_lock', 'bet_win', 'bet_loss', 'bet_refund']);
      } else if (filter === 'deposits') {
        query = query.in('type', ['deposit', 'withdrawal']);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.showError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'all' 
                ? 'bg-[#7440FF] text-white shadow-md shadow-[#7440FF]/25' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setFilter('bets')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'bets' 
                ? 'bg-[#7440FF] text-white shadow-md shadow-[#7440FF]/25' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setFilter('deposits')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === 'deposits' 
                ? 'bg-[#7440FF] text-white shadow-md shadow-[#7440FF]/25' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Deposits
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 font-medium">No transactions found</div>
            <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="py-2">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Transaction Details</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Status</span> 
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              getStatusBadgeColor(transaction.status)
            }`}>
              {formatStatus(transaction.status)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Reference</span> 
            <span className="text-gray-900 font-medium">{transaction.reference}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Amount</span> 
            <span className="text-gray-900 font-bold">{formatNaira(transaction.amount)}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Date</span> 
            <span className="text-gray-900">
              {format(new Date(transaction.created_at), 'PPpp')}
            </span>
          </div>

          {transaction.metadata && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-600">Payment Details</span>
              <pre className="mt-2 bg-white p-3 rounded-xl text-sm overflow-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#7440FF] text-white py-3 rounded-xl font-medium hover:bg-[#6030FF] transition-colors duration-200 shadow-md shadow-[#7440FF]/25"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default WalletTransactionHistory;
