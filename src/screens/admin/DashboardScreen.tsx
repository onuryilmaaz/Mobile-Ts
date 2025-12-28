import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { adminApi } from '@/modules/admin/admin.api';
import { Card } from '@/components/ui/Card';
import { PageLoading } from '@/components/feedback/Loading';
import { ErrorView } from '@/components/feedback/ErrorView';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AdminStackParamList, 'Dashboard'>;

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof AdminStackParamList;
  color: string;
  iconColor: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'users',
    title: 'Kullanıcılar',
    subtitle: 'Kullanıcıları görüntüle ve yönet',
    icon: 'people-outline',
    screen: 'Users',
    color: 'bg-blue-50',
    iconColor: '#3b82f6',
  },
  {
    id: 'roles',
    title: 'Roller',
    subtitle: 'Sistem rollerini yönet',
    icon: 'key-outline',
    screen: 'Roles',
    color: 'bg-amber-50',
    iconColor: '#f59e0b',
  },
];

export default function DashboardScreen({ navigation }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [healthy, setHealthy] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(isInitial = false) {
    try {
      if (isInitial) setInitialLoading(true);
      setLoading(true);
      setError(null);

      const [healthRes, dashboardRes] = await Promise.all([
        adminApi.healthy(),
        adminApi.dashboard(),
      ]);

      setHealthy(!!healthRes.data);
      setStats(dashboardRes.data);
    } catch (err) {
      console.log(err);
      setError('İstatistikler alınamadı');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadData(true);
  }, []);

  if (initialLoading) {
    return (
      <Screen>
        <PageLoading message="Dashboard yükleniyor..." />
      </Screen>
    );
  }

  if (error && !stats) {
    return (
      <Screen>
        <ErrorView title="Yükleme Hatası" message={error} onRetry={() => loadData(true)} />
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadData()} />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Sistem Sağlığı */}
        <Card
          className={`mb-4 mt-4 ${healthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <View className="flex-row items-center gap-3">
            <View className={`rounded-full p-2.5 ${healthy ? 'bg-green-100' : 'bg-red-100'}`}>
              <Ionicons
                name={healthy ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color={healthy ? '#16a34a' : '#dc2626'}
              />
            </View>
            <View className="flex-1">
              <Text className={`font-semibold ${healthy ? 'text-green-800' : 'text-red-800'}`}>
                Sistem Durumu
              </Text>
              <Text className={`text-sm ${healthy ? 'text-green-600' : 'text-red-600'}`}>
                {healthy ? 'Tüm sistemler çalışıyor' : 'Sistem hatası tespit edildi'}
              </Text>
            </View>
          </View>
        </Card>

        {/* İstatistikler */}
        {stats?.users && (
          <Card className="mb-4">
            <Text className="mb-3 text-base font-bold text-slate-900">Özet İstatistikler</Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="min-w-[45%] flex-1 rounded-xl bg-slate-50 p-3">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name="people" size={16} color="#0f766e" />
                  <Text className="text-xs text-slate-500">Toplam Kullanıcı</Text>
                </View>
                <Text className="text-xl font-bold text-slate-900">{stats.users.total || 0}</Text>
              </View>
              <View className="min-w-[45%] flex-1 rounded-xl bg-green-50 p-3">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name="person" size={16} color="#16a34a" />
                  <Text className="text-xs text-slate-500">Aktif</Text>
                </View>
                <Text className="text-xl font-bold text-green-700">{stats.users.active || 0}</Text>
              </View>
              <View className="min-w-[45%] flex-1 rounded-xl bg-slate-100 p-3">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name="person-outline" size={16} color="#64748b" />
                  <Text className="text-xs text-slate-500">Pasif</Text>
                </View>
                <Text className="text-xl font-bold text-slate-600">{stats.users.inactive || 0}</Text>
              </View>
              {stats.sessions && (
                <View className="min-w-[45%] flex-1 rounded-xl bg-purple-50 p-3">
                  <View className="mb-1 flex-row items-center gap-2">
                    <Ionicons name="time" size={16} color="#9333ea" />
                    <Text className="text-xs text-slate-500">Aktif Oturum</Text>
                  </View>
                  <Text className="text-xl font-bold text-purple-700">
                    {stats.sessions.active || 0}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Yönetim Menüsü */}
        <Card>
          <Text className="mb-3 text-base font-bold text-slate-900">Yönetim</Text>
          <View className="gap-2">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center justify-between rounded-xl bg-slate-50 p-4"
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.screen as any)}>
                <View className="flex-1 flex-row items-center gap-3">
                  <View className={`h-10 w-10 items-center justify-center rounded-full ${item.color}`}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-slate-900">{item.title}</Text>
                    <Text className="text-xs text-slate-500">{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
