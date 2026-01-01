import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertState = {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type AlertStore = AlertState & {
  show: (config: Omit<AlertState, 'visible'>) => void;
  hide: () => void;
  // Kısayol metodlar
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText?: string,
    cancelText?: string,
    destructive?: boolean
  ) => void;
};

const initialState: AlertState = {
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  buttons: [],
};

export const useAlertStore = create<AlertStore>((set, get) => ({
  ...initialState,

  show: (config) => {
    set({
      visible: true,
      ...config,
    });
  },

  hide: () => {
    set(initialState);
  },

  success: (title, message) => {
    set({
      visible: true,
      type: 'success',
      title,
      message,
      buttons: [{ text: 'Tamam', style: 'default' }],
    });
  },

  error: (title, message) => {
    set({
      visible: true,
      type: 'error',
      title,
      message,
      buttons: [{ text: 'Tamam', style: 'default' }],
    });
  },

  warning: (title, message) => {
    set({
      visible: true,
      type: 'warning',
      title,
      message,
      buttons: [{ text: 'Tamam', style: 'default' }],
    });
  },

  info: (title, message) => {
    set({
      visible: true,
      type: 'info',
      title,
      message,
      buttons: [{ text: 'Tamam', style: 'default' }],
    });
  },

  confirm: (title, message, onConfirm, confirmText = 'Evet', cancelText = 'Vazgeç', destructive = false) => {
    set({
      visible: true,
      type: 'confirm',
      title,
      message,
      buttons: [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, onPress: onConfirm, style: destructive ? 'destructive' : 'default' },
      ],
    });
  },
}));

// Helper function - Alert.alert benzeri kullanım için
export const alert = {
  show: useAlertStore.getState().show,
  hide: useAlertStore.getState().hide,
  success: useAlertStore.getState().success,
  error: useAlertStore.getState().error,
  warning: useAlertStore.getState().warning,
  info: useAlertStore.getState().info,
  confirm: useAlertStore.getState().confirm,
};

