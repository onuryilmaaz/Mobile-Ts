import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/modules/auth/auth.api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  async function handleRegister() {
    if (!email || !password || !firstName || !lastName) {
      setError('Tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data } = await authApi.register({
        email,
        password,
        firstName,
        lastName,
      });

      console.log('Register response:', JSON.stringify(data, null, 2));

      if (!data?.user?.emailVerified) {
        navigation.navigate('Otp', { email, password });
        return;
      }

      navigation.replace('Login');
    } catch (err: any) {
      console.log(err);
      const msg = err?.response?.data?.message || 'Kayıt başarısız';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center bg-slate-50">
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}>
        <Card className="shadow-lg shadow-primary-500/10">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-slate-900">Hesap Oluştur</Text>
            <Text className="mt-2 text-slate-500">Hemen aramıza katıl ve başla</Text>
          </View>
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-sm font-medium text-red-600">{error}</Text>
            </View>
          )}

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input 
                label="Ad" 
                placeholder="Adın" 
                value={firstName} 
                onChangeText={setFirstName}
                onFocus={handleInputFocus}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Soyad"
                placeholder="Soyadın"
                value={lastName}
                onChangeText={setLastName}
                onFocus={handleInputFocus}
              />
            </View>
          </View>

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
            placeholder="Güçlü bir şifre seç"
            value={password}
            onChangeText={setPassword}
            isPassword
            onFocus={handleInputFocus}
          />

          <Button
            title={loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
            onPress={handleRegister}
            loading={loading}
            className="mt-2"
          />

          <View className="mt-6 flex-row justify-center">
            <Text className="text-slate-600">Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="font-bold text-primary-600">Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
