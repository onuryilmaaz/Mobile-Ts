import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/modules/user/user.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useAlertStore } from '@/store/alert.store';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const alert = useAlertStore();
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

  async function handleDeactivate() {
    alert.confirm(
      'Hesabı Devre Dışı Bırak',
      'Hesabınızı devre dışı bırakmak istediğinize emin misiniz? Bu işlem geri alınabilir ancak hesabınıza erişiminiz kısıtlanacaktır.',
      async () => {
        try {
          setLoading(true);
          await userApi.deactivate();
          alert.success('Başarılı', 'Hesap devre dışı bırakıldı');
          await logout();
        } catch (err) {
          console.log(err);
          alert.error('Hata', 'Hesap devre dışı bırakılamadı');
        } finally {
          setLoading(false);
        }
      },
      'Devre Dışı Bırak',
      'Vazgeç',
      true
    );
  }

  function handleLogout() {
    alert.confirm(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      logout,
      'Çıkış Yap',
      'Vazgeç',
      true
    );
  }

  return (
    <Screen className="bg-slate-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Card className="mt-4 mb-4">
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="log-out-outline" size={24} color="#0f766e" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-slate-900">Çıkış Yap</Text>
              <Text className="text-sm text-slate-500">
                Hesabınızdan güvenli bir şekilde çıkış yapın
              </Text>
            </View>
          </View>
          <Button 
            title="Çıkış Yap" 
            onPress={handleLogout} 
            variant="outline"
          />
        </Card>

        <Card className="border-red-200 bg-red-50">
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="warning-outline" size={24} color="#dc2626" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-red-700">Tehlikeli Bölge</Text>
              <Text className="text-sm text-red-600">
                Hesabınızı devre dışı bırakmak geri alınabilir ancak dikkatli olun
              </Text>
            </View>
          </View>
          <Button 
            title="Hesabı Devre Dışı Bırak" 
            onPress={handleDeactivate} 
            loading={loading}
            variant="danger"
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

