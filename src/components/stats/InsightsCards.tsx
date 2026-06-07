import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

// ─── WeakestPrayerCard ────────────────────────────────────────────────────────

type ByPrayer = { prayer: string; total: number };

const PRAYER_LABEL: Record<string, string> = {
  fajr: 'Sabah',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

const PRAYER_TIP: Record<string, string> = {
  fajr: 'Yatmadan önce alarm + ezan kur, kapı yanına seccade koy.',
  dhuhr: 'Öğle molasına 5 dk önce başla, telefonu sessize al.',
  asr: 'İş günü ortası — vakit girince hatırlatıcıyı 10 dk önceye çek.',
  maghrib: 'En kısa pencere; vakit girer girmez kıl, geciktirme.',
  isha: 'Uyku öncesi ritüel yap, telefonu yatağın uzağına bırak.',
};

export function WeakestPrayerCard({ data }: { data: ByPrayer[] }) {
  const { isDark } = useTheme();

  // Filter out sunrise, find min
  const filtered = data.filter((d) => d.prayer !== 'sunrise');
  if (filtered.length === 0) return null;

  const weakest = filtered.reduce((min, cur) => (cur.total < min.total ? cur : min));
  const percentage = Math.round((weakest.total / 7) * 100);

  return (
    <View className="mx-4 mb-6 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
      <View className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/10" />
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20">
          <Ionicons name="bulb" size={22} color={isDark ? '#fbbf24' : '#d97706'} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            En Çok Kaçırılan Vakit
          </Text>
          <Text className="mt-0.5 text-xl font-black text-slate-900 dark:text-white">
            {PRAYER_LABEL[weakest.prayer] ?? weakest.prayer}
          </Text>
          <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
            Son 7 günde {weakest.total}/7 ({percentage}%)
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-xs leading-5 text-amber-900/70 dark:text-amber-200/70">
        💡 {PRAYER_TIP[weakest.prayer] ?? 'Bu vakit için bildirimi 15 dk önceye çek.'}
      </Text>
    </View>
  );
}

// ─── MonthlyTrendCard ─────────────────────────────────────────────────────────

type Props = {
  thisMonthPrayers: number;
  lastMonthPrayers: number;
  thisMonthActiveDays: number;
  lastMonthActiveDays: number;
};

export function MonthlyTrendCard({
  thisMonthPrayers,
  lastMonthPrayers,
  thisMonthActiveDays,
  lastMonthActiveDays,
}: Props) {
  const { isDark } = useTheme();

  const prayerDiff = thisMonthPrayers - lastMonthPrayers;
  const dayDiff = thisMonthActiveDays - lastMonthActiveDays;
  const isImproving = prayerDiff >= 0;

  const accent = isImproving ? '#10b981' : '#ef4444';
  const accentDim = isImproving
    ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)'
    : isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.10)';
  const borderColor = isImproving
    ? isDark ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.30)'
    : isDark ? 'rgba(239,68,68,0.30)' : 'rgba(239,68,68,0.30)';

  return (
    <View
      className="mx-4 mb-6 overflow-hidden rounded-3xl border p-5"
      style={{ backgroundColor: accentDim, borderColor }}>
      <View className="flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: isDark ? `${accent}30` : `${accent}25` }}>
          <Ionicons
            name={isImproving ? 'trending-up' : 'trending-down'}
            size={22}
            color={accent}
          />
        </View>
        <View className="flex-1">
          <Text
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: accent }}>
            Aylık Trend
          </Text>
          <Text className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
            {isImproving ? `+${prayerDiff}` : prayerDiff} namaz · {dayDiff >= 0 ? `+${dayDiff}` : dayDiff} aktif gün
          </Text>
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Bu ay {thisMonthPrayers} · Geçen ay {lastMonthPrayers}
          </Text>
        </View>
      </View>
    </View>
  );
}
