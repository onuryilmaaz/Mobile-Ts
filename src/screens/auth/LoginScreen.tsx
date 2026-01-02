import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';

import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useAuthStore((s) => s.login);
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError('Email ve şifre zorunlu');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Login attempt for:', email);
      const { data } = await authApi.login({ email, password });
      console.log('Login response:', JSON.stringify(data, null, 2));

      if (!data.user.emailVerified) {
        console.log('Email not verified, redirecting to OTP');
        navigation.replace('Otp', { email, password });
        return;
      }

      console.log('Calling login with user:', data.user);
      await login(data.user, data.accessToken, data.refreshToken);
      console.log('Login completed successfully');
    } catch (err: any) {
      console.log('Login error:', err);
      console.log('Login error response:', err?.response?.data);
      console.log('Login error status:', err?.response?.status);

      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;

      let errorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';

      if (serverMessage) {
        errorMessage = serverMessage;
      } else if (status === 401) {
        errorMessage = 'Email veya şifre hatalı.';
      } else if (status === 403) {
        errorMessage = 'Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.';
      } else if (status === 423) {
        errorMessage = 'Hesabınız kilitlenmiş. Lütfen daha sonra tekrar deneyin.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Screen className="justify-center bg-slate-50">
      <ScrollView
        ref={scrollViewRef}
        className="m-0"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <Card className="border-primary-500 shadow-xl shadow-primary-500/10">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-slate-900">Hoş Geldin!</Text>
            <Text className="mt-2 text-slate-500">Hesabına giriş yap ve devam et</Text>
          </View>
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-sm font-medium text-red-600">{error}</Text>
            </View>
          )}

          <Input
            label="Email"
            placeholder="ornek@email.com"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            onFocus={handleInputFocus}
          />

          <Input
            label="Şifre"
            placeholder="••••••"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            isPassword
            onFocus={handleInputFocus}
          />

          <View className="mb-6 items-end">
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text className="text-sm font-medium text-primary-600">Şifremi unuttum?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            onPress={handleLogin}
            loading={loading}
          />

          <View className="mt-6 flex-row justify-center">
            <Text className="text-slate-600">Hesabın yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="font-bold text-primary-600">Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
