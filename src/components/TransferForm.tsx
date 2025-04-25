import React, { useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useWalletOperations } from '../hooks/useWalletOperations';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { useWallet } from '../contexts/WalletContext';

interface User {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
}

interface TransferFormProps {
  onSuccess?: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({ onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const { transfer, loading } = useWalletOperations();
  const toast = useToast();
  const { wallet } = useWallet();
  const { currentUser } = useAuth();

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, avatar_url')
        .ilike('username', `%${query}%`)
        .order('username')
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
    } finally {
      setSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const debugWalletBalance = async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .single();

    console.log('Wallet data from DB:', data);
    console.log('Wallet error:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();

    // Get detailed wallet data including pending transactions
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select(`
        id,
        user_id,
        real_balance,
        bonus_balance,
        pending_transactions,
        created_at,
        updated_at
      `)
      .eq('user_id', user?.id)
      .single();

    console.log('Current wallet state:', {
      wallet: walletData,
      error: walletError,
      attemptedTransfer: {
        amount: parseInt(amount),
        recipientId: selectedUser?.id,
        timestamp: new Date().toISOString()
      }
    });

    if (!selectedUser) {
      toast.showError('Please select a recipient');
      return;
    }

    if (!wallet) {
      toast.showError('Wallet not initialized');
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.showError('Please enter a valid amount');
      return;
    }

    const availableBalance = wallet.real_balance || 0;
    if (numAmount > availableBalance) {
      toast.showError(`Insufficient balance. Available: ₦${availableBalance}`);
      return;
    }

    try {
      // Get recipient wallet state
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('real_balance, pending_transactions')
        .eq('user_id', selectedUser.id)
        .single();

      console.log('Recipient wallet:', recipientWallet);

      // Perform transfer
      const result = await transfer(selectedUser.id, numAmount, 'real');

      // Get updated wallet states after transfer attempt
      const { data: updatedWallet } = await supabase
        .from('wallets')
        .select('real_balance, bonus_balance, pending_transactions')
        .eq('user_id', user?.id)
        .single();

      console.log('Transfer result:', {
        success: true,
        result,
        updatedWallet,
        transferAmount: numAmount
      });

      // Create a notification for the recipient (as a fallback in case the trigger doesn't work)
      try {
        await supabase.from('notifications').insert({
          user_id: selectedUser.id,
          notification_type: 'wallet_transfer_received',
          title: 'Money Received',
          content: `You received ₦${numAmount} from @${currentUser?.username || 'a user'}`,
          metadata: {
            sender_id: user?.id,
            amount: numAmount,
            balance_type: 'real',
            timestamp: new Date().toISOString()
          }
        });

        console.log('Notification created for recipient');
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't throw error here, as the transfer was successful
      }

      setSearchQuery('');
      setAmount('');
      setSelectedUser(null);
      toast.showSuccess(`Successfully sent ₦${numAmount} to @${selectedUser.username}`);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Transfer submission failed:', {
        error,
        walletState: walletData,
        transferDetails: {
          amount: numAmount,
          recipientId: selectedUser.id,
          balanceType: 'real'
        }
      });

      if (error.code === 'P0001') {
        if (error.message.includes('Insufficient balance')) {
          toast.showError(`Insufficient balance. This could be due to pending transactions. Available: ₦${walletData?.real_balance}`);
        } else {
          toast.showError('Transaction failed: ' + error.message);
        }
      } else {
        toast.showError(error.message || 'Transfer failed. Please try again later.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected User Card */}
      {selectedUser ? (
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              url={selectedUser.avatar_url}
              size="lg"
              username={selectedUser.username}
            />
            <div>
              <h3 className="font-medium text-purple-900">{selectedUser.name}</h3>
              <p className="text-sm text-purple-600">@{selectedUser.username}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="ml-auto text-purple-600 hover:text-purple-800"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Search Recipient
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter username..."
            />
            <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />

            {searchQuery.trim() && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border max-h-60 overflow-auto">
                {searching ? (
                  <div className="p-4 text-center text-gray-500">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full p-3 flex items-center gap-3 hover:bg-purple-50 transition-colors"
                    >
                      <UserAvatar
                        url={user.avatar_url}
                        size="md"
                        username={user.username}
                      />
                      <div className="text-left">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm text-gray-600 mb-4">
          <div>Available Balance: ₦{wallet?.real_balance || 0}</div>
          {wallet?.pending_transactions > 0 && (
            <div className="text-yellow-600 text-xs mt-1">
              Note: Some transactions are pending and may affect available balance
            </div>
          )}
        </div>

        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount (₦)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-500">₦</span>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={wallet?.real_balance || 0}
            className="w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !selectedUser || !amount || parseInt(amount) <= 0}
        className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium
                 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : `Send ₦${amount || '0'} to @${selectedUser?.username || ''}`}
      </button>
    </form>
  );
};

