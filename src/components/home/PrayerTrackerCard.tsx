import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { prayerService } from '@/services/prayer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthWallModal } from '@/components/layout/AuthWallModal';
import { useThemeStore } from '@/store/theme.store';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  Layout,
} from 'react-native-reanimated';

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
  const { isDark } = useThemeStore();

  // 🔥 KRİTİK: Tüm component'i saran bir ready state'i
  const [isComponentReady, setIsComponentReady] = useState(false);

  const isMounted = useRef(true);

  // All hooks must be declared before any conditional return
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
    // Component mount olduktan sonra "ready" olarak işaretle
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

  // Progress'i güncelle (sadece ready olduktan sonra)
  useEffect(() => {
    progressWidth.value = withSpring(
      isComponentReady && isAuthenticated ? completedCount / totalCount : 0
    );
  }, [stats, isAuthenticated, isComponentReady]);

  const loadPrayerTimes = async () => {
    try {
      const districtId =
        (await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY)) || DEFAULT_DISTRICT_ID;
      const data = await prayerService.getTodayPrayerTimes(districtId);
      if (data) setPrayerTimes(data.times);
    } catch {}
  };

  // 🔥 Component hazır değilse loading göster (tüm hook'lar çalıştıktan sonra erken dön)
  if (!isComponentReady) {
    return (
      <View
        className={`mx-4 mb-4 overflow-hidden rounded-[28px] border p-8 ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}>
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
    await trackPrayer(prayer.id as any, isKaza);
  };

  return (
    <View
      className={`mx-4 mb-4 overflow-hidden rounded-[28px] border shadow-xl ${
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}>
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
                className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-teal-400' : 'text-teal-100'}`}>
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
                  layout={Layout.springify()}
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
                        : isDark
                          ? 'border-slate-700 bg-slate-700/30'
                          : 'border-slate-200 bg-slate-50'
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
                          : isDark
                            ? 'border-slate-700 bg-slate-700/30'
                            : 'border-slate-200 bg-white'
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
