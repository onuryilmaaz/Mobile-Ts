import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { adminApi } from '@/modules/admin/admin.api';
import { Card } from '@/components/ui/Card';
import { PageLoading } from '@/components/feedback/Loading';
import { ErrorView } from '@/components/feedback/ErrorView';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';

type Props = NativeStackScreenProps<AdminStackParamList, 'Dashboard'>;

const screenWidth = Dimensions.get('window').width;

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

  const chartConfig = {
    color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
  };

  const getUserChartData = () => {
    if (!stats?.users) return [];

    const active = parseInt(stats.users.active || '0');
    const total = parseInt(stats.users.total || '0');
    const inactive = total - active;

    return [
      {
        name: 'Aktif',
        population: active,
        color: '#0d9488',
        legendFontColor: '#64748b',
        legendFontSize: 12,
      },
      {
        name: 'Pasif',
        population: inactive > 0 ? inactive : 0,
        color: '#cbd5e1',
        legendFontColor: '#64748b',
        legendFontSize: 12,
      },
    ];
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View className="mb-3 w-[48%] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className={`mb-2 h-10 w-10 items-center justify-center rounded-full ${color}`}>
        <Ionicons name={icon} size={20} color="#0f766e" />
      </View>
      <Text className="text-xs font-medium uppercase text-slate-500">{title}</Text>
      <Text className="text-2xl font-bold text-slate-900">{value}</Text>
    </View>
  );

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
        <ErrorView
          title="Yükleme Hatası"
          message={error}
          onRetry={() => loadData(true)}
        />
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadData()} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="pt-4">
        <Card
          className={`mb-6 ${healthy ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <View className="flex-row items-center gap-3">
            <View className={`rounded-full p-3 ${healthy ? 'bg-green-100' : 'bg-red-100'}`}>
              <Ionicons
                name={healthy ? 'checkmark-circle' : 'alert-circle'}
                size={28}
                color={healthy ? '#16a34a' : '#dc2626'}
              />
            </View>
            <View>
              <Text className={`text-lg font-bold ${healthy ? 'text-green-700' : 'text-red-700'}`}>
                Sistem Sağlığı
              </Text>
              <Text className={`text-sm ${healthy ? 'text-green-600' : 'text-red-600'}`}>
                {healthy ? 'Tüm sistemler düzgün çalışıyor.' : 'Sistem hatası tespit edildi.'}
              </Text>
            </View>
          </View>
        </Card>

        {error && (
          <View className="mb-4 rounded-xl bg-red-50 p-3">
            <Text className="font-medium text-red-600">{error}</Text>
          </View>
        )}

        <Text className="mb-3 ml-1 text-lg font-bold text-slate-900">Hızlı İstatistikler</Text>

        {stats?.users ? (
          <View className="mb-4 flex-row flex-wrap justify-between">
            <StatCard
              title="Toplam Kullanıcı"
              value={stats.users.total || 0}
              icon="people"
              color="bg-primary-100"
            />
            <StatCard
              title="Aktif Kullanıcı"
              value={stats.users.active || 0}
              icon="person"
              color="bg-green-100"
            />
            {stats.sessions && (
              <StatCard
                title="Aktif Oturum"
                value={stats.sessions.active || 0}
                icon="time"
                color="bg-purple-100"
              />
            )}
            <StatCard
              title="Pasif Kullanıcı"
              value={stats.users.inactive || 0}
              icon="person-outline"
              color="bg-slate-100"
            />
          </View>
        ) : (
          !loading && (
            <View className="mb-4 rounded-xl bg-slate-100 p-4">
              <Text className="text-center text-slate-500">İstatistik verisi yok</Text>
            </View>
          )
        )}

        {stats?.users && getUserChartData().some((d) => d.population > 0) && (
          <Card className="mb-4">
            <Text className="mb-2 text-lg font-bold text-slate-900">Kullanıcı Dağılımı</Text>
            <PieChart
              data={getUserChartData()}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </Card>
        )}

        <Text className="mb-3 ml-1 text-lg font-bold text-slate-900">Hızlı İşlemler</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => navigation.navigate('Users')}
            className="flex-1 flex-row items-center gap-2 rounded-xl bg-primary-600 p-4">
            <Ionicons name="people" size={20} color="white" />
            <Text className="font-bold text-white">Kullanıcılar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Roles')}
            className="flex-1 flex-row items-center gap-2 rounded-xl bg-slate-700 p-4">
            <Ionicons name="key" size={20} color="white" />
            <Text className="font-bold text-white">Roller</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
