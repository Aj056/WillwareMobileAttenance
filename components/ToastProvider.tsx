import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from './ui/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const showSuccess = (message: string, duration = 3000) => {
    showToast(message, 'success', duration);
  };

  const showError = (message: string, duration = 4000) => {
    showToast(message, 'error', duration);
  };

  const showWarning = (message: string, duration = 3500) => {
    showToast(message, 'warning', duration);
  };

  const showInfo = (message: string, duration = 3000) => {
    showToast(message, 'info', duration);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
        position="top"
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;