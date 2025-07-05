import React, { useEffect, useState } from 'react';
import { useAdmin, Withdrawal } from '../hooks/useAdmin';
import { formatCurrency } from '../utils/format';

export const AdminWithdrawals: React.FC = () => {
  const { getWithdrawals, processWithdrawal, loading } = useAdmin();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    try {
      const data = await getWithdrawals(filter);
      setWithdrawals(data);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  const handleProcess = async (id: string, status: 'processing' | 'completed' | 'failed') => {
    const success = await processWithdrawal(id, status);
    if (success) {
      loadWithdrawals();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Withdrawal Requests</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border-gray-300"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{withdrawal.wallet.user.name}</div>
                    <div className="text-sm text-gray-500">{withdrawal.wallet.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(withdrawal.amount)}</div>
                    <div className="text-xs text-gray-500">{withdrawal.balance_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{withdrawal.bank_name}</div>
                    <div className="text-sm text-gray-500">{withdrawal.account_number}</div>
                    <div className="text-sm text-gray-500">{withdrawal.account_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                        withdrawal.status === 'failed' ? 'bg-red-100 text-red-800' :
                        withdrawal.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(withdrawal.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {withdrawal.status === 'pending' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleProcess(withdrawal.id, 'processing')}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => handleProcess(withdrawal.id, 'failed')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {withdrawal.status === 'processing' && (
                      <button
                        onClick={() => handleProcess(withdrawal.id, 'completed')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};