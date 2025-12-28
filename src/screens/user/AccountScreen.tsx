import { useState, useCallback } from 'react';
import { View, Text, Alert, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/modules/user/user.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
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
    Alert.alert(
      'Hesabı Devre Dışı Bırak',
      'Hesabınızı devre dışı bırakmak istediğinize emin misiniz? Bu işlem geri alınabilir ancak hesabınıza erişiminiz kısıtlanacaktır.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devre Dışı Bırak',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await userApi.deactivate();
              Alert.alert('Başarılı', 'Hesap devre dışı bırakıldı');
              await logout();
            } catch (err) {
              console.log(err);
              Alert.alert('Hata', 'Hesap devre dışı bırakılamadı');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Screen>
      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center gap-3">
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
          <View className="mt-4">
            <Button 
              title="Çıkış Yap" 
              onPress={handleLogout} 
              variant="outline"
            />
          </View>
        </View>

        <View className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <View className="flex-row items-center gap-3">
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
          <View className="mt-4">
            <Button 
              title="Hesabı Devre Dışı Bırak" 
              onPress={handleDeactivate} 
              loading={loading}
              variant="danger"
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

