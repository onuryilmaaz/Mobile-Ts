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
import { useThemeStore } from '@/store/theme.store';

type Props = NativeStackScreenProps<AdminStackParamList, 'Dashboard'>;

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof AdminStackParamList;
  colorLight: string;
  colorDark: string;
  iconColor: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'users',
    title: 'Kullanıcılar',
    subtitle: 'Kullanıcıları görüntüle ve yönet',
    icon: 'people-outline',
    screen: 'Users',
    colorLight: '#eff6ff',
    colorDark: 'rgba(59,130,246,0.1)',
    iconColor: '#3b82f6',
  },
  {
    id: 'roles',
    title: 'Roller',
    subtitle: 'Sistem rollerini yönet',
    icon: 'key-outline',
    screen: 'Roles',
    colorLight: '#fffbeb',
    colorDark: 'rgba(245,158,11,0.1)',
    iconColor: '#f59e0b',
  },
];

export default function DashboardScreen({ navigation }: Props) {
  const { isDark } = useThemeStore();
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
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadData()} />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {stats?.users && (
          <Card className="mx-4 my-4">
            <Text className="mb-3 text-base font-bold text-slate-900 dark:text-white">Özet İstatistikler</Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="min-w-[45%] flex-1 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name="people" size={16} color={isDark ? '#14b8a6' : '#0f766e'} />
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Toplam Kullanıcı</Text>
                </View>
                <Text className="text-xl font-bold text-slate-900 dark:text-white">{stats.users.total || 0}</Text>
              </View>
              <View className="min-w-[45%] flex-1 rounded-xl bg-green-50 p-3 dark:bg-green-500/10">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name="person" size={16} color="#16a34a" />
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Aktif</Text>
                </View>
                <Text className="text-xl font-bold text-green-700 dark:text-green-500">{stats.users.active || 0}</Text>
              </View>
              <View className="min-w-[45%] flex-1 rounded-xl bg-slate-100 p-3 dark:bg-white/5">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name="person-outline" size={16} color="#64748b" />
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Pasif</Text>
                </View>
                <Text className="text-xl font-bold text-slate-600 dark:text-slate-400">
                  {stats.users.inactive || 0}
                </Text>
              </View>
              {stats.sessions && (
                <View className="min-w-[45%] flex-1 rounded-xl bg-purple-50 p-3 dark:bg-purple-500/10">
                  <View className="mb-1 flex-row items-center gap-2">
                    <Ionicons name="time" size={16} color="#9333ea" />
                    <Text className="text-xs text-slate-500 dark:text-slate-400">Aktif Oturum</Text>
                  </View>
                  <Text className="text-xl font-bold text-purple-700 dark:text-purple-400">
                    {stats.sessions.active || 0}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        <Card className="mx-4 mb-4">
          <Text className="mb-3 text-base font-bold text-slate-900 dark:text-white">Yönetim</Text>
          <View className="gap-2">
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-white/5"
                activeOpacity={0.7}
                onPress={() => navigation.navigate(item.screen as any)}>
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full`}
                    style={{ backgroundColor: isDark ? item.colorDark : item.colorLight }}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-slate-900 dark:text-white">{item.title}</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"} />
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
