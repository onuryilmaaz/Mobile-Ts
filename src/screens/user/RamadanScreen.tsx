import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { prayerService } from '@/services/prayer.service';
import { useTrackerStore } from '@/modules/tracker/tracker.store';
import { useTheme } from '@/hooks/useTheme';
import type { PrayerTimeData } from '@/types/prayer';

const SELECTED_DISTRICT_ID = 'SELECTED_DISTRICT_ID';
const QURAN_TOTAL_PAGES = 604;
const DAILY_TARGET_PAGES = 20;

const RAMADAN_1447_START = new Date('2026-02-19');
const RAMADAN_1447_END = new Date('2026-03-19');
const RAMADAN_1448_START = new Date('2027-02-08');

const DAILY_DHIKRS = [
  'Sübhanallahil azim ve bihamdihi (100×)',
  'Estağfirullah (300×)',
  'La ilahe illallah (200×)',
  "Allahumme inneke afuvvun tuhibbul afve fa'fu anni — sabah & akşam",
];

const PREP_CARDS = [
  {
    icon: 'nutrition-outline' as const,
    title: 'Pazartesi–Perşembe Orucu',
    desc: 'Haftada 2 gün nafile oruç tutarak hazırlan',
    color: '#10b981',
  },
  {
    icon: 'moon-outline' as const,
    title: 'Gece Namazı',
    desc: 'Teheccüd namazı ile gece ibadetine alış',
    color: '#6366f1',
  },
  {
    icon: 'book-outline' as const,
    title: "Kur'an Hatmi Başlat",
    desc: 'Günde 20 sayfa ile 30 günde hatim tamamla',
    color: '#8b5cf6',
  },
];

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRamadanInfo(today: Date) {
  const todayNorm = startOfDay(today);
  const start = startOfDay(RAMADAN_1447_START);
  const end = startOfDay(RAMADAN_1447_END);
  const next = startOfDay(RAMADAN_1448_START);

  const isRamadan = todayNorm >= start && todayNorm <= end;
  const ramadanDay = isRamadan
    ? Math.floor((todayNorm.getTime() - start.getTime()) / 86_400_000) + 1
    : 0;

  const daysUntilRamadan = isRamadan
    ? 0
    : Math.ceil((next.getTime() - todayNorm.getTime()) / 86_400_000);

  return { isRamadan, ramadanDay, daysUntilRamadan };
}

function parseTimeToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return [h, min, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

function getDaysUntilKadir(ramadanDay: number): number {
  return Math.max(0, 27 - ramadanDay);
}

function CircularProgress({
  percent,
  size = 110,
  strokeWidth = 10,
  color = '#14b8a6',
  isDark,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  isDark: boolean;
}) {
  const clampedPct = Math.min(100, Math.max(0, percent));
  const inner = size - strokeWidth * 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
          position: 'absolute',
        }}
      />
      {clampedPct > 0 && (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: clampedPct >= 25 ? color : 'transparent',
            borderRightColor: clampedPct >= 50 ? color : 'transparent',
            borderBottomColor: clampedPct >= 75 ? color : 'transparent',
            borderLeftColor: clampedPct >= 100 ? color : 'transparent',
            position: 'absolute',
            transform: [{ rotate: `${(clampedPct / 100) * 360 - 45}deg` }],
          }}
        />
      )}
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color }}>{Math.round(clampedPct)}%</Text>
      </View>
    </View>
  );
}

function OffSeasonView({
  isDark,
  daysUntilRamadan,
  todayLogs,
  onRefresh,
  isRefreshing,
}: {
  isDark: boolean;
  daysUntilRamadan: number;
  todayLogs: any[];
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const kadirDate = new Date('2026-03-16');
  const kadirStr = kadirDate.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const ramadanStartStr = RAMADAN_1448_START.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#14b8a6" />
      }
      contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#134e4a'] : ['#f0fdf4', '#ccfbf1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24 }}>
        <Animated.View entering={ZoomIn.duration(500)} className="items-center mb-5">
          <View className="w-[100px] h-[100px] rounded-full bg-teal-500/10 dark:bg-teal-500/15 items-center justify-center mb-1">
            <Text className="text-[52px]">🌙</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400)} className="items-center">
          <Text className="text-[13px] font-bold text-teal-500 tracking-[2px] uppercase mb-1">
            Ramazan 1448e
          </Text>
          <Text className="text-[64px] font-black text-slate-950 dark:text-slate-100 leading-[72px]">
            {daysUntilRamadan}
          </Text>
          <Text className="text-xl font-bold text-slate-500 dark:text-slate-400">gün kaldı</Text>
        </Animated.View>
      </LinearGradient>

      <View className="mx-4 -mt-4">
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 mb-3 shadow-sm">
          <Text className="text-xs font-bold text-teal-500 tracking-[1.5px] uppercase mb-4">
            Önemli Tarihler
          </Text>

          <View className="flex-row items-center mb-3.5">
            <View className="w-10 h-10 rounded-xl bg-teal-500/10 items-center justify-center mr-3.5">
              <Ionicons name="moon" size={18} color="#14b8a6" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-extrabold text-slate-950 dark:text-slate-100">
                Ramazan 1448 Başlangıcı
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-px">
                {ramadanStartStr}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3.5">
              <Ionicons name="sparkles" size={18} color="#6366f1" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-extrabold text-slate-950 dark:text-slate-100">
                Kadir Gecesi (1447)
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-px">
                {kadirStr} — 26 Ramazan 1447
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View className="mx-4 mt-1">
        <Text className="text-[17px] font-black text-slate-950 dark:text-slate-100 mb-3">
          Ramazana Hazırlanıyorum
        </Text>
        <Text className="text-[13px] text-slate-500 dark:text-slate-400 mb-4">
          Şimdi ne yapabilirsin?
        </Text>

        {PREP_CARDS.map((card, i) => (
          <Animated.View
            key={card.title}
            entering={FadeInDown.delay(i * 80 + 200).duration(400)}
            className="bg-white dark:bg-slate-950 rounded-[20px] border border-slate-100 dark:border-slate-800 p-4 mb-[10px] flex-row items-center">
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: `${card.color}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
              <Ionicons name={card.icon} size={22} color={card.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-950 dark:text-slate-100 mb-0.5">
                {card.title}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">{card.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          </Animated.View>
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.delay(500).duration(400)}
        className="mx-4 mt-4 bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5">
        <Text className="text-xs font-bold text-indigo-500 tracking-[1.5px] uppercase mb-4">
          Geçen Ramazan
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 items-center">
            <Text className="text-[28px] font-black text-emerald-500">
              {todayLogs.filter((l) => l.activity_type === 'fasting').length > 0
                ? todayLogs.filter((l) => l.activity_type === 'fasting').length
                : '—'}
            </Text>
            <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 text-center">
              Oruç Kaydı
            </Text>
          </View>

          <View className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 items-center">
            <Text className="text-[28px] font-black text-violet-500">
              {todayLogs
                .filter((l) => l.activity_type === 'quran')
                .reduce((s, l) => s + (l.value?.pages ?? 0), 0) || '—'}
            </Text>
            <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 text-center">
              Quran Sayfası
            </Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function RamadanModeView({
  isDark,
  ramadanDay,
  todayLogs,
  logActivity,
  onRefresh,
  isRefreshing,
}: {
  isDark: boolean;
  ramadanDay: number;
  todayLogs: any[];
  logActivity: (type: any, value: any) => Promise<any>;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeData | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);

  const [countdown, setCountdown] = useState('--:--:--');
  const [countdownLabel, setCountdownLabel] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasFastingLog = todayLogs.some((l) => l.activity_type === 'fasting');
  const [fastingLoading, setFastingLoading] = useState(false);

  const hasTeravihLog = todayLogs.some(
    (l) => l.activity_type === 'nafile' && l.value?.type === 'teravih'
  );
  const [teravihLoading, setTeravihLoading] = useState(false);

  const totalQuranPages = todayLogs
    .filter((l) => l.activity_type === 'quran')
    .reduce((s, l) => s + (l.value?.pages ?? 0), 0);
  const hatimPercent = Math.min(100, (totalQuranPages / QURAN_TOTAL_PAGES) * 100);
  const daysToFinish =
    totalQuranPages < QURAN_TOTAL_PAGES
      ? Math.ceil((QURAN_TOTAL_PAGES - totalQuranPages) / DAILY_TARGET_PAGES)
      : 0;

  const todayDhikr = DAILY_DHIKRS[ramadanDay % DAILY_DHIKRS.length];
  const daysUntilKadir = getDaysUntilKadir(ramadanDay);

  useEffect(() => {
    loadPrayerTimes();
  }, []);

  const loadPrayerTimes = async () => {
    try {
      setPrayerLoading(true);
      const districtId = await AsyncStorage.getItem(SELECTED_DISTRICT_ID);
      if (!districtId) return;
      const data = await prayerService.getTodayPrayerTimes(districtId);
      setPrayerTimes(data);
    } catch (e) {
      console.error('Prayer times error:', e);
    } finally {
      setPrayerLoading(false);
    }
  };

  useEffect(() => {
    if (!prayerTimes) return;

    const update = () => {
      const now = new Date();
      const imsakDate = parseTimeToDate(prayerTimes.times.imsak);
      const aksamDate = parseTimeToDate(prayerTimes.times.aksam);

      let target: Date;
      let label: string;

      if (now < imsakDate) {
        target = imsakDate;
        label = `Suhura kalan süre (İmsak: ${prayerTimes.times.imsak})`;
      } else if (now < aksamDate) {
        target = aksamDate;
        label = `İftara kalan süre (Akşam: ${prayerTimes.times.aksam})`;
      } else {
        const nextImsak = new Date(imsakDate);
        nextImsak.setDate(nextImsak.getDate() + 1);
        target = nextImsak;
        label = `Sahura kalan süre (yarın İmsak: ${prayerTimes.times.imsak})`;
      }

      setCountdown(formatCountdown(target.getTime() - now.getTime()));
      setCountdownLabel(label);
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [prayerTimes]);

  const handleLogFasting = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setFastingLoading(true);
      await logActivity('fasting', { type: 'ramazan' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Hata', 'Oruç kaydedilirken bir sorun oluştu.');
    } finally {
      setFastingLoading(false);
    }
  };

  const handleLogTeravih = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setTeravihLoading(true);
      await logActivity('nafile', { type: 'teravih', rakaat: 20 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Hata', 'Teravih kaydedilirken bir sorun oluştu.');
    } finally {
      setTeravihLoading(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#14b8a6" />
      }
      contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#134e4a'] : ['#f0fdf4', '#ccfbf1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 }}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text className="text-xs font-bold text-teal-500 tracking-[2px] uppercase mb-1.5">
            Ramazan-ı Şerif
          </Text>
          <Text className="text-[36px] font-black text-slate-950 dark:text-slate-100 mb-1.5">
            {ramadanDay}. Gün 🌙
          </Text>

          {daysUntilKadir > 0 ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="sparkles" size={14} color="#a78bfa" />
              <Text className="text-[13px] text-violet-400 font-bold">
                Kadir Gecesine {daysUntilKadir} gün kaldı
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="sparkles" size={14} color="#a78bfa" />
              <Text className="text-[13px] text-violet-400 font-bold">
                Kadir Gecesi — Bin aydan hayırlı!
              </Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <View className="mx-4 -mt-3">
        {/* Countdown card */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          className="bg-white dark:bg-slate-950 rounded-[28px] border border-slate-100 dark:border-slate-800 p-[22px] mb-3 shadow-sm">
          {prayerLoading ? (
            <View className="items-center py-3">
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                Vakitler yükleniyor...
              </Text>
            </View>
          ) : prayerTimes ? (
            <>
              <View className="items-center mb-5">
                <Text
                  className="text-[46px] font-black text-teal-500 tracking-[2px]"
                  style={{ fontVariant: ['tabular-nums'] }}>
                  {countdown}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                  {countdownLabel}
                </Text>
              </View>

              <View className="flex-row gap-2.5">
                <View className="flex-1 bg-green-50 dark:bg-slate-800 rounded-2xl p-3.5 items-center">
                  <Ionicons
                    name="moon-outline"
                    size={18}
                    color="#6366f1"
                    style={{ marginBottom: 4 }}
                  />
                  <Text className="text-[11px] font-bold text-indigo-500 uppercase tracking-[1px]">
                    İmsak (Suhur)
                  </Text>
                  <Text className="text-xl font-black text-slate-950 dark:text-slate-100 mt-1">
                    {prayerTimes.times.imsak}
                  </Text>
                </View>
                <View className="flex-1 bg-orange-50 dark:bg-slate-800 rounded-2xl p-3.5 items-center">
                  <Ionicons name="moon" size={18} color="#f59e0b" style={{ marginBottom: 4 }} />
                  <Text className="text-[11px] font-bold text-amber-500 uppercase tracking-[1px]">
                    Akşam (İftar)
                  </Text>
                  <Text className="text-xl font-black text-slate-950 dark:text-slate-100 mt-1">
                    {prayerTimes.times.aksam}
                  </Text>
                </View>
              </View>

              <View className="mt-4 bg-yellow-50 dark:bg-slate-800 rounded-[14px] p-3.5">
                <Text className="text-[11px] font-bold text-amber-500 mb-1.5">İFTAR DUASI</Text>
                <Text className="text-[13px] text-slate-950 dark:text-slate-100 italic leading-5">
                  &ldquo;Allahümme leke sumtü ve bike amentü ve aleyke tevekkeltu ve alâ rızkike
                  eftartü.&rdquo;
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Allah&apos;ım! Senin için oruç tuttum, sana inandım, sana dayandım ve senin
                  rızkınla orucumu açtım.
                </Text>
              </View>
            </>
          ) : (
            <View className="items-center py-2">
              <Ionicons name="location-outline" size={32} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text className="text-slate-500 dark:text-slate-400 text-[13px] mt-2 text-center">
                Namaz vakitleri için konum seçiniz
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Fasting card */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          className={`bg-white dark:bg-slate-950 rounded-[24px] border p-[18px] mb-3 flex-row items-center ${
            hasFastingLog ? 'border-emerald-500/20' : 'border-slate-100 dark:border-slate-800'
          }`}>
          <View
            className={`w-12 h-12 rounded-2xl items-center justify-center mr-3.5 ${
              hasFastingLog ? 'bg-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800'
            }`}>
            <Ionicons
              name={hasFastingLog ? 'checkmark-circle' : 'nutrition-outline'}
              size={24}
              color={hasFastingLog ? '#10b981' : isDark ? '#94a3b8' : '#64748b'}
            />
          </View>

          <View className="flex-1">
            <Text className="text-[15px] font-extrabold text-slate-950 dark:text-slate-100">
              {hasFastingLog ? 'Oruç tutuyorum' : 'Bugünkü Oruç'}
            </Text>
            {hasFastingLog ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <View className="bg-emerald-500 rounded-[6px] px-2 py-0.5">
                  <Text className="text-[11px] font-extrabold text-white">Kaydedildi</Text>
                </View>
              </View>
            ) : (
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-px">
                Ramazan orucunu kaydet
              </Text>
            )}
          </View>

          {!hasFastingLog && (
            <TouchableOpacity
              onPress={handleLogFasting}
              disabled={fastingLoading}
              className="bg-emerald-500 rounded-2xl px-4 py-2.5">
              <Text className="text-[13px] font-extrabold text-white">
                {fastingLoading ? '...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Hatim card */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 mb-3">
          <Text className="text-xs font-bold text-violet-500 tracking-[1.5px] uppercase mb-4">
            Hatim Takibi
          </Text>

          <View className="flex-row items-center gap-5">
            <CircularProgress
              percent={hatimPercent}
              size={110}
              strokeWidth={10}
              color="#8b5cf6"
              isDark={isDark}
            />

            <View className="flex-1">
              <Text className="text-[22px] font-black text-slate-950 dark:text-slate-100">
                {totalQuranPages}
                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {' '}
                  /{QURAN_TOTAL_PAGES} sayfa
                </Text>
              </Text>
              <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                %{hatimPercent.toFixed(1)} tamamlandı
              </Text>

              {daysToFinish > 0 ? (
                <View className="mt-2.5 bg-violet-50 dark:bg-slate-800 rounded-[10px] px-2.5 py-1.5">
                  <Text className="text-xs text-violet-500 font-bold">
                    Günde {DAILY_TARGET_PAGES} sayfayla {daysToFinish} günde biter
                  </Text>
                </View>
              ) : (
                <View className="mt-2.5 bg-violet-500/10 rounded-[10px] px-2.5 py-1.5">
                  <Text className="text-xs text-violet-500 font-extrabold">
                    Hatim tamamlandı! 🎉
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Günün Zikri card */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 p-5 mb-3">
          <View className="flex-row items-center mb-3.5 gap-2.5">
            <View className="w-[38px] h-[38px] rounded-xl bg-cyan-500/10 items-center justify-center">
              <Ionicons name="radio-button-on" size={18} color="#06b6d4" />
            </View>
            <View>
              <Text className="text-xs font-bold text-cyan-500 tracking-[1.5px] uppercase">
                Günün Zikri
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                {ramadanDay}. gün
              </Text>
            </View>
          </View>

          <Text className="text-[15px] font-bold text-slate-950 dark:text-slate-100 leading-[22px]">
            {todayDhikr}
          </Text>
        </Animated.View>

        {/* Teravih card */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          className={`bg-white dark:bg-slate-950 rounded-[24px] border p-[18px] mb-3 flex-row items-center ${
            hasTeravihLog ? 'border-amber-500/20' : 'border-slate-100 dark:border-slate-800'
          }`}>
          <View
            className={`w-12 h-12 rounded-2xl items-center justify-center mr-3.5 ${
              hasTeravihLog ? 'bg-amber-500/10' : 'bg-slate-50 dark:bg-slate-800'
            }`}>
            <Ionicons
              name={hasTeravihLog ? 'star' : 'star-outline'}
              size={24}
              color={hasTeravihLog ? '#f59e0b' : isDark ? '#94a3b8' : '#64748b'}
            />
          </View>

          <View className="flex-1">
            <Text className="text-[15px] font-extrabold text-slate-950 dark:text-slate-100">
              Bu gece Teravih
            </Text>
            {hasTeravihLog ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <View className="bg-amber-500 rounded-[6px] px-2 py-0.5">
                  <Text className="text-[11px] font-extrabold text-white">
                    20 rekat kaydedildi
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-px">
                Teravih namazını kaydet (20 rekat)
              </Text>
            )}
          </View>

          {!hasTeravihLog && (
            <TouchableOpacity
              onPress={handleLogTeravih}
              disabled={teravihLoading}
              className="bg-amber-500 rounded-2xl px-4 py-2.5">
              <Text className="text-[13px] font-extrabold text-white">
                {teravihLoading ? '...' : 'Kıldım'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

export default function RamadanScreen() {
  const { isDark } = useTheme();
  const { todayLogs, fetchTodayLogs, logActivity } = useTrackerStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = new Date();
  const { isRamadan, ramadanDay, daysUntilRamadan } = getRamadanInfo(today);

  const load = useCallback(async () => {
    await fetchTodayLogs();
  }, [fetchTodayLogs]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {isRamadan ? (
        <RamadanModeView
          isDark={isDark}
          ramadanDay={ramadanDay}
          todayLogs={todayLogs}
          logActivity={logActivity}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      ) : (
        <OffSeasonView
          isDark={isDark}
          daysUntilRamadan={daysUntilRamadan}
          todayLogs={todayLogs}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      )}
    </View>
  );
}
