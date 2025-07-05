import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/currency';

interface FeeStats {
  totalPendingFees: number;
  totalWithdrawnFees: number;
  totalPendingCoins: number;
  totalWithdrawnCoins: number;
}

const AdminPlatformFees: React.FC = () => {
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const { getPlatformFeeStats, withdrawPlatformFees } = useAdmin();
  const toast = useToast();

  const loadStats = async () => {
    try {
      const data = await getPlatformFeeStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading platform fee stats:', error);
      toast.showError('Failed to load fee statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      const amount = parseFloat(withdrawAmount);
      if (!amount || amount <= 0) {
        toast.showError('Please enter a valid amount');
        return;
      }

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Platform Fees Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1a1b2e] p-4 rounded-lg">
              <h3 className="text-white/60 text-sm">Pending Fees (Fiat)</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(stats?.totalPendingFees || 0)}
              </p>
            </div>
            
            <div className="bg-[#1a1b2e] p-4 rounded-lg">
              <h3 className="text-white/60 text-sm">Withdrawn Fees (Fiat)</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(stats?.totalWithdrawnFees || 0)}
              </p>
            </div>
            
            <div className="bg-[#1a1b2e] p-4 rounded-lg">
              <h3 className="text-white/60 text-sm">Pending Fees (Coins)</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalPendingCoins || 0} Coins
              </p>
            </div>
            
            <div className="bg-[#1a1b2e] p-4 rounded-lg">
              <h3 className="text-white/60 text-sm">Withdrawn Fees (Coins)</h3>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.totalWithdrawnCoins || 0} Coins
              </p>
            </div>
          </div>

          <div className="bg-[#1a1b2e] p-6 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-4">Withdraw Platform Fees</h3>
            
            <div className="flex gap-4">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="flex-1 px-4 py-2 bg-[#242538] text-white rounded-lg border border-white/10 focus:outline-none focus:border-[#CCFF00]"
              />
              <button
                onClick={handleWithdraw}
                className="px-6 py-2 bg-[#CCFF00] text-black rounded-lg font-medium hover:bg-[#CCFF00]/90 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlatformFees;