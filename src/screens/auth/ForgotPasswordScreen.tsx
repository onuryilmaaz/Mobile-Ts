import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/modules/auth/auth.api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!email) {
      setError('Email zorunlu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await authApi.forgotPassword({ email });
      setMessage('Şifre sıfırlama kodu gönderildi');
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      console.log(err);
      setError('İstek başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center">
      <View className="rounded-3xl bg-white px-6 py-8 shadow-lg shadow-blue-100">
        <Text className="mb-2 text-3xl font-bold">Şifremi Unuttum</Text>
        <Text className="mb-6 text-gray-500">Email adresine kod gönderelim</Text>

        {error && <Text className="mb-3 text-red-500">{error}</Text>}
        {message && <Text className="mb-3 text-green-600">{message}</Text>}

        <Input
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />

        <Button title="Kod Gönder" onPress={handleSend} loading={loading} />

        <TouchableOpacity className="items-center pt-4" onPress={() => navigation.goBack()}>
          <Text className="font-bold text-primary-600">Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
