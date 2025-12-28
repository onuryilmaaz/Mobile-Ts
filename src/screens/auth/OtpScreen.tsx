import { useState } from 'react';
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/layout/Screen';
import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ navigation, route }: Props) {
  const { email, password } = route.params;
  const login = useAuthStore((s) => s.login);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!code) {
      setError('Kod zorunlu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await authApi.verifyEmail({ email, code });

      if (password) {
        const { data } = await authApi.login({ email, password });
        await login(data.user, data.accessToken, data.refreshToken);
        return;
      }

      setMessage('Doğrulama başarılı, giriş yapabilirsiniz');
      navigation.replace('Login');
    } catch (err) {
      console.log(err);
      setError('Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setLoading(true);
      setError(null);
      await authApi.resendEmailOtp(email);
      setMessage('Kod gönderildi');
    } catch (err) {
      console.log(err);
      setError('Kod gönderilemedi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center">
      <View className="rounded-3xl bg-white px-6 py-8 shadow-lg shadow-blue-100">
        <Text className="mb-1 text-xs font-semibold uppercase text-blue-600">{email}</Text>
        <Text className="mb-2 text-3xl font-bold text-gray-900">OTP Doğrulama</Text>
        <Text className="mb-6 text-gray-500">E-postana gönderilen kodu gir</Text>

        {error && <Text className="mb-3 text-red-500">{error}</Text>}
        {message && <Text className="mb-3 text-green-600">{message}</Text>}

        <Input
          placeholder="6 haneli kod"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />

        <Button title="Doğrula" onPress={handleVerify} loading={loading} />

        <Text className="mt-4 text-center text-blue-600" onPress={handleResend}>
          Kod gelmedi mi? Tekrar gönder
        </Text>

        <Text className="mt-2 text-center text-gray-500" onPress={() => navigation.goBack()}>
          Geri dön
        </Text>
      </View>
    </Screen>
  );
}
