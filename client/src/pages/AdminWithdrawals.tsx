import React, { useEffect, useState } from 'react';
import { X, Filter } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import AdminLayout from '../layouts/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Withdrawal } from '../hooks/useAdmin';

const AdminWithdrawals: React.FC = () => {
  const { loading, getWithdrawals, processWithdrawal } = useAdmin();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const loadWithdrawals = async () => {
    try {
      const data = await getWithdrawals(statusFilter);
      setWithdrawals(data);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter]);

  const handleProcess = async (withdrawalId: string, status: 'processing' | 'completed' | 'failed') => {
    setProcessingId(withdrawalId);
    try {
      const success = await processWithdrawal(withdrawalId, status);
      if (success) {
        await loadWithdrawals();
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Withdrawals Management</h1>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white/60" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1a1b2e] text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div 
              key={withdrawal.id} 
              className="bg-[#242538] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">
                    ₦{withdrawal.amount.toLocaleString()}
                  </p>
                  <p className="text-white/60 text-sm">
                    {withdrawal.user.name} ({withdrawal.user.email})
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-white/80">
                    <p>Bank: {withdrawal.bank_name}</p>
                    <p>Account: {withdrawal.account_number}</p>
                    <p>Name: {withdrawal.account_name}</p>
                  </div>
                </div>
                {statusFilter === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcess(withdrawal.id, 'processing')}
                      disabled={!!processingId}
                      className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg hover:bg-[#CCFF00]/90 transition-colors disabled:opacity-50"
                    >
                      {processingId === withdrawal.id ? (
                        <LoadingSpinner size="sm" color="#000000" />
                      ) : (
                        'Process'
                      )}
                    </button>
                    <button
                      onClick={() => handleProcess(withdrawal.id, 'failed')}
                      disabled={!!processingId}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {statusFilter === 'processing' && (
                  <button
                    onClick={() => handleProcess(withdrawal.id, 'completed')}
                    disabled={!!processingId}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {processingId === withdrawal.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Complete'
                    )}
                  </button>
                )}
              </div>
              <div className="text-xs text-white/40">
                Requested {new Date(withdrawal.created_at).toLocaleString()}
              </div>
            </div>
          ))}

          {withdrawals.length === 0 && (
            <div className="text-center py-8 text-white/60">
              No {statusFilter} withdrawals
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;