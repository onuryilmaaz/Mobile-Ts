/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTheme } from '@/hooks/useTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

export default function OtpScreen({ navigation, route }: Props) {
  const { isDark } = useTheme();
  const { email, password } = route.params;
  const login = useAuthStore((s) => s.login);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  const handleOtpComplete = async (code: string) => {
    setOtp(code);
    if (submitting.current) return;
    await handleVerify(code);
  };

  async function handleVerify(code?: string) {
    const verifyCode = code || otp;
    if (!verifyCode || verifyCode.length !== 6) {
      setError('6 haneli kodu girin');
      return;
    }
    if (submitting.current) return;

    submitting.current = true;
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await authApi.verifyEmail({ email, code: verifyCode });

      if (password) {
        try {
          const { data } = await authApi.login({ email, password });
          await login(data.user, data.accessToken, data.refreshToken);
          navigation.getParent()?.navigate('UserTabs', { screen: 'Home' });
        } catch {
          navigation.replace('Login');
        }
        return;
      }

      navigation.replace('Login');
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      if (serverMsg === 'Invalid or expired code') {
        setError('Kod geçersiz veya süresi dolmuş');
      } else {
        setError('Doğrulama başarısız');
      }
      setOtp('');
    } finally {
      setLoading(false);
      submitting.current = false;
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
    <Screen>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <View className="mb-8 items-center">
          <Text className="text-3xl font-bold text-slate-900 dark:text-white">OTP Doğrulama</Text>
          <Text className="mt-2 text-center text-slate-500 dark:text-slate-400">
            {email} adresine gönderilen 6 haneli kodu girin
          </Text>
        </View>

        <Card className="mx-4 shadow-lg shadow-teal-500/10 dark:border-teal-500/20 dark:shadow-none">
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-3 dark:bg-red-500/10">
              <Text className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </Text>
            </View>
          )}
          {message && (
            <View className="mb-4 rounded-xl bg-green-50 p-3 dark:bg-green-500/10">
              <Text className="text-center text-sm font-medium text-green-600 dark:text-green-400">
                {message}
              </Text>
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
            <Text className="text-center font-medium text-teal-600 dark:text-teal-400">
              Kod gelmedi mi? Tekrar gönder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} className="mt-3">
            <Text className="text-center text-slate-500 dark:text-slate-400">Geri dön</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
}
