import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { BarChart } from 'react-native-chart-kit';
import { useThemeStore } from '@/store/theme.store';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Sabah',
  sunrise: 'Güneş',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

const PRAYER_COLORS: Record<string, string> = {
  fajr: '#1e293b',
  sunrise: '#fb923c',
  dhuhr: '#0ea5e9',
  asr: '#f59e0b',
  maghrib: '#4f46e5',
  isha: '#0f172a',
};

const DAY_LABELS: Record<number, string> = { 0: 'Paz', 1: 'Pts', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cts' };

function StatCard({ icon, label, value, color, twBg }: { icon: any; label: string; value: string | number; color: string; twBg: string }) {
  return (
    <View className="mx-1.5 flex-1 items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className={`mb-2 h-10 w-10 items-center justify-center rounded-2xl ${twBg}`}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-xl font-black text-slate-900 dark:text-white">{value}</Text>
      <Text className="mt-0.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { stats, weeklyStats, monthlyStats, fetchWeeklyStats, fetchMonthlyStats, fetchStats } =
    useGamificationStore();
  const [loading, setLoading] = useState(false);
  const { isDark } = useThemeStore();

  const load = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchWeeklyStats(), fetchMonthlyStats()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const buildWeeklyChartData = () => {
    if (!weeklyStats?.daily) return null;

    const today = new Date();
    const labels: string[] = [];
    const prayerCounts: number[] = [];
    const kazaCounts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = weeklyStats.daily.find((r: any) => r.date?.split('T')[0] === dateStr);

      labels.push(DAY_LABELS[d.getDay()]);
      prayerCounts.push(dayData ? Number(dayData.prayer_count) : 0);
      kazaCounts.push(dayData ? Number(dayData.kaza_count) : 0);
    }

    return { labels, prayerCounts, kazaCounts };
  };

  const buildPrayerBreakdown = () => {
    if (!weeklyStats?.byPrayerTime) return [];
    return weeklyStats.byPrayerTime.map((r: any) => ({
      prayer: r.prayer_time,
      total: Number(r.total),
      kaza: Number(r.kaza_count),
      percentage: Math.round((Number(r.total) / 7) * 100),
    }));
  };

  const weeklyData = buildWeeklyChartData();
  const breakdown = buildPrayerBreakdown();

  const totalMonthPrayers = Number(monthlyStats?.totals?.total_prayers || 0);
  const totalMonthKaza = Number(monthlyStats?.totals?.total_kaza || 0);
  const activeDays = Number(monthlyStats?.totals?.active_days || 0);
  const completionRate = activeDays > 0 ? Math.round((totalMonthPrayers / (activeDays * 5)) * 100) : 0;

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={load}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
            colors={[isDark ? '#14b8a6' : '#0f766e']}
          />
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>

        <View className="mb-6 px-4">
          <Text className="mb-3 text-lg font-black text-slate-900 dark:text-white">30 Günlük Özet</Text>
          <View className="flex-row">
            <StatCard icon="sunny" label="Toplam Namaz" value={totalMonthPrayers} color={isDark ? '#34d399' : '#0f766e'} twBg="bg-teal-50 dark:bg-teal-500/10" />
            <StatCard icon="flame" label="Aktif Gün" value={activeDays} color="#f59e0b" twBg="bg-amber-50 dark:bg-amber-500/10" />
            <StatCard icon="checkmark-circle" label="Tamamlama" value={`%${completionRate}`} color={isDark ? '#818cf8' : '#6366f1'} twBg="bg-indigo-50 dark:bg-indigo-500/10" />
          </View>
        </View>

        {weeklyData && (
          <View className="mx-4 mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Text className="mb-4 text-base font-black text-slate-900 dark:text-white">Haftalık Namaz Grafiği</Text>
            <BarChart
              data={{
                labels: weeklyData.labels,
                datasets: [{ data: weeklyData.prayerCounts }],
              }}
              width={CHART_WIDTH - 32}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              withInnerLines={false}
              chartConfig={{
                backgroundGradientFrom: isDark ? '#0f172a' : '#ffffff',
                backgroundGradientTo: isDark ? '#0f172a' : '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => isDark ? `rgba(45, 212, 191, ${opacity})` : `rgba(15, 118, 110, ${opacity})`,
                labelColor: () => isDark ? '#94a3b8' : '#64748b',
                barPercentage: 0.6,
                propsForLabels: { fontSize: 11, fontWeight: '600' },
              }}
              style={{ borderRadius: 12, marginLeft: -16 }}
            />
            <View className="mt-2 flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full bg-teal-600 dark:bg-teal-500" />
              <Text className="text-xs text-slate-500 dark:text-slate-400">Kılınan namaz sayısı (max 5)</Text>
            </View>
          </View>
        )}

        <View className="mx-4 mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Text className="mb-1 text-base font-black text-slate-900 dark:text-white">Vakit Bazlı Analiz</Text>
          <Text className="mb-4 text-xs text-slate-500 dark:text-slate-400">Son 7 gün — Hangi vakitte daha başarılısın?</Text>

          {breakdown.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="bar-chart-outline" size={36} color={isDark ? 'rgba(240,244,255,0.1)' : '#94a3b8'} />
              <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">Henüz yeterli veri yok</Text>
            </View>
          ) : (
            breakdown.map((item: any) => (
              <View key={item.prayer} className="mb-4">
                <View className="mb-1.5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: PRAYER_COLORS[item.prayer] || '#0f766e' }} />
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{PRAYER_LABELS[item.prayer] || item.prayer}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {item.kaza > 0 && (
                      <View className="rounded-full bg-orange-50 px-2 py-0.5 dark:bg-orange-500/15">
                        <Text className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{item.kaza} Kaza</Text>
                      </View>
                    )}
                    <Text className="text-sm font-black text-slate-900 dark:text-white">{item.total}/7</Text>
                  </View>
                </View>
                <View className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: PRAYER_COLORS[item.prayer] || '#0f766e',
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View className="mx-4 mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Text className="mb-4 text-base font-black text-slate-900 dark:text-white">Genel Bilgiler</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: 'Toplam Puan', value: stats?.total_points || 0, icon: 'star', color: '#fbbf24' },
              { label: 'Mevcut Seri', value: `${stats?.current_streak || 0} gün`, icon: 'flame', color: '#ef4444' },
              { label: 'En Yüksek Seri', value: `${stats?.highest_streak || 0} gün`, icon: 'trophy', color: '#f59e0b' },
              { label: 'Seviye', value: stats?.level?.name || 'Başlangıç', icon: 'shield', color: '#6366f1' },
            ].map((item) => (
              <View key={item.label} className="w-[47%] rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <View className="mb-1 flex-row items-center gap-2">
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{item.label}</Text>
                </View>
                <Text className="text-base font-black text-slate-900 dark:text-white">{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}
