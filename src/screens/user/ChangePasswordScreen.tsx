import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/modules/user/user.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useAlertStore } from '@/store/alert.store';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const alert = useAlertStore();
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
      alert.error('Hata', 'Şifre alanları zorunlu');
      return;
    }

    try {
      setLoading(true);
      await userApi.changePassword({ currentPassword, newPassword });
      alert.success('Başarılı', 'Şifre güncellendi');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Şifre güncellenemedi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="bg-slate-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Card className="mt-4">
          <View className="mb-4 flex-row items-center gap-2">
            <Ionicons name="lock-closed-outline" size={20} color="#0f766e" />
            <Text className="text-base font-semibold text-slate-900">Şifre Değiştir</Text>
          </View>
          <Text className="mb-6 text-sm text-slate-600">
            Güvenliğiniz için mevcut şifrenizi girin ve yeni şifrenizi belirleyin.
          </Text>

          <View className="gap-4">
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
            
            <Button 
              title="Şifreyi Güncelle" 
              onPress={handleChangePassword} 
              loading={loading} 
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

