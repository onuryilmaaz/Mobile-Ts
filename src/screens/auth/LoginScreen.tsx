import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-8 text-3xl font-bold text-gray-900">Giriş Yap</Text>

      <Pressable
        className="mb-4 w-full rounded-xl bg-blue-500 py-4"
        onPress={() => navigation.navigate('Otp')}
      >
        <Text className="text-center text-lg font-semibold text-white">
          Devam Et
        </Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text className="text-blue-500">Hesabın yok mu? Kayıt ol</Text>
      </Pressable>
    </View>
  );
}

