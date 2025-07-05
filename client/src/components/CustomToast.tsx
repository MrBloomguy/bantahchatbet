import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface CustomToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ type, title, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#4CAF50]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#F44336]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#2196F3]" />;
      default:
        return <Info className="w-5 h-5 text-[#2196F3]" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-[#4CAF50]';
      case 'error':
        return 'border-l-[#F44336]';
      case 'info':
        return 'border-l-[#2196F3]';
      default:
        return 'border-l-[#2196F3]';
    }
  };

  return (
    <div 
      className={`bg-[#1E1E1E]/90 backdrop-blur-sm border border-[#333333] border-l-4 ${getBorderColor()} rounded-md shadow-lg p-4 mb-3 flex items-start max-w-md w-full animate-slide-in`}
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1 mr-2">
        <h3 className="font-medium text-white text-sm">{title}</h3>
        {message && <p className="text-gray-300 text-xs mt-1">{message}</p>}
      </div>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CustomToast;
