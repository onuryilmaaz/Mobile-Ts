import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ navigation, route }: Props) {
  const { email, password } = route.params;
  const login = useAuthStore((s) => s.login);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOtpComplete = async (code: string) => {
    setOtp(code);
    await handleVerify(code);
  };

  async function handleVerify(code?: string) {
    const verifyCode = code || otp;
    if (!verifyCode || verifyCode.length !== 6) {
      setError('6 haneli kodu girin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await authApi.verifyEmail({ email, code: verifyCode });

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
      setOtp('');
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
    <Screen className="justify-center bg-slate-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-slate-900">OTP Doğrulama</Text>
          <Text className="mt-2 text-center text-slate-500">
            {email} adresine gönderilen 6 haneli kodu girin
          </Text>
        </View>

        <Card className="shadow-lg shadow-primary-500/10">
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-sm font-medium text-red-600">{error}</Text>
            </View>
          )}
          {message && (
            <View className="mb-4 rounded-xl bg-green-50 p-3">
              <Text className="text-center text-sm font-medium text-green-600">{message}</Text>
            </View>
          )}

          <View className="mb-6">
            <OtpInput value={otp} onChange={setOtp} onComplete={handleOtpComplete} />
          </View>

          <Button
            title="Doğrula"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={otp.length !== 6}
          />

          <TouchableOpacity onPress={handleResend} className="mt-4" disabled={loading}>
            <Text className="text-center font-medium text-primary-600">
              Kod gelmedi mi? Tekrar gönder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-3">
            <Text className="text-center text-slate-500">Geri dön</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
}
