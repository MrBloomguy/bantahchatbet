import React from 'react';
import { useToast } from '../contexts/ToastContext';

const ToastDemo: React.FC = () => {
  const toast = useToast();

  const showSuccessToast = () => {
    toast.showSuccess('Congratulations!', {
      message: 'Your OS has been updated to the latest version.',
      duration: 5000
    });
  };

  const showInfoToast = () => {
    toast.showInfo('Did you know?', {
      message: 'You can now switch screen by pressing ⌘ + →',
      duration: 5000
    });
  };

  const showErrorToast = () => {
    toast.showError('Something went wrong!', {
      message: 'Your device turned off unexpectedly. Learn more.',
      duration: 5000
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <button
        onClick={showSuccessToast}
        className="bg-[#4CAF50] text-white px-4 py-2 rounded-md"
      >
        Show Success Toast
      </button>
      <button
        onClick={showInfoToast}
        className="bg-[#2196F3] text-white px-4 py-2 rounded-md"
      >
        Show Info Toast
      </button>
      <button
        onClick={showErrorToast}
        className="bg-[#F44336] text-white px-4 py-2 rounded-md"
      >
        Show Error Toast
      </button>
    </div>
  );
};

export default ToastDemo;
