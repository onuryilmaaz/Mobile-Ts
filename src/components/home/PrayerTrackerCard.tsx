import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { prayerService } from '@/services/prayer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthWallModal } from '@/components/layout/AuthWallModal';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  Layout,
  withTiming,
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

  useEffect(() => {
    loadPrayerTimes();
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  const loadPrayerTimes = async () => {
    try {
      const districtId =
        (await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY)) || DEFAULT_DISTRICT_ID;
      const data = await prayerService.getTodayPrayerTimes(districtId);
      if (data) {
        setPrayerTimes(data.times);
      }
    } catch (e) {
      console.error('Failed to load prayer times for tracker', e);
    }
  };

  const completedCount = stats?.today_prayers?.length || 0;
  const totalCount = PRAYERS.length;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(isAuthenticated ? completedCount / totalCount : 0);
  }, [completedCount, isAuthenticated]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const getPrayerState = (prayer: any) => {
    if (!prayerTimes) return 'loading';

    const now = new Date();
    const [nowH, nowM] = [now.getHours(), now.getMinutes()];
    const nowInMins = nowH * 60 + nowM;

    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startTime = parseTime(prayerTimes[prayer.timeKey]);
    let endTime = prayerTimes[prayer.nextTimeKey]
      ? parseTime(prayerTimes[prayer.nextTimeKey])
      : startTime + 240; // Fallback if no next time

    if (prayer.id === 'isha' && prayerTimes['imsak']) {
      // Isha ends at next day's Fajr
      if (nowInMins >= startTime || nowInMins < parseTime(prayerTimes['imsak'])) {
        return 'current';
      }
      return nowInMins < startTime ? 'upcoming' : 'expired';
    }

    if (nowInMins < startTime) return 'upcoming';
    if (nowInMins >= startTime && nowInMins < endTime) return 'current';
    return 'expired';
  };

  const handleTrack = async (prayer: any) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const state = getPrayerState(prayer);
    if (state === 'upcoming' || stats?.today_prayers?.includes(prayer.id) || isLoading) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const isKaza = state === 'expired';
    if (isKaza) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await trackPrayer(prayer.id as any, isKaza);
  };

  return (
    <View className="mx-4 mb-6 overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-xl shadow-slate-200">
      <AuthWallModal 
        visible={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        title="Namaz Takibi İçin Giriş Yapın"
        description="Namazlarınızı takip etmek, istatistiklerinizi görmek ve manevi karnenizi oluşturmak için lütfen oturum açın."
      />
      
      <TouchableOpacity 
        activeOpacity={isAuthenticated ? 1 : 0.9}
        onPress={() => !isAuthenticated && setShowAuthModal(true)}
      >
        <View className="bg-emerald-600 px-6 py-6">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-white/80">
                Günlük İlerleme
              </Text>
              <Text className="text-2xl font-bold text-white">Namaz Takibi</Text>
            </View>
            <View className="rounded-full border border-white/30 bg-white/20 px-3 py-1">
              <Text className="text-sm font-bold text-white">
                {isAuthenticated ? completedCount : 0} / {totalCount}
              </Text>
            </View>
          </View>

          <View className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <Animated.View className="h-full rounded-full bg-white" style={progressStyle} />
          </View>
        </View>

        <View className="bg-white p-4">
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
                  className={`mb-3 w-[48%] ${!isAuthenticated ? 'opacity-70' : isUpcoming ? 'opacity-40' : 'opacity-100'}`}>
                  <View
                    className={`relative flex-row items-center justify-between rounded-2xl border p-4 ${
                      isTracked
                        ? isKazaLog
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-100 bg-slate-50'
                    }`}>
                    {!isAuthenticated && (
                      <View className="absolute right-2 top-2 z-10">
                        <Ionicons name="lock-closed" size={10} color="#94a3b8" />
                      </View>
                    )}

                    {isKazaLog && (
                      <View className="absolute -right-1 -top-2 z-10 rounded-full bg-orange-500 px-1.5 py-0.5">
                        <Text className="text-[7px] font-black uppercase text-white">Kaza</Text>
                      </View>
                    )}

                    {isAuthenticated && !isTracked && isExpired && (
                      <View className="absolute -right-1 -top-2 z-10 rounded-full bg-slate-400 px-1.5 py-0.5">
                        <Text className="text-[7px] font-black uppercase text-white">Kaza</Text>
                      </View>
                    )}

                    <View className="flex-1">
                      <Text
                        className={`mb-1 text-[10px] font-bold uppercase tracking-tighter ${
                          isTracked
                            ? isKazaLog
                              ? 'text-orange-600'
                              : 'text-emerald-600'
                            : 'text-slate-400'
                        }`}>
                        {prayer.name}
                      </Text>
                      <Text
                        className={`text-sm font-bold ${
                          isTracked
                            ? isKazaLog
                              ? 'text-orange-900'
                              : 'text-emerald-900'
                            : 'text-slate-700'
                        }`}>
                        {time}
                      </Text>
                    </View>

                    <View
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        isTracked
                          ? isKazaLog
                            ? 'bg-orange-200'
                            : 'bg-emerald-200'
                          : 'border border-slate-200 bg-white'
                      }`}>
                      {isLoading && !isTracked ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <Animated.View entering={isTracked ? FadeIn : undefined}>
                          <Ionicons
                            name={isTracked ? 'checkmark' : (prayer.icon as any)}
                            size={20}
                            color={isTracked ? (isKazaLog ? '#ea580c' : '#059669') : '#94a3b8'}
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
