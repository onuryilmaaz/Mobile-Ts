import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { BarChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/constants/theme';

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

function StatCard({ icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const { colors, isDark } = useAppTheme();
  return (
    <View style={{ flex: 1, marginHorizontal: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
      <View style={{ marginBottom: 8, height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: `${color}18` }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ marginTop: 2, textAlign: 'center', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { stats, weeklyStats, monthlyStats, fetchWeeklyStats, fetchMonthlyStats, fetchStats } =
    useGamificationStore();
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useAppTheme();

  const load = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchWeeklyStats(), fetchMonthlyStats()]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Build weekly bar chart data (last 7 days)
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

  // Build prayer time breakdown
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
    <Screen  safeAreaEdges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>

        {/* Monthly Overview Cards */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ marginBottom: 12, fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>30 Günlük Özet</Text>
          <View style={{ flexDirection: 'row' }}>
            <StatCard icon="sunny" label="Toplam Namaz" value={totalMonthPrayers} color={isDark ? '#34d399' : '#0f766e'} />
            <StatCard icon="flame" label="Aktif Gün" value={activeDays} color="#f59e0b" />
            <StatCard icon="checkmark-circle" label="Tamamlama" value={`%${completionRate}`} color={isDark ? '#818cf8' : '#6366f1'} />
          </View>
        </View>

        {/* Weekly Bar Chart */}
        {weeklyData && (
          <View style={{ marginHorizontal: 16, marginBottom: 24, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text style={{ marginBottom: 16, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Haftalık Namaz Grafiği</Text>
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
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => isDark ? `rgba(20, 184, 166, ${opacity})` : `rgba(15, 118, 110, ${opacity})`,
                labelColor: () => colors.textMuted,
                barPercentage: 0.6,
                propsForLabels: { fontSize: 11, fontWeight: '600' },
              }}
              style={{ borderRadius: 12, marginLeft: -16 }}
            />
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: colors.teal }} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Kılınan namaz sayısı (max 5)</Text>
            </View>
          </View>
        )}

        {/* Prayer Time Breakdown */}
        <View style={{ marginHorizontal: 16, marginBottom: 24, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          <Text style={{ marginBottom: 16, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Vakit Bazlı Analiz</Text>
          <Text style={{ marginBottom: 16, fontSize: 12, color: colors.textMuted }}>Son 7 gün — Hangi vakitte daha başarılısın?</Text>

          {breakdown.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Ionicons name="bar-chart-outline" size={36} color={colors.textMuted} />
              <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary }}>Henüz yeterli veri yok</Text>
            </View>
          ) : (
            breakdown.map((item: any) => (
              <View key={item.prayer} style={{ marginBottom: 16 }}>
                <View style={{ marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: PRAYER_COLORS[item.prayer] || colors.teal }} />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}>{PRAYER_LABELS[item.prayer] || item.prayer}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {item.kaza > 0 && (
                      <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#ffedd5', paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#fdba74' : '#ea580c' }}>{item.kaza} Kaza</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{item.total}/7</Text>
                  </View>
                </View>
                <View style={{ height: 10, overflow: 'hidden', borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                  <View
                    style={{
                      height: '100%', borderRadius: 99,
                      width: `${item.percentage}%`,
                      backgroundColor: PRAYER_COLORS[item.prayer] || colors.teal,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Streak & Points */}
        <View style={{ marginHorizontal: 16, marginBottom: 24, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          <Text style={{ marginBottom: 16, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Genel Bilgiler</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Toplam Puan', value: stats?.total_points || 0, icon: 'star', color: '#fbbf24' },
              { label: 'Mevcut Seri', value: `${stats?.current_streak || 0} gün`, icon: 'flame', color: '#ef4444' },
              { label: 'En Yüksek Seri', value: `${stats?.highest_streak || 0} gün`, icon: 'trophy', color: '#f59e0b' },
              { label: 'Seviye', value: stats?.level?.name || 'Başlangıç', icon: 'shield', color: '#6366f1' },
            ].map((item) => (
              <View key={item.label} style={{ width: '47%', borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.settingsBg, padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Ionicons name={item.icon as any} size={14} color={item.color} />
                  <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>{item.label}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}
