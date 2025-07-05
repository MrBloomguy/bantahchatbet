import React, { useState, useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { formatNaira } from '../utils/currency';

export const AdminFeePanel: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { withdrawPlatformFees } = useAdmin();
  const toast = useToast();

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_fee_stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading admin fee stats:', error);
      toast.showError('Failed to load fee statistics');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.showError('Please enter a valid amount');
      return;
    }

    try {
      await withdrawPlatformFees(amount);
      toast.showSuccess('Fees withdrawn successfully');
      setWithdrawAmount('');
      loadStats();
    } catch (error) {
      console.error('Error withdrawing fees:', error);
      toast.showError('Failed to withdraw fees');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Platform Fees</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">Pending Fees (Fiat)</h3>
          <p className="text-2xl font-bold">{formatNaira(stats?.total_pending_fees || 0)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">Withdrawn Fees (Fiat)</h3>
          <p className="text-2xl font-bold">{formatNaira(stats?.total_withdrawn_fees || 0)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">Pending Fees (Coins)</h3>
          <p className="text-2xl font-bold">{stats?.total_pending_coins || 0} Coins</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm text-gray-600">Withdrawn Fees (Coins)</h3>
          <p className="text-2xl font-bold">{stats?.total_withdrawn_coins || 0} Coins</p>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Enter amount to withdraw"
          className="w-full px-4 py-2 border rounded-lg"
        />
        <button
          onClick={handleWithdraw}
          className="w-full bg-black text-white py-2 rounded-lg font-medium"
        >
          Withdraw Fees
        </button>
      </div>
    </div>
  );
};