import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/modules/auth/auth.api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
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
    <Screen className="justify-center">
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
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
            onFocus={handleInputFocus}
          />

          <Button title="Kod Gönder" onPress={handleSend} loading={loading} />

          <TouchableOpacity className="items-center pt-4" onPress={() => navigation.goBack()}>
            <Text className="font-bold text-primary-600">Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
