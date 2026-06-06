import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { gamificationApi } from '@/modules/gamification/gamification.api';
import { trackerApi } from '@/modules/tracker/tracker.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from '@/components/feedback/Toast';
import type { HomeStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const PRAYERS = [
  { id: 'fajr',    label: 'Sabah',  icon: 'moon-outline'    as const, color: '#818cf8' },
  { id: 'dhuhr',   label: 'Öğle',   icon: 'sunny'           as const, color: '#fbbf24' },
  { id: 'asr',     label: 'İkindi', icon: 'partly-sunny'    as const, color: '#fb923c' },
  { id: 'maghrib', label: 'Akşam',  icon: 'moon'            as const, color: '#fb7185' },
  { id: 'isha',    label: 'Yatsı',  icon: 'star-outline'    as const, color: '#a78bfa' },
];

type PrayerLog = { id: string; prayer_time: string; is_kaza: boolean };

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayName(d: Date): string {
  return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()];
}

export default function PrayerHistoryEditScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [logs, setLogs] = useState<PrayerLog[]>([]);
  const [trackerLogs, setTrackerLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const dateStr = toDateStr(selectedDate);
  const isToday = dateStr === toDateStr(new Date());

  const loadDate = async (date: Date) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const ds = toDateStr(date);
      const [prayerRes, trackerRes] = await Promise.all([
        gamificationApi.getPrayerLogsForDate(ds),
        trackerApi.getDateLogs(ds),
      ]);
      setLogs(prayerRes.data?.data ?? []);
      setTrackerLogs(trackerRes.data?.data ?? []);
    } catch {
      toast.error('Hata', 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDate(selectedDate);
  }, [selectedDate, isAuthenticated]);

  const isPrayerDone = (prayerId: string) => logs.some((l) => l.prayer_time === prayerId);

  const togglePrayer = async (prayerId: string) => {
    if (updating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUpdating(prayerId);
    const wasDone = isPrayerDone(prayerId);
    try {
      if (wasDone) {
        await gamificationApi.untrackPrayer(prayerId, dateStr);
        setLogs((prev) => prev.filter((l) => l.prayer_time !== prayerId));
      } else {
        await gamificationApi.trackPrayer(prayerId as any, false, dateStr);
        setLogs((prev) => [...prev, { id: `tmp-${Date.now()}`, prayer_time: prayerId, is_kaza: false }]);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'İşlem başarısız.';
      toast.error('Hata', msg);
    } finally {
      setUpdating(null);
    }
  };

  // Last 14 days for date strip
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return d;
  });

  const teal = isDark ? '#14b8a6' : '#0f766e';
  const sub = isDark ? '#64748b' : '#94a3b8';

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Geçmiş Düzenle" navigation={navigation} />

      {/* Date strip */}
      <View className="border-b border-slate-100 bg-white py-2 dark:border-slate-800 dark:bg-slate-950">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {days.map((d) => {
            const isSelected = toDateStr(d) === dateStr;
            const isTodayDate = toDateStr(d) === toDateStr(new Date());
            return (
              <TouchableOpacity
                key={toDateStr(d)}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDate(d);
                }}
                className={`w-14 items-center rounded-2xl px-2 py-2.5 ${
                  isSelected
                    ? 'bg-teal-600 dark:bg-teal-500'
                    : 'bg-slate-100 dark:bg-slate-900'
                }`}>
                <Text
                  className={`text-[10px] font-bold uppercase ${
                    isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  {dayName(d)}
                </Text>
                <Text
                  className={`mt-0.5 text-lg font-black ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}>
                  {d.getDate()}
                </Text>
                {isTodayDate && !isSelected && (
                  <View className="mt-0.5 h-1 w-1 rounded-full bg-teal-500" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* Selected date header */}
        <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <Text className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
            {isToday ? 'Bugün' : 'Geçmiş Gün'}
          </Text>
          <Text className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {selectedDate.toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {logs.length}/5 namaz · {trackerLogs.length} aktivite
          </Text>
        </View>

        {/* Prayer list */}
        <View>
          <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            BEŞ VAKİT
          </Text>
          {loading ? (
            <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={i}
                  className={`flex-row items-center px-4 py-3.5 ${
                    i < 4 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                  }`}>
                  <Skeleton width={40} height={40} radius={14} />
                  <View className="ml-3 flex-1 gap-2">
                    <Skeleton width="40%" height={14} />
                  </View>
                  <Skeleton width={32} height={32} radius={16} />
                </View>
              ))}
            </View>
          ) : (
            <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {PRAYERS.map((p, idx) => {
                const done = isPrayerDone(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => togglePrayer(p.id)}
                    disabled={updating === p.id}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-3.5 ${
                      idx < PRAYERS.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                    }`}>
                    <View
                      className="mr-3 h-10 w-10 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${p.color}20` }}>
                      <Ionicons name={p.icon} size={18} color={p.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-black text-slate-900 dark:text-white">{p.label}</Text>
                      {done && (
                        <Text className="mt-0.5 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                          ✓ Kılındı
                        </Text>
                      )}
                    </View>
                    {updating === p.id ? (
                      <ActivityIndicator size="small" color={teal} />
                    ) : (
                      <View
                        className={`h-8 w-8 items-center justify-center rounded-full ${
                          done ? 'bg-teal-500' : 'border-2 border-slate-300 dark:border-slate-600'
                        }`}>
                        {done && <Ionicons name="checkmark" size={18} color="#fff" />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Tracker activities (read-only summary) */}
        {trackerLogs.length > 0 && (
          <View>
            <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              O GÜNKÜ AKTİVİTELER
            </Text>
            <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <View className="flex-row flex-wrap gap-2">
                {trackerLogs.map((log) => (
                  <View
                    key={log.id}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                    <Text className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {log.activity_type}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
          <View className="flex-row items-start gap-2">
            <Ionicons name="information-circle" size={16} color="#f59e0b" style={{ marginTop: 2 }} />
            <Text className="flex-1 text-[11px] leading-5 text-amber-700 dark:text-amber-300">
              Geçmiş günleri düzeltirken streak ve puanlar da otomatik olarak güncellenir.
              Yeni eklediğin namazlar kaza olarak değil, eski tarihte kılınmış olarak kaydedilir.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
