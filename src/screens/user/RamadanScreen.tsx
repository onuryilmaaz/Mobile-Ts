import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { prayerService } from '@/services/prayer.service';
import { calendarService } from '@/services/calendar.service';
import { trackerApi } from '@/modules/tracker/tracker.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { toast } from '@/components/feedback/Toast';
import type { HomeStackParamList } from '@/navigation/types';
import type { PrayerTimeData } from '@/types/prayer';

const DISTRICT_KEY = 'SELECTED_DISTRICT_ID';
const TERAVIH_KEY = 'RAMAZAN_TERAVIH_2026';
const TERAVIH_IDS_KEY = 'RAMAZAN_TERAVIH_IDS_2026';
const DEFAULT_DISTRICT = '9654';

const RAMAZAN_START = new Date('2027-02-08T00:00:00');
const RAMAZAN_END = new Date('2027-03-10T00:00:00');
const KADIR_GECESI = new Date('2027-03-06T00:00:00');

const DAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function getRamazanDay(): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < RAMAZAN_START || today >= RAMAZAN_END) return null;
  return Math.floor((today.getTime() - RAMAZAN_START.getTime()) / 86_400_000) + 1;
}

function parseTimestamp(timeStr: string, baseDate: Date): number {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function formatHMS(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function RamadanScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState<PrayerTimeData[]>([]);
  const [todayData, setTodayData] = useState<PrayerTimeData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [countdownLabel, setCountdownLabel] = useState('');
  const [countdownDone, setCountdownDone] = useState(false);
  // dateKey → done boolean (local + AsyncStorage)
  const [teravihDone, setTeravihDone] = useState<Record<string, boolean>>({});
  // dateKey → tracker log id (for DELETE)
  const [teravihLogIds, setTeravihLogIds] = useState<Record<string, string>>({});

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const todayDataRef = useRef<PrayerTimeData | null>(null);

  const ramazanDay = getRamazanDay();
  const hijri = calendarService.getTodayHijri();
  const daysToKadir = Math.ceil((KADIR_GECESI.getTime() - Date.now()) / 86_400_000);

  const updateCountdown = useCallback(() => {
    const data = todayDataRef.current;
    if (!data) return;

    const now = Date.now();
    const base = new Date(data.date);
    const imsakMs = parseTimestamp(data.times.imsak, base);
    const aksamMs = parseTimestamp(data.times.aksam, base);

    if (now < imsakMs) {
      setCountdownLabel('Sahura Kalan Süre');
      setCountdown(formatHMS(imsakMs - now));
      setCountdownDone(false);
    } else if (now < aksamMs) {
      setCountdownLabel('İftara Kalan Süre');
      setCountdown(formatHMS(aksamMs - now));
      setCountdownDone(false);
    } else {
      setCountdownLabel('İftar Vakti Geçti');
      setCountdown('');
      setCountdownDone(true);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const districtId = (await AsyncStorage.getItem(DISTRICT_KEY)) || DEFAULT_DISTRICT;
        const [{ today, week: w }, teravihRaw, idsRaw] = await Promise.all([
          prayerService.getWeeklyPrayerTimes(districtId),
          AsyncStorage.getItem(TERAVIH_KEY),
          AsyncStorage.getItem(TERAVIH_IDS_KEY),
        ]);
        todayDataRef.current = today;
        setTodayData(today);
        setWeek(w);

        const localDone: Record<string, boolean> = teravihRaw ? JSON.parse(teravihRaw) : {};
        const localIds: Record<string, string> = idsRaw ? JSON.parse(idsRaw) : {};

        // Fetch today's tracker logs from API to get accurate state + log ids
        if (isAuthenticated && today) {
          const todayKey = today.date.split('T')[0] ?? '';
          try {
            const res = await trackerApi.getDateLogs(todayKey);
            const logs: any[] = res.data?.data ?? [];
            const teravihLog = logs.find(
              (l) => l.activity_type === 'nafile' && l.value?.subtype === 'teravih'
            );
            if (teravihLog) {
              localDone[todayKey] = true;
              localIds[todayKey] = teravihLog.id;
            } else {
              // authoritative: if API says no entry, mark as not done
              localDone[todayKey] = false;
              delete localIds[todayKey];
            }
          } catch {}
        }

        setTeravihDone(localDone);
        setTeravihLogIds(localIds);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!todayData) return;
    todayDataRef.current = todayData;
    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [todayData, updateCountdown]);

  const toggleTeravih = async (dateKey: string) => {
    if (ramazanDay === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasDone = !!teravihDone[dateKey];
    const logId = teravihLogIds[dateKey];

    // Optimistic update
    const nextDone = { ...teravihDone, [dateKey]: !wasDone };
    setTeravihDone(nextDone);
    await AsyncStorage.setItem(TERAVIH_KEY, JSON.stringify(nextDone));

    if (!isAuthenticated) return;

    try {
      if (!wasDone) {
        // Create log entry
        const res = await trackerApi.logActivity({
          activity_type: 'nafile',
          value: { subtype: 'teravih', rakaat: 20 },
          date: dateKey,
        });
        const newId = res.data?.data?.id;
        if (newId) {
          const nextIds = { ...teravihLogIds, [dateKey]: newId };
          setTeravihLogIds(nextIds);
          await AsyncStorage.setItem(TERAVIH_IDS_KEY, JSON.stringify(nextIds));
        }
        toast.success('Kaydedildi', 'Teravih namazı kaydedildi.');
      } else if (logId) {
        // Delete log entry
        await trackerApi.deleteLog(logId);
        const nextIds = { ...teravihLogIds };
        delete nextIds[dateKey];
        setTeravihLogIds(nextIds);
        await AsyncStorage.setItem(TERAVIH_IDS_KEY, JSON.stringify(nextIds));
        toast.info('Kaldırıldı', 'Teravih kaydı silindi.');
      }
    } catch {
      // Revert optimistic update
      const reverted = { ...nextDone, [dateKey]: wasDone };
      setTeravihDone(reverted);
      await AsyncStorage.setItem(TERAVIH_KEY, JSON.stringify(reverted));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Hata', 'Kayıt güncellenemedi.');
    }
  };

  const teal = isDark ? '#14b8a6' : '#0f766e';
  const now = new Date();
  const isRamazan = ramazanDay !== null;

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Ramazan" navigation={navigation} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View className="overflow-hidden rounded-3xl bg-teal-700 p-6">
          <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <View className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />
          <Text className="text-[10px] font-black uppercase tracking-[3px] text-white/60">
            {isRamazan ? 'Mübarek Ramazan 1447' : 'Ramazan 1447'}
          </Text>
          <Text className="mt-1 text-4xl font-black text-white">
            {isRamazan ? `${ramazanDay}. Gün` : 'Ramazan Yaklaşıyor'}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-white/70">{hijri}</Text>
          {daysToKadir > 0 && daysToKadir <= 30 && (
            <View className="mt-3 self-start rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1">
              <Text className="text-xs font-bold text-amber-300">
                ✨ Kadir Gecesi'ne {daysToKadir} gün kaldı
              </Text>
            </View>
          )}
          {daysToKadir <= 0 && (
            <View className="mt-3 self-start rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1">
              <Text className="text-xs font-bold text-amber-300">✨ Kadir Gecesi</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={teal} />
            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">Yükleniyor…</Text>
          </View>
        ) : (
          <>
            {/* Countdown */}
            {todayData && (
              <View className="items-center rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <Text className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {countdownLabel}
                </Text>
                {countdownDone ? (
                  <Text className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    🌙 Hayırlı İftarlar
                  </Text>
                ) : (
                  <Text className="text-5xl font-black tabular-nums text-slate-900 dark:text-white">
                    {countdown}
                  </Text>
                )}
              </View>
            )}

            {/* Today imsak / iftar */}
            {todayData && (
              <View>
                <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  BUGÜN
                </Text>
                <View className="flex-row gap-3">
                  <View className="flex-1 items-center rounded-3xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                    <Ionicons name="moon-outline" size={22} color="#818cf8" />
                    <Text className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      İmsak · Sahur
                    </Text>
                    <Text className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                      {todayData.times.imsak}
                    </Text>
                  </View>
                  <View className="flex-1 items-center rounded-3xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                    <Ionicons name="partly-sunny-outline" size={22} color="#fb7185" />
                    <Text className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-400">
                      Akşam · İftar
                    </Text>
                    <Text className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                      {todayData.times.aksam}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Weekly imsakiye */}
            {week.length > 0 && (
              <View>
                <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  HAFTALIK İMSAKİYE
                </Text>
                <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  {/* Table header */}
                  <View className="flex-row border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <Text className="flex-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Gün
                    </Text>
                    <Text className="w-16 text-center text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      İmsak
                    </Text>
                    <Text className="w-16 text-center text-[10px] font-black uppercase tracking-wider text-rose-400">
                      İftar
                    </Text>
                    <Text className="w-10 text-center text-[10px] font-black uppercase tracking-wider text-teal-500">
                      Ter.
                    </Text>
                  </View>

                  {week.map((day, i) => {
                    const dayDate = new Date(day.date);
                    const isToday = dayDate.toDateString() === now.toDateString();
                    const isPast = dayDate < now && !isToday;
                    const dateKey = day.date.split('T')[0] || `day-${i}`;
                    const done = teravihDone[dateKey];
                    const label = `${DAYS_TR[dayDate.getDay()]} ${dayDate.getDate()}/${dayDate.getMonth() + 1}`;

                    return (
                      <View
                        key={day._id || i}
                        className={`flex-row items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800 ${
                          isToday ? 'bg-teal-50 dark:bg-teal-500/10' : ''
                        }`}>
                        <View className="flex-1 flex-row items-center gap-2">
                          {isToday && <View className="h-2 w-2 rounded-full bg-teal-500" />}
                          <Text
                            className={`text-sm font-bold ${
                              isToday
                                ? 'text-teal-700 dark:text-teal-400'
                                : isPast
                                  ? 'text-slate-400 dark:text-slate-600'
                                  : 'text-slate-900 dark:text-white'
                            }`}>
                            {label}
                          </Text>
                        </View>
                        <Text
                          className={`w-16 text-center text-sm font-semibold ${
                            isPast
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                          {day.times.imsak}
                        </Text>
                        <Text
                          className={`w-16 text-center text-sm font-semibold ${
                            isPast
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                          {day.times.aksam}
                        </Text>
                        <TouchableOpacity
                          className="w-10 items-center"
                          hitSlop={8}
                          disabled={!isRamazan}
                          onPress={() => toggleTeravih(dateKey)}>
                          <Ionicons
                            name={done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={
                              !isRamazan
                                ? isDark ? '#1e293b' : '#e2e8f0'
                                : done ? teal : isDark ? '#475569' : '#cbd5e1'
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
