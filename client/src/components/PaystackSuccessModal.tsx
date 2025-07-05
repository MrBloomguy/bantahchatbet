import React from 'react';
import { Check, X, Clock } from 'lucide-react';

interface PaystackSuccessModalProps {
  type: 'deposit' | 'withdrawal';
  amount: number;
  transactionRef: string;
  paymentMethod?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    estimatedTime: string;
  };
  onClose: () => void;
  onViewReceipt?: () => void;
}

export const PaystackSuccessModal: React.FC<PaystackSuccessModalProps> = ({
  type,
  amount,
  transactionRef,
  paymentMethod,
  bankDetails,
  onClose,
  onViewReceipt
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
            {type === 'deposit' ? 'Deposit Successful' : 'Withdrawal Initiated'}
          </h3>
          <p className="mt-2 text-gray-600">
            {type === 'deposit' 
              ? `Your wallet has been credited with ₦${amount.toLocaleString()}`
              : `Your withdrawal of ₦${amount.toLocaleString()} has been processed`
            }
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Transaction Reference: {transactionRef}
          </p>
          {paymentMethod && (
            <p className="mt-1 text-sm text-gray-500">
              Payment Method: {paymentMethod.toUpperCase()}
            </p>
          )}
          
          {type === 'withdrawal' && bankDetails && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-medium">{bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Number</span>
                  <span className="font-medium">{bankDetails.accountNumber}</span>
                </div>
                <div className="flex items-center gap-2 justify-center mt-4 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Estimated time: {bankDetails.estimatedTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {type === 'deposit' && onViewReceipt && (
            <button
              onClick={onViewReceipt}
              className="w-full border border-purple-600 text-purple-600 py-3 rounded-xl font-medium 
                       hover:bg-purple-50 focus:outline-none focus:ring-2 
                       focus:ring-purple-500 focus:ring-offset-2"
            >
              View Receipt
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