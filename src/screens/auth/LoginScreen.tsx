import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/store/theme.store';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList>;
};

export default function LoginScreen({ navigation }: Props) {
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

      const { data } = await authApi.login({ email, password });

      if (!data.user.emailVerified) {
        navigation.replace('Otp', { email, password });
        return;
      }

      await login(data.user, data.accessToken, data.refreshToken);
      navigation.getParent()?.navigate('UserTabs', { screen: 'Home' });
    } catch (err: any) {
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
    <Screen>
      <ScrollView
        ref={scrollViewRef}
        className="m-0"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 24,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <View className="w-full items-center">
          <Card className="w-full border-slate-100 dark:border-white/10">
            <View className="mb-8 items-center">
              <Text className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Hoş Geldin
              </Text>
              <Text className="mt-2 text-slate-600 dark:text-slate-300">
                Hesabına giriş yap ve devam et
              </Text>
            </View>
            {error && (
              <View className="mb-4 rounded-2xl bg-red-50 p-3 dark:bg-red-500/10">
                <Text className="text-center text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </Text>
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
                <Text className="text-sm font-medium text-teal-600 dark:text-teal-400">
                  Şifremi unuttum?
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              onPress={handleLogin}
              loading={loading}
            />

            <View className="mt-6 flex-row justify-center">
              <Text className="text-slate-600 dark:text-slate-300">Hesabın yok mu? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="font-bold text-teal-600 dark:text-teal-400">Kayıt Ol</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
