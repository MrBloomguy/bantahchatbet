import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CustomToast, { ToastType } from './CustomToast';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface CustomToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const CustomToastContainer: React.FC<CustomToastContainerProps> = ({ 
  toasts, 
  removeToast,
  position = 'top-right'
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Set up auto-dismiss for toasts
  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration !== 0) { // If duration is 0, toast won't auto-dismiss
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 5000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeToast]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed z-50 flex flex-col gap-2 ${getPositionClasses()}`}>
      {toasts.map(toast => (
        <CustomToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
};

export default CustomToastContainer;
