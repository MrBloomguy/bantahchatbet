import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Lock, Trophy, X, RotateCcw, CircleDot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
}

const WalletTransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bets' | 'deposits'>('all');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('wallet_transactions')
        .select('*')
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
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-5 h-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'bet_lock':
        return <Lock className="w-5 h-5 text-orange-500" />;
      case 'bet_win':
        return <Trophy className="w-5 h-5 text-green-500" />;
      case 'bet_loss':
        return <X className="w-5 h-5 text-red-500" />;
      case 'bet_refund':
        return <RotateCcw className="w-5 h-5 text-blue-500" />;
      default:
        return <CircleDot className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTransactionType = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string): string => {
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

  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const formattedDate = new Date(transaction.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const formattedTime = new Date(transaction.created_at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div className="py-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600">
              {formattedDate} {formattedTime}
            </div>
            <div className="font-medium">
              {formatTransactionType(transaction.type)}
            </div>
            <div className="text-sm text-gray-500">
              {transaction.reference}
            </div>
          </div>
          <div className={`text-right ${
            transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
          }`}>
            {transaction.type === 'withdrawal' ? '-' : '+'}
            ₦{transaction.amount.toLocaleString()}
          </div>
        </div>
        <div className="mt-1">
          <span className={`text-xs px-2 py-1 rounded-full ${
            getStatusColor(transaction.status)
          }`}>
            {capitalizeFirst(transaction.status)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'all' ? 'bg-green text-white' : 'bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('bets')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'events' ? 'bg-black text-white' : 'bg-gray-100'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setFilter('deposits')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'deposits' ? 'bg-black text-white' : 'bg-gray-100'
            }`}
          >
            Deposits
          </button>
        </div>
      </div>

      <div className="divide-y">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>
    </div>
  );
};

export default WalletTransactionHistory;
