import React from 'react';
import { X } from 'lucide-react';

interface ActiveContentModalProps {
  onClose: () => void;
  content: React.ReactNode;
}

const ActiveContentModal: React.FC<ActiveContentModalProps> = ({ onClose, content }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1b2e] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-[#1a1b2e] p-4 flex items-center justify-between border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Active Content</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="p-4">
          {content}
        </div>
      </div>
    </div>
  );
};

export default ActiveContentModal;