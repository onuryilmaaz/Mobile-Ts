/* eslint-disable react-hooks/exhaustive-deps */
import { View, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { prayerService } from '@/services/prayer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthWallModal } from '@/components/layout/AuthWallModal';
import { useTheme } from '@/hooks/useTheme';
import { liveActivityService } from '@/modules/liveActivity/liveActivity.service';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  useSharedValue,
  LinearTransition,
} from 'react-native-reanimated';

function StreakCelebration({
  visible,
  streak,
  isDark,
  onDismiss,
}: {
  visible: boolean;
  streak: number;
  isDark: boolean;
  onDismiss: () => void;
}) {
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      cardScale.value = withSequence(
        withSpring(1.06, { damping: 7, stiffness: 220 }),
        withSpring(1, { damping: 14 }),
      );
      cardOpacity.value = withTiming(1, { duration: 200 });
      ringScale.value = withDelay(150, withSpring(1, { damping: 8, stiffness: 180 }));
      glowOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

      const t = setTimeout(onDismiss, 3000);
      return () => clearTimeout(t);
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.8, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onDismiss}>
        <Animated.View
          style={[
            {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.88)',
              justifyContent: 'center',
              alignItems: 'center',
            },
            overlayStyle,
          ]}>
          {/* glow halo */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 260,
                height: 260,
                borderRadius: 130,
                backgroundColor: 'rgba(20,184,166,0.12)',
              },
              glowStyle,
            ]}
          />

          <Animated.View
            style={[
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderRadius: 36,
                paddingHorizontal: 40,
                paddingVertical: 44,
                alignItems: 'center',
                width: '82%',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(20,184,166,0.25)' : 'rgba(20,184,166,0.2)',
                shadowColor: '#14b8a6',
                shadowOpacity: 0.4,
                shadowRadius: 32,
                elevation: 20,
              },
              cardStyle,
            ]}>
            {/* moon */}
            <Animated.View entering={ZoomIn.delay(100).duration(400)}>
              <Text style={{ fontSize: 58, marginBottom: 16 }}>🌙</Text>
            </Animated.View>

            {/* title */}
            <Animated.Text
              entering={FadeInDown.delay(180).duration(350)}
              style={{
                fontSize: 17,
                fontWeight: '800',
                color: '#14b8a6',
                letterSpacing: 0.4,
                marginBottom: 24,
                textAlign: 'center',
              }}>
              Tüm Namazlar Tamamlandı!
            </Animated.Text>

            {/* streak ring */}
            <Animated.View
              style={[
                {
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  borderWidth: 3,
                  borderColor: '#14b8a6',
                  backgroundColor: 'rgba(20,184,166,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  shadowColor: '#14b8a6',
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 8,
                },
                ringStyle,
              ]}>
              <Text
                style={{ fontSize: 34, fontWeight: '900', color: '#14b8a6', lineHeight: 38 }}>
                {streak}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: '#14b8a6',
                  letterSpacing: 1.5,
                }}>
                GÜN
              </Text>
            </Animated.View>

            {/* subtitle */}
            <Animated.Text
              entering={FadeInDown.delay(300).duration(350)}
              style={{
                fontSize: 14,
                color: isDark ? '#94a3b8' : '#64748b',
                textAlign: 'center',
                lineHeight: 21,
              }}>
              Serini{' '}
              <Text style={{ fontWeight: '900', color: '#f59e0b' }}>{streak}</Text>{' '}
              güne taşıdın. Mâşâllah!
            </Animated.Text>

            <Animated.Text
              entering={FadeIn.delay(600).duration(400)}
              style={{
                fontSize: 11,
                color: isDark ? '#334155' : '#cbd5e1',
                marginTop: 20,
              }}>
              Dokunarak kapat
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';
const DEFAULT_DISTRICT_ID = '9654';

const PRAYERS = [
  { id: 'fajr', name: 'Sabah', icon: 'sunny-outline', timeKey: 'imsak', nextTimeKey: 'gunes' },
  { id: 'dhuhr', name: 'Öğle', icon: 'sunny', timeKey: 'ogle', nextTimeKey: 'ikindi' },
  { id: 'asr', name: 'İkindi', icon: 'partly-sunny', timeKey: 'ikindi', nextTimeKey: 'aksam' },
  { id: 'maghrib', name: 'Akşam', icon: 'moon', timeKey: 'aksam', nextTimeKey: 'yatsi' },
  { id: 'isha', name: 'Yatsı', icon: 'star-outline', timeKey: 'yatsi', nextTimeKey: 'imsak_next' },
] as const;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function PrayerTrackerCard() {
  const { stats, fetchStats, trackPrayer, isLoading } = useGamificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isDark } = useTheme();

  const [isComponentReady, setIsComponentReady] = useState(false);

  const isMounted = useRef(true);

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);

  const completedCount = stats?.today_prayers?.length || 0;
  const totalCount = PRAYERS.length;
  const progressWidth = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsComponentReady(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isComponentReady) return;

    const loadData = async () => {
      try {
        await loadPrayerTimes();
        if (isAuthenticated && isMounted.current) {
          await fetchStats();
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [isComponentReady, isAuthenticated, fetchStats]);

  useEffect(() => {
    progressWidth.value = withSpring(
      isComponentReady && isAuthenticated ? completedCount / totalCount : 0
    );
  }, [stats, isAuthenticated, isComponentReady]);

  useEffect(() => {
    if (!stats) return;
    liveActivityService.updatePrayerTrackerData({
      completedPrayers: stats.today_prayers ?? [],
      kazaPrayers: stats.kaza_prayers ?? [],
      date: new Date().toISOString().slice(0, 10),
    });
  }, [stats]);

  const loadPrayerTimes = async () => {
    try {
      const districtId =
        (await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY)) || DEFAULT_DISTRICT_ID;
      const data = await prayerService.getTodayPrayerTimes(districtId);
      if (data) setPrayerTimes(data.times);
    } catch {}
  };

  if (!isComponentReady) {
    return (
      <View
        className="mx-4 mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#0f766e'} />
        <Text className="mt-3 text-center text-slate-500 dark:text-slate-400">Yükleniyor...</Text>
      </View>
    );
  }

  const getPrayerState = (prayer: any) => {
    if (!prayerTimes) return 'loading';
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const parse = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const start = parse(prayerTimes[prayer.timeKey]);
    const end = prayerTimes[prayer.nextTimeKey]
      ? parse(prayerTimes[prayer.nextTimeKey])
      : start + 240;

    if (prayer.id === 'isha' && prayerTimes['imsak']) {
      if (nowMin >= start || nowMin < parse(prayerTimes['imsak'])) return 'current';
      return nowMin < start ? 'upcoming' : 'expired';
    }
    if (nowMin < start) return 'upcoming';
    if (nowMin >= start && nowMin < end) return 'current';
    return 'expired';
  };

  const handleTrack = async (prayer: any) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!isMounted.current) return; // Component unmount olduysa yapma

    const state = getPrayerState(prayer);
    if (state === 'upcoming' || stats?.today_prayers?.includes(prayer.id) || isLoading) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const isKaza = state === 'expired';
    Haptics.notificationAsync(
      isKaza ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );

    // Capture streak BEFORE the API call — the store will overwrite stats via fetchStats inside trackPrayer
    const prevStreak = Number(stats?.current_streak ?? 0);

    try {
      const result = await trackPrayer(prayer.id as any, isKaza);
      const newStreak = Number(result?.stats?.current_streak ?? 0);
      const todayCount = Number(result?.stats?.today_prayers_count ?? 0);

      if (todayCount >= 5 && newStreak > prevStreak) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCelebrationStreak(newStreak);
        setShowCelebration(true);
      }
    } catch (e: any) {
      if (e?.response?.status === 400) {
        fetchStats();
      }
    }
  };

  return (
    <View
      className="mx-4 mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <StreakCelebration
        visible={showCelebration}
        streak={celebrationStreak}
        isDark={isDark}
        onDismiss={() => setShowCelebration(false)}
      />
      <AuthWallModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Namaz Takibi İçin Giriş Yapın"
        description="Namazlarınızı takip etmek ve manevi karnenizi oluşturmak için lütfen oturum açın."
      />

      <TouchableOpacity
        activeOpacity={isAuthenticated ? 1 : 0.85}
        onPress={() => !isAuthenticated && setShowAuthModal(true)}>
        <View
          className="px-5 pb-5 pt-5"
          style={{ backgroundColor: isDark ? '#0c4a3e' : '#0f766e' }}>
          <View
            className="absolute -right-[30px] -top-[30px] h-[100px] w-[100px] rounded-full"
            style={{
              backgroundColor: isDark ? 'rgba(45, 212, 191, 0.08)' : 'rgba(255, 255, 255, 0.1)',
            }}
          />

          <View className="mb-3.5 flex-row items-center justify-between">
            <View>
              <Text
                className="text-[9px] font-black uppercase tracking-widest text-teal-100 dark:text-teal-400">
                Günlük İlerleme
              </Text>
              <Text className="mt-0.5 text-[22px] font-black text-white">Namaz Takibi</Text>
            </View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5">
              <Text className="text-[15px] font-black text-white">
                {isAuthenticated ? completedCount : 0} / {totalCount}
              </Text>
            </View>
          </View>

          <View className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <Animated.View
              style={[
                {
                  height: '100%',
                  borderRadius: 99,
                  backgroundColor: '#14b8a6',
                  shadowColor: '#14b8a6',
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                },
                progressStyle,
              ]}
            />
          </View>
        </View>

        <View className="p-3.5">
          <View className="flex-row flex-wrap justify-between">
            {PRAYERS.map((prayer) => {
              const isTracked = isAuthenticated && stats?.today_prayers?.includes(prayer.id);
              const isKazaLog = isAuthenticated && stats?.kaza_prayers?.includes(prayer.id);
              const time = prayerTimes ? prayerTimes[prayer.timeKey] : '--:--';
              const state = getPrayerState(prayer);
              const isUpcoming = state === 'upcoming';
              const isExpired = state === 'expired';

              return (
                <AnimatedTouchableOpacity
                  key={prayer.id}
                  layout={LinearTransition.springify()}
                  disabled={isTracked || (isAuthenticated && isUpcoming) || isLoading}
                  onPress={() => handleTrack(prayer)}
                  activeOpacity={0.7}
                  className={`mb-2.5 w-[48%] ${isAuthenticated && isUpcoming ? 'opacity-40' : 'opacity-100'}`}>
                  <View
                    className={`relative flex-row items-center justify-between rounded-[18px] border p-3.5 ${
                      isTracked
                        ? isKazaLog
                          ? 'border-orange-500/50 bg-orange-500/10 shadow-sm shadow-orange-500/30'
                          : 'border-teal-500/50 bg-teal-500/10 shadow-sm shadow-teal-500/30'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/30'
                    }`}>
                    {(isKazaLog || (isAuthenticated && !isTracked && isExpired)) && (
                      <View
                        className={`absolute -right-1.5 -top-1.5 z-10 rounded-full px-1.5 py-0.5 ${isKazaLog ? 'bg-orange-500' : 'bg-white/25'}`}>
                        <Text className="text-[7px] font-black uppercase tracking-wider text-white">
                          Kaza
                        </Text>
                      </View>
                    )}

                    {!isAuthenticated && (
                      <View className="absolute right-2 top-2 z-10">
                        <Ionicons
                          name="lock-closed"
                          size={10}
                          color={isDark ? 'rgba(240,244,255,0.25)' : 'rgba(0,0,0,0.20)'}
                        />
                      </View>
                    )}

                    <View className="flex-1">
                      <Text
                        className={`mb-1 text-[9px] font-black uppercase tracking-widest ${
                          isTracked
                            ? isKazaLog
                              ? 'text-orange-500'
                              : 'text-teal-500'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}>
                        {prayer.name}
                      </Text>
                      <Text
                        className={`text-[15px] font-black ${
                          isTracked
                            ? isKazaLog
                              ? 'text-orange-700 dark:text-orange-200'
                              : 'text-teal-700 dark:text-teal-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {time}
                      </Text>
                    </View>

                    <View
                      className={`h-[38px] w-[38px] items-center justify-center rounded-full border ${
                        isTracked
                          ? isKazaLog
                            ? 'border-orange-500/40 bg-orange-500/25'
                            : 'border-teal-500/35 bg-teal-500/20'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-700/30'
                      }`}>
                      {isLoading && !isTracked ? (
                        <ActivityIndicator size="small" color="#14b8a6" />
                      ) : (
                        <Animated.View entering={isTracked ? FadeIn : undefined}>
                          <Ionicons
                            name={isTracked ? 'checkmark' : (prayer.icon as any)}
                            size={18}
                            color={
                              isTracked
                                ? isKazaLog
                                  ? '#f97316'
                                  : '#14b8a6'
                                : isDark
                                  ? 'rgba(240,244,255,0.22)'
                                  : 'rgba(0,0,0,0.15)'
                            }
                          />
                        </Animated.View>
                      )}
                    </View>
                  </View>
                </AnimatedTouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
