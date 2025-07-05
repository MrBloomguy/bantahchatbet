import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Trophy,
  X,
  RotateCcw,
  CircleDot,
  Swords,
  Users,
  Medal,
  Filter
} from 'lucide-react';
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

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ transaction, onClose }) => {
  // Format transaction type for display
  const formatTransactionType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get transaction details based on type
  const getTransactionDetails = () => {
    switch (transaction.type) {
      case 'event_win':
        return {
          title: 'Event Win',
          description: transaction.metadata?.event_title || 'You won an event bet',
          icon: <Trophy className="w-6 h-6 text-emerald-500" />
        };
      case 'event_loss':
        return {
          title: 'Event Loss',
          description: transaction.metadata?.event_title || 'You lost an event bet',
          icon: <X className="w-6 h-6 text-rose-500" />
        };
      case 'challenge_win':
        return {
          title: 'Challenge Win',
          description: transaction.metadata?.challenge_title || 'You won a challenge',
          icon: <Swords className="w-6 h-6 text-emerald-500" />
        };
      case 'challenge_loss':
        return {
          title: 'Challenge Loss',
          description: transaction.metadata?.challenge_title || 'You lost a challenge',
          icon: <Swords className="w-6 h-6 text-rose-500" />
        };
      case 'deposit':
        return {
          title: 'Deposit',
          description: 'Funds added to your wallet',
          icon: <ArrowDownRight className="w-6 h-6 text-emerald-500" />
        };
      case 'withdrawal':
        return {
          title: 'Withdrawal',
          description: 'Funds withdrawn from your wallet',
          icon: <ArrowUpRight className="w-6 h-6 text-rose-500" />
        };
      default:
        return {
          title: formatTransactionType(transaction.type),
          description: 'Transaction',
          icon: <CircleDot className="w-6 h-6 text-gray-500" />
        };
    }
  };

  const details = getTransactionDetails();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{details.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="p-3 bg-white rounded-full">
              {details.icon}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{details.title}</div>
              <div className="text-sm text-gray-500">{details.description}</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Amount</span>
            <span className={`text-gray-900 font-bold ${
              ['withdrawal', 'event_loss', 'challenge_loss', 'bet_loss'].includes(transaction.type)
                ? 'text-rose-600'
                : 'text-emerald-600'
            }`}>
              {['withdrawal', 'event_loss', 'challenge_loss', 'bet_loss'].includes(transaction.type) ? '-' : '+'}
              {formatNaira(transaction.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-600">Date</span>
            <span className="text-gray-900">
              {format(new Date(transaction.created_at), 'PPpp')}
            </span>
          </div>

          {transaction.reference && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-600">Reference</span>
              <span className="text-gray-900 text-sm font-mono">
                {transaction.reference.substring(0, 16)}...
              </span>
            </div>
          )}

          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-600">Additional Details</span>
              <div className="mt-2 space-y-2">
                {Object.entries(transaction.metadata).map(([key, value]) => {
                  // Skip internal fields
                  if (['processed_by', 'processed_at', 'initiated_at'].includes(key)) return null;

                  // Format the key for display
                  const formattedKey = key.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');

                  // Format the value based on type
                  let formattedValue = value;
                  if (key.includes('amount') && typeof value === 'number') {
                    formattedValue = formatNaira(value as number);
                  } else if (key.includes('date') || key.includes('at')) {
                    try {
                      formattedValue = format(new Date(value as string), 'PPpp');
                    } catch (e) {
                      // Keep original value if date parsing fails
                    }
                  }

                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{formattedKey}</span>
                      <span className="text-gray-900 font-medium">{String(formattedValue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Get icon based on transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-5 h-5 text-emerald-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-rose-500" />;
      case 'transfer':
        return <RotateCcw className="w-5 h-5 text-blue-500" />;
      case 'event_win':
      case 'bet_win':
        return <Trophy className="w-5 h-5 text-emerald-500" />;
      case 'event_loss':
      case 'bet_loss':
        return <X className="w-5 h-5 text-rose-500" />;
      case 'bet_lock':
        return <Lock className="w-5 h-5 text-amber-500" />;
      case 'challenge_win':
        return <Swords className="w-5 h-5 text-emerald-500" />;
      case 'challenge_loss':
        return <Swords className="w-5 h-5 text-rose-500" />;
      case 'event_join':
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <CircleDot className="w-5 h-5 text-gray-500" />;
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get transaction description
  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'event_win':
        return transaction.metadata?.event_title || 'Event Win';
      case 'event_loss':
        return transaction.metadata?.event_title || 'Event Loss';
      case 'challenge_win':
        return transaction.metadata?.challenge_title || 'Challenge Win';
      case 'challenge_loss':
        return transaction.metadata?.challenge_title || 'Challenge Loss';
      case 'deposit':
        return 'Wallet Deposit';
      case 'withdrawal':
        return 'Wallet Withdrawal';
      default:
        return transaction.type.split('_').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

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
              {getTransactionDescription(transaction)}
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(transaction.created_at), 'MMM d, yyyy • HH:mm')}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg ${
            ['withdrawal', 'event_loss', 'challenge_loss', 'bet_loss'].includes(transaction.type)
              ? 'text-rose-600'
              : 'text-emerald-600'
          }`}>
            {['withdrawal', 'event_loss', 'challenge_loss', 'bet_loss'].includes(transaction.type) ? '-' : '+'}
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

interface EnhancedWalletHistoryProps {
  limit?: number;
  showFilters?: boolean;
  filter?: 'all' | 'events' | 'challenges' | 'deposits';
}

const EnhancedWalletHistory: React.FC<EnhancedWalletHistoryProps> = ({
  limit,
  showFilters = true,
  filter: initialFilter = 'all'
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'events' | 'challenges' | 'deposits'>(initialFilter);
  const { currentUser } = useAuth();
  const toast = useToast();

  // Update filter when initialFilter changes
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    fetchTransactions();

    // Subscribe to real-time updates for transactions
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

      if (filter === 'events') {
        query = query.in('type', ['event_win', 'event_loss', 'bet_win', 'bet_loss', 'bet_lock']);
      } else if (filter === 'challenges') {
        query = query.in('type', ['challenge_win', 'challenge_loss']);
      } else if (filter === 'deposits') {
        query = query.in('type', ['deposit', 'withdrawal']);
      }

      if (limit) {
        query = query.limit(limit);
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {showFilters && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Transaction History</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filter</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Transactions
            </button>
            <button
              type="button"
              onClick={() => setFilter('events')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'events'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => setFilter('challenges')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'challenges'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Challenges
            </button>
            <button
              type="button"
              onClick={() => setFilter('deposits')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'deposits'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Deposits & Withdrawals
            </button>
          </div>
        </div>
      )}

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

export default EnhancedWalletHistory;
