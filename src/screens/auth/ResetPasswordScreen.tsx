import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OtpInput } from '@/components/ui/OtpInput';
import { authApi } from '@/modules/auth/auth.api';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const email = route.params?.email ?? '';
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOtpComplete = (code: string) => {
    setOtp(code);
    setStep('password');
  };

  const handleOtpContinue = () => {
    if (otp.length !== 6) {
      setError('6 haneli kodu girin');
      return;
    }
    setError(null);
    setStep('password');
  };

  async function handleReset() {
    if (!newPassword || !confirmPassword) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalı');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authApi.resetPassword({ email, otp, newPassword });
      
      navigation.navigate('Login');
    } catch (err: any) {
      console.log(err);
      const msg = err?.response?.data?.message || 'Şifre sıfırlama başarısız. Kodu kontrol edin.';
      setError(msg);
      setStep('otp');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="justify-center bg-slate-50">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary-100">
            <Ionicons name={step === 'otp' ? 'keypad' : 'lock-closed'} size={40} color="#0d9488" />
          </View>
          <Text className="text-3xl font-bold text-slate-900">
            {step === 'otp' ? 'Kodu Gir' : 'Yeni Şifre'}
          </Text>
          <Text className="mt-2 text-center text-slate-500">
            {step === 'otp' 
              ? `${email} adresine gönderilen 6 haneli kodu girin`
              : 'Yeni şifrenizi belirleyin'
            }
          </Text>
        </View>

        <Card className="shadow-lg shadow-primary-500/10">
          {error && (
            <View className="mb-4 rounded-xl bg-red-50 p-3">
              <Text className="text-center text-sm font-medium text-red-600">{error}</Text>
            </View>
          )}

          {step === 'otp' ? (
            <>
              <View className="mb-6">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleOtpComplete}
                />
              </View>

              <Button
                title="Devam Et"
                onPress={handleOtpContinue}
                disabled={otp.length !== 6}
              />

              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                className="mt-4">
                <Text className="text-center text-slate-500">Geri dön</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Input
                label="Yeni Şifre"
                placeholder="En az 6 karakter"
                value={newPassword}
                onChangeText={setNewPassword}
                isPassword
              />

              <Input
                label="Şifre Tekrar"
                placeholder="Şifreyi tekrar girin"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              <Button
                title="Şifreyi Güncelle"
                onPress={handleReset}
                loading={loading}
                className="mt-2"
              />

              <TouchableOpacity 
                onPress={() => {
                  setStep('otp');
                  setError(null);
                }}
                className="mt-4 flex-row items-center justify-center gap-1">
                <Ionicons name="arrow-back" size={16} color="#64748b" />
                <Text className="text-slate-500">Kodu değiştir</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
