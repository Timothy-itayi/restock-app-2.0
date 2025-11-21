import { useState, useCallback } from 'react';
import type { ToastType } from '../../components/Toast';

type ToastState = {
  visible: boolean;
  message: string;
  subtext?: string;
  type: ToastType;
};

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'error'
  });

  const showToast = useCallback((
    message: string,
    type: ToastType = 'error',
    subtext?: string
  ) => {
    setToast({
      visible: true,
      message,
      subtext,
      type
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const showError = useCallback((message: string, subtext?: string) => {
    showToast(message, 'error', subtext);
  }, [showToast]);

  const showSuccess = useCallback((message: string, subtext?: string) => {
    showToast(message, 'success', subtext);
  }, [showToast]);

  const showWarning = useCallback((message: string, subtext?: string) => {
    showToast(message, 'warning', subtext);
  }, [showToast]);

  const showInfo = useCallback((message: string, subtext?: string) => {
    showToast(message, 'info', subtext);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
};

