import React, { useState, useEffect } from 'react';
import { usePaystack } from '../hooks/usePaystack';
import { usePaystackAccount } from '../hooks/usePaystackAccount';
import { useToast } from '../contexts/ToastContext';
import { useWallet } from '../contexts/WalletContext';
import LoadingSpinner from './LoadingSpinner';
import { Check } from 'lucide-react';

interface Bank {
  code: string;
  name: string;
}

interface CompactWithdrawalWidgetProps {
  amount: number;
  balanceType: 'real' | 'bonus';
  onSuccess?: () => void;
  onClose?: () => void;
}

export const CompactWithdrawalWidget: React.FC<CompactWithdrawalWidgetProps> = ({
  amount,
  balanceType,
  onSuccess,
  onClose
}) => {
  const { initializeTransfer, loading: transferLoading } = usePaystack();
  const { verifyAccount, getBanks, loading: accountLoading } = usePaystackAccount();
  const { wallet } = useWallet();
  const toast = useToast();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [formData, setFormData] = useState({
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });
  const [accountVerified, setAccountVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const banksList = await getBanks();
        setBanks(banksList);
      } catch (error) {
        console.error('Failed to load banks:', error);
        toast.showError('Failed to load banks. Please try again.');
      }
    };

    loadBanks();
  }, [getBanks, toast]);

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, bankCode: e.target.value }));
    setAccountVerified(false);
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const accountNumber = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, accountNumber, accountName: '' }));
    setAccountVerified(false);
  };

  const verifyAccountDetails = async () => {
    const { accountNumber } = formData;

    if (accountNumber.length !== 10) {
      toast.showError('Account number must be 10 digits');
      return;
    }

    // Only verify if we have both account number and bank code
    if (accountNumber.length === 10 && formData.bankCode) {
      setVerifying(true);
      try {
        const accountDetails = await verifyAccount(accountNumber, formData.bankCode);

        if (accountDetails && accountDetails.verified && accountDetails.accountName) {
          setFormData(prev => ({
            ...prev,
            accountName: accountDetails.accountName,
            recipientCode: accountDetails.recipientCode
          }));
          setAccountVerified(true);
          toast.showSuccess('Account verified');
        } else {
          throw new Error('Could not verify account details');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Account verification failed';
        toast.showError(errorMessage);
        setAccountVerified(false);
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountVerified) {
      toast.showError('Please verify your account details first');
      return;
    }

    try {
      const selectedBank = banks.find(b => b.code === formData.bankCode);
      if (!selectedBank) {
        throw new Error('Invalid bank selected');
      }

      // Log the withdrawal attempt for debugging
      console.log('Initiating withdrawal:', {
        amount,
        bankName: selectedBank.name,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        balanceType
      });

      const result = await initializeTransfer({
        amount,
        bankName: selectedBank.name,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        balanceType
      });

      if (result.success) {
        toast.showSuccess('Withdrawal initiated successfully');
        console.log('Withdrawal successful:', result);
        onSuccess?.();
        onClose?.();
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
      toast.showError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Balance Display */}
      <div className="bg-purple-50 p-1.5 rounded-lg flex justify-between items-center mb-1">
        <span className="text-xs text-purple-700">Available Balance:</span>
        <span className="text-xs font-semibold text-purple-900">₦{balanceType === 'real' ? (wallet?.real_balance || 0).toLocaleString() : (wallet?.bonus_balance || 0).toLocaleString()}</span>
      </div>

      {/* Withdrawal Amount */}
      {amount > 0 && (
        <div className="bg-green-50 p-1.5 rounded-lg flex justify-between items-center mb-1">
          <span className="text-xs text-green-700">Withdrawal Amount:</span>
          <span className="text-xs font-semibold text-green-900">₦{amount.toLocaleString()}</span>
        </div>
      )}

      <div>
        <label htmlFor="bank-select" className="block text-xs font-medium text-gray-500 mb-0.5">Bank</label>
        <select
          id="bank-select"
          name="bank"
          value={formData.bankCode}
          onChange={handleBankChange}
          className="block w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-700 focus:ring-1 focus:ring-purple-500 focus:border-transparent text-xs appearance-none"
          required
          aria-label="Select your bank"
          title="Select your bank"
        >
          <option value="">Select bank</option>
          {banks.length > 0 ? (
            banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))
          ) : (
            <option value="" disabled>Loading banks...</option>
          )}
        </select>
      </div>

      <div className="flex gap-1">
        <div className="flex-1">
          <label htmlFor="account-number" className="block text-xs font-medium text-gray-500 mb-0.5">Account Number</label>
          <input
            id="account-number"
            name="accountNumber"
            type="text"
            value={formData.accountNumber}
            onChange={handleAccountNumberChange}
            maxLength={10}
            placeholder="10-digit number"
            className="block w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-700 focus:ring-1 focus:ring-purple-500 focus:border-transparent text-xs"
            required
            aria-label="Enter your account number"
            title="Enter your 10-digit account number"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={verifyAccountDetails}
            disabled={formData.accountNumber.length !== 10 || !formData.bankCode || verifying}
            className="h-[28px] px-2 bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Verify account number"
            title="Verify account number"
          >
            {verifying ? (
              <LoadingSpinner size="sm" color="#6B7280" />
            ) : (
              'Verify'
            )}
          </button>
        </div>
      </div>

      {verifying && (
        <div className="bg-blue-50 border border-blue-100 rounded p-1.5 text-xs text-blue-700 flex items-center">
          <LoadingSpinner size="sm" color="#3B82F6" />
          <span className="ml-1.5">Verifying account...</span>
        </div>
      )}

      {accountVerified && (
        <div className="bg-green-50 border border-green-100 rounded p-1.5 text-xs text-green-700 flex items-center">
          <Check className="w-3 h-3 mr-1 text-green-500" />
          <span className="font-medium">{formData.accountName}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!accountVerified || transferLoading || accountLoading}
        className="w-full mt-1 bg-green-600 text-white py-1.5 rounded font-medium
                 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                 transition-colors text-xs flex items-center justify-center"
      >
        {transferLoading ? (
          <>
            <LoadingSpinner size="sm" color="#ffffff" />
            <span className="ml-1">Processing...</span>
          </>
        ) : (
          `Withdraw ₦${amount.toLocaleString()}`
        )}
      </button>
    </form>
  );
};
