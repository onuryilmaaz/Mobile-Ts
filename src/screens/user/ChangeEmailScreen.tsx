import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { Divider } from '@/components/ui/Divider';
import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useAlertStore } from '@/store/alert.store';
import { Ionicons } from '@expo/vector-icons';

export default function ChangeEmailScreen() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const alert = useAlertStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  async function handleSendCode() {
    if (!newEmail) {
      alert.error('Hata', 'Yeni email zorunlu');
      return;
    }

    try {
      setLoading(true);
      await authApi.changeEmailRequest({ newEmail });
      setCodeSent(true);
      alert.success('Başarılı', 'Doğrulama kodu gönderildi');
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'E-posta değişikliği başlatılamadı');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!emailOtp || !newEmail) {
      alert.error('Hata', 'Kod ve yeni email zorunlu');
      return;
    }

    try {
      setLoading(true);
      await authApi.changeEmailConfirm({ otp: emailOtp, newEmail });
      alert.success('Başarılı', 'E-posta güncellendi');
      setNewEmail('');
      setEmailOtp('');
      setCodeSent(false);
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'E-posta onaylanamadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="bg-slate-50">
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Card className="mt-4">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons name="mail-outline" size={20} color="#0f766e" />
            <Text className="text-base font-semibold text-slate-900">E-posta Değiştir</Text>
          </View>
          <Text className="mb-6 text-sm text-slate-600">
            E-posta adresinizi değiştirmek için yeni adresinizi girin. Size bir doğrulama kodu göndereceğiz.
          </Text>

          <View className="gap-4">
            <Input
              label="Yeni E-posta"
              placeholder="yeni@email.com"
              value={newEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setNewEmail}
              onFocus={handleInputFocus}
            />
            
            {!codeSent ? (
              <Button 
                title="Doğrulama Kodu Gönder" 
                onPress={handleSendCode} 
                loading={loading} 
              />
            ) : (
              <>
                <Divider />
                <View>
                  <Text className="mb-3 text-sm font-medium text-slate-700">Doğrulama Kodu</Text>
                  <OtpInput
                    value={emailOtp}
                    onChange={setEmailOtp}
                    onComplete={(code) => {
                      setEmailOtp(code);
                    }}
                  />
                </View>
                <View className="gap-3">
                  <Button 
                    title="E-postayı Güncelle" 
                    onPress={handleConfirm} 
                    loading={loading}
                    disabled={emailOtp.length !== 6}
                  />
                  <Button 
                    title="Kodu Tekrar Gönder" 
                    onPress={handleSendCode} 
                    loading={loading}
                    variant="outline"
                  />
                </View>
              </>
            )}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

