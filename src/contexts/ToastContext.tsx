import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CustomToastContainer, { ToastItem } from '../components/CustomToastContainer';

interface ToastOptions {
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showSuccess: (title: string, options?: ToastOptions) => void;
  showError: (title: string, options?: ToastOptions) => void;
  showInfo: (title: string, options?: ToastOptions) => void;
  showWarning: (title: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, options?: ToastOptions) => {
    const id = uuidv4();
    const newToast: ToastItem = {
      id,
      type: type === 'warning' ? 'info' : type, // Map warning to info for simplicity
      title,
      message: options?.message,
      duration: options?.duration || 5000
    };

    setToasts(prev => [...prev, newToast]);

    return id;
  }, []);

  const showSuccess = useCallback((title: string, options?: ToastOptions) => {
    return addToast('success', title, options);
  }, [addToast]);

  const showError = useCallback((title: string, options?: ToastOptions) => {
    return addToast('error', title, options);
  }, [addToast]);

  const showInfo = useCallback((title: string, options?: ToastOptions) => {
    return addToast('info', title, options);
  }, [addToast]);

  const showWarning = useCallback((title: string, options?: ToastOptions) => {
    return addToast('info', title, options); // Use info type with warning content
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning
      }}
    >
      {children}
      <CustomToastContainer
        toasts={toasts}
        removeToast={removeToast}
        position="top-right"
      />
    </ToastContext.Provider>
  );
};
