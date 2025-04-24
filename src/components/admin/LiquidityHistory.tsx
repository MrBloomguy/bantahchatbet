import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import LoadingSpinner from '../LoadingSpinner';

interface LiquidityTransaction {
  id: string;
  event_id: string;
  admin_email: string;
  amount: number;
  created_at: string;
  notes: string | null;
}

interface LiquidityHistoryProps {
  eventId: string;
}

const LiquidityHistory: React.FC<LiquidityHistoryProps> = ({ eventId }) => {
  const [transactions, setTransactions] = useState<LiquidityTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalLiquidity, setTotalLiquidity] = useState<number>(0);

  useEffect(() => {
    const fetchLiquidityHistory = async () => {
      try {
        setLoading(true);

        // Try to query the liquidity_transactions table
        // This might fail if the table doesn't exist yet
        try {
          const { data, error } = await supabase
            .from('liquidity_transactions')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Error fetching liquidity transactions:', error);
            // Just continue with empty data
            setTransactions([]);
            setTotalLiquidity(0);
            return;
          }

          setTransactions(data || []);

          // Calculate total liquidity
          if (data && data.length > 0) {
            const total = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
            setTotalLiquidity(total);
          } else {
            setTotalLiquidity(0);
          }
        } catch (error) {
          console.warn('Exception fetching liquidity transactions:', error);
          // Just continue with empty data
          setTransactions([]);
          setTotalLiquidity(0);
        }
      } catch (error) {
        console.error('Error fetching liquidity history:', error);
        // Set default values in case of error
        setTransactions([]);
        setTotalLiquidity(0);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchLiquidityHistory();
    }
  }, [eventId]);

  if (loading) return <div className="py-2 flex justify-center"><LoadingSpinner size="sm" /></div>;

  if (transactions.length === 0) {
    return (
      <div className="text-gray-500 text-xs italic p-2 bg-gray-50 rounded">
        No liquidity has been added to this event yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm p-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold text-gray-700">Liquidity History</h3>
        <div className="text-xs font-medium text-purple-600">
          Total: ₦{totalLiquidity.toLocaleString()}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[150px]">
        <table className="w-full text-xs divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-500">
                Date
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">
                Admin
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">
                Amount
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-500">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-2 py-1 whitespace-nowrap text-gray-700">
                  {format(new Date(transaction.created_at), 'MM/dd/yy h:mm a')}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-gray-500">
                  {transaction.admin_email.split('@')[0]}
                </td>
                <td className="px-2 py-1 whitespace-nowrap font-medium text-green-600">
                  ₦{transaction.amount.toLocaleString()}
                </td>
                <td className="px-2 py-1 text-gray-500 truncate max-w-[150px]">
                  {transaction.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiquidityHistory;
