import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-8 text-3xl font-bold text-gray-900">Kayıt Ol</Text>

      <Pressable
        className="mb-4 w-full rounded-xl bg-blue-500 py-4"
        onPress={() => navigation.navigate('Otp')}
      >
        <Text className="text-center text-lg font-semibold text-white">
          Kayıt Ol
        </Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text className="text-blue-500">Zaten hesabın var mı? Giriş yap</Text>
      </Pressable>
    </View>
  );
}

