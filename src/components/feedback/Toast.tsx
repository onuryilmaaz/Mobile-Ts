import { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';
import { useTheme } from '@/hooks/useTheme';

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
    darkBg: string;
    border: string;
    darkBorder: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    darkIconColor: string;
    textColor: string;
    darkTextColor: string;
  }
> = {
  success: {
    bg: '#f0fdf4',
    darkBg: 'rgba(22, 163, 74, 0.1)',
    border: '#bbf7d0',
    darkBorder: 'rgba(22, 163, 74, 0.2)',
    icon: 'checkmark-circle',
    iconColor: '#16a34a',
    darkIconColor: '#4ade80',
    textColor: '#166534',
    darkTextColor: '#4ade80',
  },
  error: {
    bg: '#fef2f2',
    darkBg: 'rgba(220, 38, 38, 0.1)',
    border: '#fecaca',
    darkBorder: 'rgba(220, 38, 38, 0.2)',
    icon: 'close-circle',
    iconColor: '#dc2626',
    darkIconColor: '#f87171',
    textColor: '#991b1b',
    darkTextColor: '#f87171',
  },
  warning: {
    bg: '#fffbeb',
    darkBg: 'rgba(217, 119, 6, 0.1)',
    border: '#fde68a',
    darkBorder: 'rgba(217, 119, 6, 0.2)',
    icon: 'warning',
    iconColor: '#d97706',
    darkIconColor: '#fbbf24',
    textColor: '#92400e',
    darkTextColor: '#fbbf24',
  },
  info: {
    bg: '#eff6ff',
    darkBg: 'rgba(37, 99, 235, 0.1)',
    border: '#bfdbfe',
    darkBorder: 'rgba(37, 99, 235, 0.2)',
    icon: 'information-circle',
    iconColor: '#2563eb',
    darkIconColor: '#60a5fa',
    textColor: '#1e40af',
    darkTextColor: '#60a5fa',
  },
};

const premiumSurfaceBorder = {
  light: 'rgba(15,23,42,0.06)',
  dark: 'rgba(255,255,255,0.08)',
};

function ToastItem({ toast: toastData, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const { isDark } = useTheme();
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
        backgroundColor: isDark ? config.darkBg : config.bg,
        borderColor: isDark ? premiumSurfaceBorder.dark : premiumSurfaceBorder.light,
      }}
      className="mx-4 mb-2 flex-row items-center rounded-2xl border p-4 shadow-sm">
      <Ionicons 
        name={config.icon} 
        size={24} 
        color={isDark ? config.darkIconColor : config.iconColor} 
      />

      <View className="ml-3 flex-1">
        <Text 
          className="font-bold" 
          style={{ color: isDark ? config.darkTextColor : config.textColor }}>
          {toastData.title}
        </Text>
        {toastData.message && (
          <Text 
            className="text-sm opacity-80" 
            style={{ color: isDark ? config.darkTextColor : config.textColor }}>
            {toastData.message}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={onDismiss} className="ml-2 p-1">
        <Ionicons name="close" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <View 
      className="absolute left-0 right-0 z-[1000]" 
      style={{ top: Platform.OS === 'ios' ? 60 : 40 }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </View>
  );
}
