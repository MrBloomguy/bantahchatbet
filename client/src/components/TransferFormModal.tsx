import React from 'react';
import { X } from 'lucide-react';
import { TransferForm } from './TransferForm';

interface TransferFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TransferFormModal: React.FC<TransferFormModalProps> = ({ onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl max-w-xs w-full p-4 relative bg-cover bg-center"
        style={{ backgroundImage: 'url(/dialogue-bakcground.svg)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Send Funds</h3>
            <p className="text-xs text-gray-500">Transfer money to another user</p>
          </div>

          <TransferForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
};

export default TransferFormModal;
