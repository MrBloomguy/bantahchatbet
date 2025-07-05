import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useAdmin } from '../../hooks/useAdmin';
import LoadingSpinner from '../LoadingSpinner';

interface AddEventLiquidityProps {
  eventId: string;
  adminEmail: string;
  currentLiquidity: number;
  onSuccess: () => void;
}

const AddEventLiquidity: React.FC<AddEventLiquidityProps> = ({
  eventId,
  adminEmail,
  currentLiquidity,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();
  const { addEventLiquidity } = useAdmin();

  const handleAddLiquidity = async () => {
    if (!amount || amount <= 0) {
      toast.showError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Use the addEventLiquidity function from useAdmin hook instead
      // This will handle all the fallback logic for us
      const result = await addEventLiquidity(eventId, Number(amount), notes || undefined);

      if (result) {
        setAmount('');
        setNotes('');
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding liquidity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.showError(`Failed to add liquidity: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-900">Add Liquidity</h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current Admin Liquidity</p>
          <p className="text-sm font-bold text-purple-600">₦{currentLiquidity.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-gray-300 text-gray-900 px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Enter amount"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 opacity-0">Add</label>
            <button
              type="button"
              onClick={handleAddLiquidity}
              disabled={loading || !amount || amount <= 0}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[30px]"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Add'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 text-gray-900 px-2 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Add notes about this liquidity addition"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};

export default AddEventLiquidity;
