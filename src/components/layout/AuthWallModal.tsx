import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface AuthWallModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthWallModal({ 
  visible, 
  onClose, 
  title = 'Oturum Açmanız Gerekiyor',
  description = 'Bu özelliği kullanabilmek ve ilerlemenizi kaydetmek için lütfen giriş yapın veya kayıt olun.'
}: AuthWallModalProps) {
  const navigation = useNavigation<any>();

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    navigation.navigate('Auth', { screen: 'Register' });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        {Platform.OS === 'ios' && (
          <BlurView intensity={20} className="absolute inset-0" tint="dark" />
        )}
        
        <View className="w-full overflow-hidden rounded-[32px] bg-white shadow-2xl">
          <View className="items-center bg-primary-50 p-8">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
              <Ionicons name="lock-closed" size={40} color="#0f766e" />
            </View>
            <Text className="text-center text-2xl font-black text-slate-900">{title}</Text>
          </View>

          <View className="p-8">
            <Text className="text-center text-lg leading-7 text-slate-600">
              {description}
            </Text>

            <View className="mt-8 space-y-4">
              <TouchableOpacity
                onPress={handleLogin}
                className="h-16 flex-row items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-200"
                activeOpacity={0.8}
              >
                <Text className="text-lg font-bold text-white">Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRegister}
                className="h-16 flex-row items-center justify-center rounded-2xl border-2 border-slate-100 bg-white"
                activeOpacity={0.7}
              >
                <Text className="text-lg font-bold text-slate-900">Kayıt Ol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="h-12 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="font-semibold text-slate-400">Daha Sonra</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
