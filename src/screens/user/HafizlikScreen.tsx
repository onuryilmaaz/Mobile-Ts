import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { useHifzStore } from '@/modules/hifz/hifz.store';
import { quranService, type Surah } from '@/services/quran.service';
import type { HifzStatus } from '@/modules/hifz/hifz.api';
import type { SurahsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SurahsStackParamList>;

const STATUS_META: Record<HifzStatus, { label: string; color: string; bg: string; bgDark: string }> = {
  in_progress: { label: 'Devam',     color: '#f59e0b', bg: '#fef3c7', bgDark: '#f59e0b30' },
  reviewing:   { label: 'Tekrar',    color: '#a78bfa', bg: '#ede9fe', bgDark: '#a78bfa30' },
  memorized:   { label: 'Ezberlendi', color: '#10b981', bg: '#d1fae5', bgDark: '#10b98130' },
};

type FilterMode = 'all' | HifzStatus;

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'all',         label: 'Tümü' },
  { value: 'memorized',   label: 'Ezberlenenler' },
  { value: 'in_progress', label: 'Devam Eden' },
  { value: 'reviewing',   label: 'Tekrar' },
];

export default function HafizlikScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const { rows, loaded, load } = useHifzStore();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    (async () => {
      load();
      try {
        const data = await quranService.getSurahs();
        setSurahs(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusMap = useMemo(() => {
    const m = new Map<number, HifzStatus>();
    for (const r of rows) m.set(r.surah_id, r.status);
    return m;
  }, [rows]);

  const counts = useMemo(() => {
    let memorized = 0, in_progress = 0, reviewing = 0;
    for (const r of rows) {
      if (r.status === 'memorized') memorized++;
      else if (r.status === 'reviewing') reviewing++;
      else in_progress++;
    }
    return { memorized, in_progress, reviewing };
  }, [rows]);

  const filteredSurahs = useMemo(() => {
    if (filter === 'all') return surahs;
    return surahs.filter((s) => statusMap.get(s.id) === filter);
  }, [surahs, statusMap, filter]);

  const overallPct = surahs.length > 0 ? counts.memorized / surahs.length : 0;
  const teal = isDark ? '#14b8a6' : '#0f766e';

  if (loading || !loaded) {
    return (
      <Screen safeAreaEdges={['left', 'right']}>
        <StandardHeader title="Hafızlık" navigation={navigation as any} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={teal} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Hafızlık" navigation={navigation as any} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}>

        {/* Overall progress */}
        <View className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <View className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10" />
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
              <Ionicons name="library" size={22} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                İlerleme
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
                {counts.memorized}/{surahs.length}
                <Text className="text-sm font-bold text-emerald-500"> sure</Text>
              </Text>
            </View>
            <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              %{Math.round(overallPct * 100)}
            </Text>
          </View>
          {/* Progress bar */}
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-200/40 dark:bg-emerald-500/20">
            <View className="h-full rounded-full bg-emerald-500" style={{ width: `${overallPct * 100}%` }} />
          </View>
          <View className="mt-3 flex-row gap-4">
            <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ✓ {counts.memorized} ezberlendi
            </Text>
            {counts.in_progress > 0 && (
              <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                ↻ {counts.in_progress} devam
              </Text>
            )}
            {counts.reviewing > 0 && (
              <Text className="text-[11px] font-bold text-violet-500">
                🔁 {counts.reviewing} tekrar
              </Text>
            )}
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f.value); }}
              className={`rounded-xl border px-3 py-2 ${
                filter === f.value
                  ? 'border-teal-500 bg-teal-50 dark:border-teal-500/60 dark:bg-teal-500/15'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}>
              <Text className={`text-xs font-black ${
                filter === f.value ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'
              }`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 114 surah grid */}
        <View className="rounded-3xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row flex-wrap gap-1.5">
            {filteredSurahs.map((surah) => {
              const status = statusMap.get(surah.id);
              const meta = status ? STATUS_META[status] : null;
              return (
                <TouchableOpacity
                  key={surah.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('SurahDetail', { surahId: surah.id, surahName: surah.name } as any);
                  }}
                  className="items-center justify-center rounded-xl border"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: meta
                      ? (isDark ? meta.bgDark : meta.bg)
                      : (isDark ? '#0f172a' : '#f8fafc'),
                    borderColor: meta ? meta.color : (isDark ? '#1e293b' : '#e2e8f0'),
                  }}>
                  <Text
                    className="text-xs font-black"
                    style={{ color: meta ? meta.color : (isDark ? '#64748b' : '#94a3b8') }}>
                    {surah.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {filteredSurahs.length === 0 && (
            <View className="items-center py-8">
              <Ionicons name="filter-outline" size={28} color={isDark ? '#475569' : '#94a3b8'} />
              <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400">Bu filtrede sure yok</Text>
            </View>
          )}
        </View>

        {/* Legend */}
        <View className="flex-row flex-wrap gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
          {(Object.entries(STATUS_META) as [HifzStatus, typeof STATUS_META.memorized][]).map(([key, meta]) => (
            <View key={key} className="flex-row items-center gap-1.5">
              <View
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: isDark ? meta.bgDark : meta.bg, borderColor: meta.color }}
              />
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{meta.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
