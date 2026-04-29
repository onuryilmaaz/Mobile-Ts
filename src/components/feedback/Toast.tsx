import { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    const duration = toast.duration ?? 3000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message }),
};

const toastConfig: Record<
  ToastType,
  {
    bg: string;
    border: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    textColor: string;
  }
> = {
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    icon: 'checkmark-circle',
    iconColor: '#16a34a',
    textColor: '#166534',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    icon: 'close-circle',
    iconColor: '#dc2626',
    textColor: '#991b1b',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    icon: 'warning',
    iconColor: '#d97706',
    textColor: '#92400e',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: 'information-circle',
    iconColor: '#2563eb',
    textColor: '#1e40af',
  },
};

function ToastItem({ toast: toastData, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const config = toastConfig[toastData.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
        marginHorizontal: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: config.bg,
        borderColor: config.border,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}>
      <Ionicons name={config.icon} size={24} color={config.iconColor} />

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontWeight: '600', color: config.textColor }}>{toastData.title}</Text>
        {toastData.message && (
          <Text style={{ fontSize: 14, color: config.textColor, opacity: 0.8 }}>{toastData.message}</Text>
        )}
      </View>

      <TouchableOpacity onPress={onDismiss} style={{ marginLeft: 8, padding: 4 }}>
        <Ionicons name="close" size={18} color="#64748b" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 56, zIndex: 50 }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </View>
  );
}
