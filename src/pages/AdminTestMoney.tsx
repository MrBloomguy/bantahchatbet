import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from '../components/UserAvatar';

const AdminTestMoney: React.FC = () => {
  const [username, setUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const toast = useToast();

  // Live username search
  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUser(null);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, avatar_url')
        .ilike('username', `%${value}%`)
        .limit(10);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      toast.showError(err.message || 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (u: any) => {
    setUser(u);
    setUsername(u.username);
    setSearchResults([]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.showError('Please select a user and enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      // Get wallet id for user
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (walletError || !wallet) throw walletError || new Error('Wallet not found');
      // Call Supabase function to add to wallet
      const { data: addResult, error: addError } = await supabase.rpc('add_to_wallet', {
        p_wallet_id: wallet.id,
        p_amount: Number(amount),
        p_balance_type: 'real',
        p_type: 'test_money',
        p_reference: `ADMIN_TEST_${Date.now()}`
      });
      console.log('add_to_wallet result:', addResult, addError); // DEBUG LOG
      if (addError) throw addError;
      toast.showSuccess('Test money sent successfully!');
      setAmount('');
      setUser(null);
      setUsername('');
    } catch (err: any) {
      toast.showError(err.message || 'Failed to send test money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout title="Send Test Money">
        <form onSubmit={handleSend} className="max-w-md space-y-4 bg-white/10 p-6 rounded-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="w-full p-2 rounded border border-gray-300"
                placeholder="Search username"
                required
              />
            </div>
            {searchResults.length > 0 && (
              <div className="bg-white rounded shadow p-2 max-h-48 overflow-y-auto">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectUser(u)}>
                    <UserAvatar src={u.avatar_url} alt={u.username} size="sm" />
                    <span className="font-medium">{u.username}</span>
                    {u.name && <span className="text-gray-500 text-xs">{u.name}</span>}
                  </div>
                ))}
              </div>
            )}
            {user && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                <UserAvatar src={user.avatar_url} alt={user.username} size="sm" />
                <span className="font-medium">{user.username}</span>
                {user.name && <span className="text-gray-500 text-xs">{user.name}</span>}
                <button type="button" className="ml-auto text-xs text-red-500" onClick={() => setUser(null)}>Change</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₦)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-2 rounded border border-gray-300"
              placeholder="Enter amount"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Send Test Money'}
          </button>
        </form>
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminTestMoney;
