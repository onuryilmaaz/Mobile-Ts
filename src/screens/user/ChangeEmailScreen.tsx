import { useState, useCallback } from 'react';
import { View, Text, Alert, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/modules/auth/auth.api';
import { useAuthStore } from '@/modules/auth/auth.store';

export default function ChangeEmailScreen() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      Alert.alert('Hata', 'Yeni email zorunlu');
      return;
    }

    try {
      setLoading(true);
      await authApi.changeEmailRequest({ newEmail });
      setCodeSent(true);
      Alert.alert('Başarılı', 'Doğrulama kodu gönderildi');
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'E-posta değişikliği başlatılamadı');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!emailOtp || !newEmail) {
      Alert.alert('Hata', 'Kod ve yeni email zorunlu');
      return;
    }

    try {
      setLoading(true);
      await authApi.changeEmailConfirm({ otp: emailOtp, newEmail });
      Alert.alert('Başarılı', 'E-posta güncellendi');
      setNewEmail('');
      setEmailOtp('');
      setCodeSent(false);
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'E-posta onaylanamadı');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="mb-6 text-base text-slate-600">
          E-posta adresinizi değiştirmek için yeni adresinizi girin. Size bir doğrulama kodu göndereceğiz.
        </Text>

        <Input
          label="Yeni E-posta"
          placeholder="yeni@email.com"
          value={newEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setNewEmail}
        />
        
        {!codeSent ? (
          <View className="mt-4">
            <Button 
              title="Doğrulama Kodu Gönder" 
              onPress={handleSendCode} 
              loading={loading} 
            />
          </View>
        ) : (
          <>
            <Input
              label="Doğrulama Kodu"
              placeholder="6 haneli kod"
              value={emailOtp}
              onChangeText={setEmailOtp}
              keyboardType="number-pad"
            />
            <View className="mt-4 gap-3">
              <Button 
                title="E-postayı Güncelle" 
                onPress={handleConfirm} 
                loading={loading} 
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
      </ScrollView>
    </Screen>
  );
}

