import React from 'react';
import { Check, X, Clock } from 'lucide-react';

interface WithdrawalSuccessModalProps {
  amount: number;
  transactionRef: string;
  bankName: string;
  accountNumber: string;
  estimatedTime: string;
  onClose: () => void;
  onTrackWithdrawal?: () => void;
}

export const WithdrawalSuccessModal: React.FC<WithdrawalSuccessModalProps> = ({
  amount,
  transactionRef,
  bankName,
  accountNumber,
  estimatedTime,
  onClose,
  onTrackWithdrawal
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Withdrawal Initiated
          </h3>
          <p className="mt-2 text-gray-600">
            Your withdrawal of ₦{amount.toLocaleString()} has been processed
          </p>
          
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number</span>
                <span className="font-medium">{accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium">{transactionRef}</span>
              </div>
              <div className="flex items-center gap-2 justify-center mt-4 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Estimated time: {estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {onTrackWithdrawal && (
            <button
              onClick={onTrackWithdrawal}
              className="w-full border border-purple-600 text-purple-600 py-3 rounded-xl font-medium 
                       hover:bg-purple-50 focus:outline-none focus:ring-2 
                       focus:ring-purple-500 focus:ring-offset-2"
            >
              Track Withdrawal
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium 
                     hover:bg-purple-700 focus:outline-none focus:ring-2 
                     focus:ring-purple-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};