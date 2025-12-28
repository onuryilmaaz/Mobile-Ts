import { useState, useCallback } from 'react';
import { View, Text, Alert, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/modules/user/user.api';
import { useAuthStore } from '@/modules/auth/auth.store';

export default function ChangePasswordScreen() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Hata', 'Şifre alanları zorunlu');
      return;
    }

    try {
      setLoading(true);
      await userApi.changePassword({ currentPassword, newPassword });
      Alert.alert('Başarılı', 'Şifre güncellendi');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Şifre güncellenemedi');
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
          Güvenliğiniz için mevcut şifrenizi girin ve yeni şifrenizi belirleyin.
        </Text>

        <Input
          label="Mevcut Şifre"
          placeholder="Mevcut şifrenizi girin"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <Input
          label="Yeni Şifre"
          placeholder="Yeni şifrenizi girin"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        
        <View className="mt-4">
          <Button 
            title="Şifreyi Güncelle" 
            onPress={handleChangePassword} 
            loading={loading} 
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

