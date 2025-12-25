import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-4 text-3xl font-bold text-gray-900">OTP Doğrulama</Text>
      <Text className="mb-8 text-center text-gray-500">
        Telefonunuza gönderilen kodu girin
      </Text>

      <Pressable
        className="w-full rounded-xl bg-blue-500 py-4"
        onPress={() => {
          // Auth tamamlandığında ana ekrana yönlendir
        }}
      >
        <Text className="text-center text-lg font-semibold text-white">
          Doğrula
        </Text>
      </Pressable>
    </View>
  );
}

