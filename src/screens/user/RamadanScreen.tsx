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
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

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
        <Animated.View
          entering={ZoomIn.duration(500)}
          style={{ alignItems: 'center', marginBottom: 20 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}>
            <Text style={{ fontSize: 52 }}>🌙</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#14b8a6',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
            Ramazan 1448e
          </Text>
          <Text
            style={{
              fontSize: 64,
              fontWeight: '900',
              color: isDark ? '#f1f5f9' : '#0f172a',
              lineHeight: 72,
            }}>
            {daysUntilRamadan}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
            gün kaldı
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={{ marginHorizontal: 16, marginTop: -16 }}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: cardBorder,
            padding: 20,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#14b8a6',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
            Önemli Tarihler
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#14b8a615',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
              <Ionicons name="moon" size={18} color="#14b8a6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>
                Ramazan 1448 Başlangıcı
              </Text>
              <Text style={{ fontSize: 12, color: textSecondary, marginTop: 1 }}>
                {ramadanStartStr}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#6366f115',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}>
              <Ionicons name="sparkles" size={18} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: textPrimary }}>
                Kadir Gecesi (1447)
              </Text>
              <Text style={{ fontSize: 12, color: textSecondary, marginTop: 1 }}>
                {kadirStr} — 26 Ramazan 1447
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 4 }}>
        <Text style={{ fontSize: 17, fontWeight: '900', color: textPrimary, marginBottom: 12 }}>
          Ramazana Hazırlanıyorum
        </Text>
        <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>
          Şimdi ne yapabilirsin?
        </Text>

        {PREP_CARDS.map((card, i) => (
          <Animated.View
            key={card.title}
            entering={FadeInDown.delay(i * 80 + 200).duration(400)}
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: cardBorder,
              padding: 16,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
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
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: '800', color: textPrimary, marginBottom: 2 }}>
                {card.title}
              </Text>
              <Text style={{ fontSize: 12, color: textSecondary }}>{card.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={textSecondary} />
          </Animated.View>
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.delay(500).duration(400)}
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          backgroundColor: cardBg,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: cardBorder,
          padding: 20,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: '#6366f1',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}>
          Geçen Ramazan
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#10b981' }}>
              {todayLogs.filter((l) => l.activity_type === 'fasting').length > 0
                ? todayLogs.filter((l) => l.activity_type === 'fasting').length
                : '—'}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: textSecondary,
                marginTop: 2,
                textAlign: 'center',
              }}>
              Oruç Kaydı
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderRadius: 16,
              padding: 16,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#8b5cf6' }}>
              {todayLogs
                .filter((l) => l.activity_type === 'quran')
                .reduce((s, l) => s + (l.value?.pages ?? 0), 0) || '—'}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: textSecondary,
                marginTop: 2,
                textAlign: 'center',
              }}>
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
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? '#1e293b' : '#f1f5f9';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

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
      {/* ── Header Gradient ── */}
      <LinearGradient
        colors={isDark ? ['#0f172a', '#134e4a'] : ['#f0fdf4', '#ccfbf1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24 }}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#14b8a6',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
            Ramazan-ı Şerif
          </Text>
          <Text
            style={{
              fontSize: 36,
              fontWeight: '900',
              color: isDark ? '#f1f5f9' : '#0f172a',
              marginBottom: 6,
            }}>
            {ramadanDay}. Gün 🌙
          </Text>

          {daysUntilKadir > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={14} color="#a78bfa" />
              <Text style={{ fontSize: 13, color: '#a78bfa', fontWeight: '700' }}>
                Kadir Gecesine {daysUntilKadir} gün kaldı
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={14} color="#a78bfa" />
              <Text style={{ fontSize: 13, color: '#a78bfa', fontWeight: '700' }}>
                Kadir Gecesi — Bin aydan hayırlı!
              </Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <View style={{ marginHorizontal: 16, marginTop: -12 }}>
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={{
            backgroundColor: cardBg,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: cardBorder,
            padding: 22,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.35 : 0.08,
            shadowRadius: 10,
            elevation: 4,
          }}>
          {prayerLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: textSecondary, fontSize: 14 }}>Vakitler yükleniyor...</Text>
            </View>
          ) : prayerTimes ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 46,
                    fontWeight: '900',
                    color: '#14b8a6',
                    letterSpacing: 2,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {countdown}
                </Text>
                <Text
                  style={{ fontSize: 12, color: textSecondary, marginTop: 4, textAlign: 'center' }}>
                  {countdownLabel}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? '#1e293b' : '#f0fdf4',
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                  }}>
                  <Ionicons
                    name="moon-outline"
                    size={18}
                    color="#6366f1"
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#6366f1',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                    İmsak (Suhur)
                  </Text>
                  <Text
                    style={{ fontSize: 20, fontWeight: '900', color: textPrimary, marginTop: 4 }}>
                    {prayerTimes.times.imsak}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? '#1e293b' : '#fff7ed',
                    borderRadius: 16,
                    padding: 14,
                    alignItems: 'center',
                  }}>
                  <Ionicons name="moon" size={18} color="#f59e0b" style={{ marginBottom: 4 }} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#f59e0b',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                    Akşam (İftar)
                  </Text>
                  <Text
                    style={{ fontSize: 20, fontWeight: '900', color: textPrimary, marginTop: 4 }}>
                    {prayerTimes.times.aksam}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 16,
                  backgroundColor: isDark ? '#1e293b' : '#fef9e7',
                  borderRadius: 14,
                  padding: 14,
                }}>
                <Text
                  style={{ fontSize: 11, fontWeight: '700', color: '#f59e0b', marginBottom: 6 }}>
                  İFTAR DUASI
                </Text>
                <Text
                  style={{ fontSize: 13, color: textPrimary, fontStyle: 'italic', lineHeight: 20 }}>
                  &ldquo;Allahümme leke sumtü ve bike amentü ve aleyke tevekkeltu ve alâ rızkike
                  eftartü.&rdquo;
                </Text>
                <Text style={{ fontSize: 11, color: textSecondary, marginTop: 6 }}>
                  Allah&apos;ım! Senin için oruç tuttum, sana inandım, sana dayandım ve senin
                  rızkınla orucumu açtım.
                </Text>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Ionicons name="location-outline" size={32} color={textSecondary} />
              <Text
                style={{ color: textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                Namaz vakitleri için konum seçiniz
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: hasFastingLog ? '#10b98130' : cardBorder,
            padding: 18,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: hasFastingLog ? '#10b98120' : isDark ? '#1e293b' : '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
            <Ionicons
              name={hasFastingLog ? 'checkmark-circle' : 'nutrition-outline'}
              size={24}
              color={hasFastingLog ? '#10b981' : textSecondary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary }}>
              {hasFastingLog ? 'Oruç tutuyorum' : 'Bugünkü Oruç'}
            </Text>
            {hasFastingLog ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <View
                  style={{
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>Kaydedildi</Text>
                </View>
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: textSecondary, marginTop: 1 }}>
                Ramazan orucunu kaydet
              </Text>
            )}
          </View>

          {!hasFastingLog && (
            <TouchableOpacity
              onPress={handleLogFasting}
              disabled={fastingLoading}
              style={{
                backgroundColor: '#10b981',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
                {fastingLoading ? '...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: cardBorder,
            padding: 20,
            marginBottom: 12,
          }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#8b5cf6',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
            Hatim Takibi
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <CircularProgress
              percent={hatimPercent}
              size={110}
              strokeWidth={10}
              color="#8b5cf6"
              isDark={isDark}
            />

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: textPrimary }}>
                {totalQuranPages}
                <Text style={{ fontSize: 14, fontWeight: '600', color: textSecondary }}>
                  {' '}
                  /{QURAN_TOTAL_PAGES} sayfa
                </Text>
              </Text>
              <Text style={{ fontSize: 13, color: textSecondary, marginTop: 4 }}>
                %{hatimPercent.toFixed(1)} tamamlandı
              </Text>

              {daysToFinish > 0 ? (
                <View
                  style={{
                    marginTop: 10,
                    backgroundColor: isDark ? '#1e293b' : '#f5f3ff',
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}>
                  <Text style={{ fontSize: 12, color: '#8b5cf6', fontWeight: '700' }}>
                    Günde {DAILY_TARGET_PAGES} sayfayla {daysToFinish} günde biter
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    marginTop: 10,
                    backgroundColor: '#8b5cf620',
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}>
                  <Text style={{ fontSize: 12, color: '#8b5cf6', fontWeight: '800' }}>
                    Hatim tamamlandı! 🎉
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: cardBorder,
            padding: 20,
            marginBottom: 12,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: '#06b6d415',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="radio-button-on" size={18} color="#06b6d4" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#06b6d4',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}>
                Günün Zikri
              </Text>
              <Text style={{ fontSize: 11, color: textSecondary }}>{ramadanDay}. gün</Text>
            </View>
          </View>

          <Text style={{ fontSize: 15, fontWeight: '700', color: textPrimary, lineHeight: 22 }}>
            {todayDhikr}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          style={{
            backgroundColor: cardBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: hasTeravihLog ? '#f59e0b30' : cardBorder,
            padding: 18,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: hasTeravihLog ? '#f59e0b20' : isDark ? '#1e293b' : '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}>
            <Ionicons
              name={hasTeravihLog ? 'star' : 'star-outline'}
              size={24}
              color={hasTeravihLog ? '#f59e0b' : textSecondary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: textPrimary }}>
              Bu gece Teravih
            </Text>
            {hasTeravihLog ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <View
                  style={{
                    backgroundColor: '#f59e0b',
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                    20 rekat kaydedildi
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: textSecondary, marginTop: 1 }}>
                Teravih namazını kaydet (20 rekat)
              </Text>
            )}
          </View>

          {!hasTeravihLog && (
            <TouchableOpacity
              onPress={handleLogTeravih}
              disabled={teravihLoading}
              style={{
                backgroundColor: '#f59e0b',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
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
    <View style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f8fafc' }}>
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
