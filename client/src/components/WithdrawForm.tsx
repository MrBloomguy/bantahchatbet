import React, { useState } from 'react';
import { useWalletOperations } from '../hooks/useWalletOperations';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { PaystackSuccessModal } from './PaystackSuccessModal';
import { usePaystack } from '../hooks/usePaystack';

export const WithdrawForm = () => {
  const { wallet } = useWallet();
  const { loading: withdrawalLoading } = useWalletOperations();
  const { initializeTransfer, loading: paystackLoading } = usePaystack();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    balanceType: 'real' as 'real' | 'bonus'
  });
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    amount: number;
    reference: string;
    bankName: string;
    accountNumber: string;
    estimatedTime: string;
  } | null>(null);

  const validateForm = () => {
    const amount = Number(formData.amount);
    if (!amount || amount < 100) {
      toast.showError('Minimum withdrawal amount is ₦100');
      return false;
    }

    const availableBalance = formData.balanceType === 'real' 
      ? wallet?.real_balance || 0 
      : wallet?.bonus_balance || 0;

    if (amount > availableBalance) {
      toast.showError(`Insufficient ${formData.balanceType} balance`);
      return false;
    }

    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      toast.showError('Please fill in all bank details');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const amount = Number(formData.amount);
      const result = await initializeTransfer({
        amount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        balanceType: formData.balanceType
      });

      if (result.success) {
        setTransactionDetails({
          amount,
          reference: result.reference,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          estimatedTime: '1-3 business days'
        });
        setShowSuccessModal(true);
        setFormData({
          amount: '',
          bankName: '',
          accountNumber: '',
          accountName: '',
          balanceType: 'real'
        });
      }
    } catch (error: any) {
      toast.showError(error.message || 'Withdrawal failed');
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount (₦)</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full p-3 border rounded-lg"
            min="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bank Name</label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Account Number</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            className="w-full p-3 border rounded-lg"
            maxLength={10}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Account Name</label>
          <input
            type="text"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            className="w-full p-3 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Balance Type</label>
          <select
            value={formData.balanceType}
            onChange={(e) => setFormData({ ...formData, balanceType: e.target.value as 'real' | 'bonus' })}
            className="w-full p-3 border rounded-lg"
          >
            <option value="real">Real Balance</option>
            <option value="bonus">Bonus Balance</option>
          </select>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>• Minimum withdrawal: ₦100</p>
          <p>• Processing time: 1-3 business days</p>
          <p>• Withdrawal fee: ₦100</p>
        </div>

        <button
          type="submit"
          disabled={withdrawalLoading || paystackLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium 
                   hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {withdrawalLoading || paystackLoading ? 'Processing...' : 'Confirm Withdrawal'}
        </button>
      </form>

      {showSuccessModal && transactionDetails && (
        <PaystackSuccessModal
          type="withdrawal"
          amount={transactionDetails.amount}
          transactionRef={transactionDetails.reference}
          bankDetails={{
            bankName: transactionDetails.bankName,
            accountNumber: transactionDetails.accountNumber,
            estimatedTime: transactionDetails.estimatedTime
          }}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};
