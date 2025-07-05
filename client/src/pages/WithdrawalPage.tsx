import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { usePaystack } from '../hooks/usePaystack';
import { formatNaira } from '../utils/currency';
import { useToast } from '../contexts/ToastContext';

const WithdrawalPage: React.FC = () => {
  const { wallet } = useWallet();
  const { initializeTransfer, loading } = usePaystack();
  const toast = useToast();
  const [step, setStep] = useState<'amount' | 'bank'>('amount');
  const [formData, setFormData] = useState({
    amount: '',
    balanceType: 'real' as 'real' | 'bonus'
  });

  const validateAmount = () => {
    const amount = Number(formData.amount);
    const balance = formData.balanceType === 'real' 
      ? wallet?.real_balance 
      : wallet?.bonus_balance;

    return amount >= 100 && amount <= (balance || 0);
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAmount()) {
      setStep('bank');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-6 flex items-center gap-2">
        <button 
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Withdraw Funds</h1>
      </div>

      {step === 'amount' ? (
        <form onSubmit={handleAmountSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Balance Type
            </label>
            <select
              value={formData.balanceType}
              onChange={(e) => setFormData({
                ...formData,
                balanceType: e.target.value as 'real' | 'bonus'
              })}
              className="w-full p-3 border rounded-lg"
            >
              <option value="real">Real Balance (₦{wallet?.real_balance || 0})</option>
              <option value="bonus">Bonus Balance (₦{wallet?.bonus_balance || 0})</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({
                ...formData,
                amount: e.target.value 
              })}
              placeholder="Enter amount"
              className="w-full p-3 border rounded-lg"
              min="100"
              step="100"
            />
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>• Minimum withdrawal: ₦100</p>
            <p>• Processing time: 1-3 business days</p>
            <p>• Withdrawal fee: ₦100</p>
          </div>

          {/* Withdrawal Options */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={!validateAmount() || loading}
              onClick={() => setStep('bank')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium 
                       hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Withdraw to Bank Account'}
            </button>

            <button
              type="button"
              disabled={!validateAmount() || loading}
              onClick={async () => {
                try {
                  const result = await initializeTransfer({
                    amount: Number(formData.amount),
                    bankName: 'Paystack Transfer',
                    accountNumber: 'Direct Transfer',
                    accountName: 'Paystack',
                    balanceType: formData.balanceType
                  });
                  if (result.success) {
                    toast.showSuccess('Withdrawal initiated successfully');
                    // Redirect or show success message
                  }
                } catch (error: any) {
                  toast.showError(error.message || 'Withdrawal failed');
                }
              }}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium 
                       hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Withdraw with Paystack'}
            </button>
          </div>
        </form>
      ) : (
        <BankSelectionForm 
          amount={Number(formData.amount)}
          balanceType={formData.balanceType}
          onBack={() => setStep('amount')}
        />
      )}
    </div>
  );
};

export default WithdrawalPage;
