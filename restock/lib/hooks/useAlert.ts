import { useState, useCallback } from 'react';
import type { AlertType, AlertAction } from '../../components/AlertModal';

type AlertState = {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  actions?: AlertAction[];
};

const initialState: AlertState = {
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  actions: undefined,
};

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>(initialState);

  const showAlert = useCallback((
    type: AlertType,
    title: string,
    message?: string,
    actions?: AlertAction[]
  ) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
      actions,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(initialState);
  }, []);

  // Convenience methods
  const showInfo = useCallback((title: string, message?: string) => {
    showAlert('info', title, message);
  }, [showAlert]);

  const showSuccess = useCallback((title: string, message?: string, onOk?: () => void) => {
    showAlert('success', title, message, onOk ? [
      { text: 'OK', onPress: onOk }
    ] : undefined);
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string) => {
    showAlert('warning', title, message);
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string) => {
    showAlert('error', title, message);
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    showAlert('confirm', title, message, [
      { text: confirmText, onPress: onConfirm },
      { text: cancelText, style: 'cancel' },
    ]);
  }, [showAlert]);

  const showDelete = useCallback((
    title: string,
    message: string,
    onDelete: () => void,
    deleteText: string = 'Delete',
    cancelText: string = 'Cancel'
  ) => {
    showAlert('delete', title, message, [
      { text: deleteText, onPress: onDelete, style: 'destructive' },
      { text: cancelText, style: 'cancel' },
    ]);
  }, [showAlert]);

  return {
    alert,
    showAlert,
    hideAlert,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showConfirm,
    showDelete,
  };
}

