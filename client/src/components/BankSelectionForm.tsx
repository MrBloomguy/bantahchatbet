import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { usePaystackBanks } from '../hooks/usePaystackBanks';
import { usePaystackAccount } from '../hooks/usePaystackAccount';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

interface BankSelectionFormProps {
  amount: number;
  balanceType: 'real' | 'bonus';
  onBack: () => void;
}

const BankSelectionForm: React.FC<BankSelectionFormProps> = ({
  amount,
  balanceType,
  onBack
}) => {
  const { banks, loading: loadingBanks } = usePaystackBanks();
  const { verifyAccount, createTransferRecipient } = usePaystackAccount();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [processing, setProcessing] = useState(false);

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAccountNumberChange = async (value: string) => {
    setAccountNumber(value);
    setAccountName('');

    if (value.length === 10 && selectedBank) {
      setVerifying(true);
      const result = await verifyAccount(value, selectedBank.code);
      if (result.verified) {
        setAccountName(result.accountName);
      }
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || !accountNumber || !accountName) return;

    try {
      setProcessing(true);
      
      // Create transfer recipient
      const recipient = await createTransferRecipient(
        accountNumber,
        selectedBank.code,
        accountName
      );

      // Store the recipient code for the next step (actual transfer)
      localStorage.setItem('lastTransferRecipient', recipient.recipient_code);

      // Show success message
      toast.showSuccess('Bank account verified successfully');
      
      // Here you would typically proceed to the final confirmation step
      // or trigger the actual transfer
      
    } catch (error) {
      toast.showError('Failed to verify bank account. Please try again.');
      console.error('Transfer recipient creation failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loadingBanks) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4">
      {!selectedBank ? (
        <>
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
              <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2 mb-20">
            {filteredBanks.map((bank) => (
              <button
                key={bank.code}
                onClick={() => setSelectedBank(bank)}
                className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
              >
                {bank.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selected Bank
            </label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>{selectedBank.name}</span>
              <button
                type="button"
                onClick={() => setSelectedBank(null)}
                className="text-purple-600"
              >
                Change
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => handleAccountNumberChange(e.target.value)}
              placeholder="Enter 10-digit account number"
              className="w-full p-3 border rounded-lg"
              maxLength={10}
              pattern="\d{10}"
            />
          </div>

          {verifying && (
            <div className="text-center text-sm text-gray-500">
              Verifying account...
            </div>
          )}

          {accountName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <div className="p-3 border rounded-lg bg-gray-50">
                {accountName}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!accountName || verifying || processing}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
          >
            {processing ? 'Processing...' : `Withdraw ₦${amount.toLocaleString()}`}
          </button>
        </form>
      )}
    </div>
  );
};

export default BankSelectionForm;
