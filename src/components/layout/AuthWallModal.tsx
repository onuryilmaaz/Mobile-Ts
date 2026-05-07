import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { rootNavigate } from '@/navigation/rootNavigation';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

interface AuthWallModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
}

export function AuthWallModal({
  visible,
  onClose,
  title = 'Oturum Açmanız Gerekiyor',
  description = 'Bu özelliği kullanabilmek ve ilerlemenizi kaydetmek için lütfen giriş yapın veya kayıt olun.',
  onLoginPress,
  onRegisterPress,
}: AuthWallModalProps) {
  const { isDark } = useTheme();

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onLoginPress) return onLoginPress();

    rootNavigate('Auth', { screen: 'Login' });
  };

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onRegisterPress) return onRegisterPress();
    rootNavigate('Auth', { screen: 'Register' });
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        {Platform.OS === 'ios' && (
          <BlurView intensity={20} className="absolute inset-0" tint={isDark ? 'dark' : 'light'} />
        )}

        <View className="w-full overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-slate-900">
          <View className="items-center bg-teal-50 p-8 dark:bg-teal-500/10">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm shadow-black/5 dark:bg-slate-900/40 dark:shadow-none">
              <Ionicons name="lock-closed" size={40} color={isDark ? '#14b8a6' : '#0f766e'} />
            </View>
            <Text className="text-center text-2xl font-black text-slate-900 dark:text-white">
              {title}
            </Text>
          </View>

          <View className="p-8">
            <Text className="text-center text-lg leading-7 text-slate-600 dark:text-slate-300">
              {description}
            </Text>

            <View className="mt-8 gap-4">
              <TouchableOpacity
                onPress={handleLogin}
                className="h-16 flex-row items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-200 dark:bg-teal-500 dark:shadow-none"
                activeOpacity={0.8}>
                <Text className="text-lg font-bold text-white">Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRegister}
                className="h-16 flex-row items-center justify-center rounded-2xl border-2 border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                activeOpacity={0.7}>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Kayıt Ol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="h-12 items-center justify-center"
                activeOpacity={0.7}>
                <Text className="font-semibold text-slate-400 dark:text-slate-400">Daha Sonra</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
