/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useRef } from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/modules/auth/auth.api';
import { useTheme } from '@/hooks/useTheme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

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
    <Screen>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <Card className="mx-4 shadow-lg shadow-teal-500/10 dark:border-teal-500/20 dark:shadow-none">
          <Text className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
            Şifremi Unuttum
          </Text>
          <Text className="mb-6 text-slate-500 dark:text-slate-400">
            Email adresine kod gönderelim
          </Text>

          {error && <Text className="mb-3 text-red-500 dark:text-red-400">{error}</Text>}
          {message && <Text className="mb-3 text-green-600 dark:text-green-400">{message}</Text>}

          <Input
            placeholder="Email"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            onFocus={handleInputFocus}
          />

          <Button title="Kod Gönder" onPress={handleSend} loading={loading} />

          <TouchableOpacity className="items-center pt-4" onPress={() => navigation.goBack()}>
            <Text className="font-bold text-teal-600 dark:text-teal-400">Geri Dön</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Screen>
  );
}
