import React, { useState } from 'react';
import { useWalletOperations } from '../hooks/useWalletOperations';
import { DepositSuccessModal } from './DepositSuccessModal';
import { useFlutterwave } from '../hooks/useFlutterwave';

export const DepositForm = () => {
  const [amount, setAmount] = useState('');
  const { deposit, loading } = useWalletOperations();
  const { initializePayment } = useFlutterwave();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    amount: number;
    reference: string;
    method: 'card' | 'bank' | 'ussd';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    try {
      // First create the deposit transaction
      const { transaction, paymentResult } = await deposit(numAmount);
      
      if (!transaction || !paymentResult) {
        throw new Error('Failed to initialize deposit');
      }

      // Initialize Flutterwave payment
      const response = await initializePayment(numAmount, transaction.reference);
      
      if (response.success) {
        setTransactionDetails({
          amount: numAmount,
          reference: transaction.reference,
          method: response.method
        });
        setShowSuccessModal(true);
        setAmount('');
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Amount (NGN)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="100"
            step="100"
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !amount || parseInt(amount) < 100}
          className="w-full bg-primary text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Deposit'}
        </button>
      </form>

      {showSuccessModal && transactionDetails && (
        <DepositSuccessModal
          details={transactionDetails}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};
