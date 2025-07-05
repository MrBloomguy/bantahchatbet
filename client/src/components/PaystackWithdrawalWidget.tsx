import React, { useState, useEffect } from 'react';
import { usePaystack } from '../hooks/usePaystack';
import { usePaystackAccount } from '../hooks/usePaystackAccount';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';

interface Bank {
  code: string;
  name: string;
}

interface PaystackWithdrawalWidgetProps {
  amount: number;
  balanceType: 'real' | 'bonus';
  onSuccess?: () => void;
  onClose?: () => void;
}

export const PaystackWithdrawalWidget: React.FC<PaystackWithdrawalWidgetProps> = ({
  amount,
  balanceType,
  onSuccess,
  onClose
}) => {
  const { initializeTransfer, loading: transferLoading } = usePaystack();
  const { verifyAccount, getBanks, loading: accountLoading } = usePaystackAccount();
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
        const bankList = await getBanks();
        // Remove duplicates based on bank code
        const uniqueBanks = bankList.reduce((acc: Bank[], current) => {
          const exists = acc.find(bank => bank.code === current.code);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        setBanks(uniqueBanks.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        toast.showError('Failed to load banks');
      }
    };
    loadBanks();
  }, []);

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bankCode = e.target.value;
    setFormData(prev => ({ ...prev, bankCode, accountName: '' }));
    setAccountVerified(false);
  };

  const handleAccountNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const accountNumber = e.target.value.replace(/\D/g, '').slice(0, 10);
    
    // Update form data immediately for responsive UI
    setFormData(prev => ({ ...prev, accountNumber }));
    
    // Clear verification status when changing number
    if (accountNumber.length !== 10) {
      setAccountVerified(false);
      setFormData(prev => ({ ...prev, accountName: '' }));
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
            recipientCode: accountDetails.recipientCode // Store recipient code if needed
          }));
          setAccountVerified(true);
          toast.showSuccess('Account verified successfully');
        } else {
          throw new Error('Could not verify account details');
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.showError('Could not verify account. Please check the details and try again.');
        setFormData(prev => ({ ...prev, accountName: '' }));
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

      const result = await initializeTransfer({
        amount,
        bankName: selectedBank.name,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        balanceType
      });

      if (result.success) {
        toast.showSuccess('Withdrawal initiated successfully');
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
      toast.showError(errorMessage);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 w-full max-w-md border border-gray-100 transition-all duration-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-800">Withdraw Funds</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 transition-colors duration-150 h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="mb-3 p-2 bg-blue-50 rounded text-xs text-blue-700 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 flex-shrink-0">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Withdrawing <span className="font-semibold">₦{amount.toLocaleString()}</span> from your {balanceType} balance</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-0.5">Bank</label>
          <div className="relative">
            <select
              value={formData.bankCode}
              onChange={handleBankChange}
              className="block w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-150 text-xs appearance-none"
              required
            >
              <option value="">Select your bank</option>
              {banks.map((bank, index) => (
                <option key={`${bank.code}-${index}`} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-0.5">Account Number</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={handleAccountNumberChange}
            maxLength={10}
            placeholder="Enter 10-digit account number"
            className="block w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-150 text-xs"
            required
          />
        </div>

        {verifying && (
          <div className="text-xs text-gray-500 flex items-center py-1 px-2 bg-gray-50 rounded animate-pulse">
            <LoadingSpinner size="sm" color="#6B7280" />
            <span className="ml-1.5 text-xs">Verifying account...</span>
          </div>
        )}

        {formData.accountName && (
          <div className={`transition-all duration-200 ${accountVerified ? 'opacity-100' : 'opacity-50'}`}>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">Account Name</label>
            <div className="flex items-center">
              <input
                type="text"
                value={formData.accountName}
                readOnly
                className="block w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded text-gray-700 transition-all duration-150 text-xs"
              />
              {accountVerified && (
                <div className="ml-1.5 text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!accountVerified || transferLoading || accountLoading}
          className="w-full mt-1.5 bg-green-600 text-white py-2 rounded font-medium 
                   hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-all duration-150 transform hover:translate-y-[-1px] active:translate-y-[1px]
                   flex items-center justify-center text-xs"
        >
          {transferLoading ? (
            <>
              <LoadingSpinner size="sm" color="#ffffff" />
              <span className="ml-1.5">Processing...</span>
            </>
          ) : (
            `Withdraw ₦${amount.toLocaleString()}`
          )}
        </button>
      </form>
    </div>
  );
};






