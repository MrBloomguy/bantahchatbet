import React from 'react';
import { Check, X } from 'lucide-react';

interface DepositSuccessModalProps {
  amount: number;
  transactionRef: string;
  paymentMethod: 'card' | 'bank' | 'ussd';
  onClose: () => void;
  onViewReceipt?: () => void;
}

export const DepositSuccessModal: React.FC<DepositSuccessModalProps> = ({
  amount,
  transactionRef,
  paymentMethod,
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
            Deposit Successful
          </h3>
          <p className="mt-2 text-gray-600">
            Your wallet has been credited with ₦{amount.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Transaction Reference: {transactionRef}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Payment Method: {paymentMethod.toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          {onViewReceipt && (
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