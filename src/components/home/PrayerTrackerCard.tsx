import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { prayerService } from '@/services/prayer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthWallModal } from '@/components/layout/AuthWallModal';
import type { RootStackParamList } from '@/navigation/types';
import { useAppTheme } from '@/constants/theme';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  Layout,
} from 'react-native-reanimated';

const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';
const DEFAULT_DISTRICT_ID     = '9654';

const PRAYERS = [
  { id: 'fajr',    name: 'Sabah',  icon: 'sunny-outline',  timeKey: 'imsak',  nextTimeKey: 'gunes'     },
  { id: 'dhuhr',   name: 'Öğle',   icon: 'sunny',          timeKey: 'ogle',   nextTimeKey: 'ikindi'    },
  { id: 'asr',     name: 'İkindi', icon: 'partly-sunny',   timeKey: 'ikindi', nextTimeKey: 'aksam'     },
  { id: 'maghrib', name: 'Akşam',  icon: 'moon',           timeKey: 'aksam',  nextTimeKey: 'yatsi'     },
  { id: 'isha',    name: 'Yatsı',  icon: 'star-outline',   timeKey: 'yatsi',  nextTimeKey: 'imsak_next'},
] as const;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Glow colors per prayer state
const KAZA_COLOR    = '#f97316';
const DONE_COLOR    = '#14b8a6';
const DEFAULT_COLOR = 'rgba(255,255,255,0.25)';

export function PrayerTrackerCard() {
  const { stats, fetchStats, trackPrayer, isLoading } = useGamificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [prayerTimes, setPrayerTimes]   = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    loadPrayerTimes();
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, fetchStats]);

  const loadPrayerTimes = async () => {
    try {
      const districtId = (await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY)) || DEFAULT_DISTRICT_ID;
      const data = await prayerService.getTodayPrayerTimes(districtId);
      if (data) setPrayerTimes(data.times);
    } catch {}
  };

  const completedCount = stats?.today_prayers?.length || 0;
  const totalCount     = PRAYERS.length;
  const progressWidth  = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(isAuthenticated ? completedCount / totalCount : 0);
  }, [completedCount, isAuthenticated]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const getPrayerState = (prayer: any) => {
    if (!prayerTimes) return 'loading';
    const now   = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const parse  = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const start  = parse(prayerTimes[prayer.timeKey]);
    const end    = prayerTimes[prayer.nextTimeKey] ? parse(prayerTimes[prayer.nextTimeKey]) : start + 240;

    if (prayer.id === 'isha' && prayerTimes['imsak']) {
      if (nowMin >= start || nowMin < parse(prayerTimes['imsak'])) return 'current';
      return nowMin < start ? 'upcoming' : 'expired';
    }
    if (nowMin < start)                  return 'upcoming';
    if (nowMin >= start && nowMin < end) return 'current';
    return 'expired';
  };

  const handleTrack = async (prayer: any) => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
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
    <View style={{
      marginHorizontal: 16, marginBottom: 16,
      borderRadius: 28, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.trackerCardBorder,
      backgroundColor: colors.trackerCard,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 16, elevation: 10,
    }}>
      <AuthWallModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Namaz Takibi İçin Giriş Yapın"
        description="Namazlarınızı takip etmek ve manevi karnenizi oluşturmak için lütfen oturum açın."
      />

      {/* ── Header band ── */}
      <TouchableOpacity
        activeOpacity={isAuthenticated ? 1 : 0.85}
        onPress={() => !isAuthenticated && setShowAuthModal(true)}>
        <View style={{
          backgroundColor: colors.trackerHeader,
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
        }}>
          {/* Glow orb */}
          <View style={{
            position: 'absolute', top: -30, right: -30,
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: 'rgba(20,184,166,0.20)',
          }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View>
              <Text style={{
                fontSize: 9, fontWeight: '800', letterSpacing: 2,
                textTransform: 'uppercase', color: isDark ? 'rgba(20,184,166,0.80)' : '#f0fdf4',
              }}>
                Günlük İlerleme
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 2 }}>
                Namaz Takibi
              </Text>
            </View>
            <View style={{
              borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6,
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#ffffff' }}>
                {isAuthenticated ? completedCount : 0} / {totalCount}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{
            height: 4, width: '100%', borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden',
          }}>
            <Animated.View style={[{
              height: '100%', borderRadius: 99,
              backgroundColor: '#14b8a6',
              shadowColor: '#14b8a6', shadowOpacity: 0.8, shadowRadius: 4,
            }, progressStyle]} />
          </View>
        </View>

        {/* ── Prayer grid ── */}
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {PRAYERS.map((prayer) => {
              const isTracked  = isAuthenticated && stats?.today_prayers?.includes(prayer.id);
              const isKazaLog  = isAuthenticated && stats?.kaza_prayers?.includes(prayer.id);
              const time       = prayerTimes ? prayerTimes[prayer.timeKey] : '--:--';
              const state      = getPrayerState(prayer);
              const isUpcoming = state === 'upcoming';
              const isExpired  = state === 'expired';

              const borderColor  = isTracked
                ? isKazaLog ? 'rgba(249,115,22,0.50)' : 'rgba(20,184,166,0.50)'
                : isDark ? 'rgba(255,255,255,0.06)' : colors.cardBorder;
              const bgColor      = isTracked
                ? isKazaLog ? 'rgba(249,115,22,0.12)' : 'rgba(20,184,166,0.12)'
                : isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
              const nameColor    = isTracked
                ? isKazaLog ? '#f97316' : '#14b8a6'
                : colors.textMuted;
              const timeColor    = isTracked
                ? isKazaLog ? (isDark ? '#fed7aa' : '#c2410c') : (isDark ? '#ccfbf1' : '#0f766e')
                : colors.textSecondary;
              const iconColor    = isTracked
                ? isKazaLog ? '#f97316' : '#14b8a6'
                : isDark ? 'rgba(240,244,255,0.22)' : 'rgba(0,0,0,0.15)';

              return (
                <AnimatedTouchableOpacity
                  key={prayer.id}
                  layout={Layout.springify()}
                  disabled={isTracked || (isAuthenticated && isUpcoming) || isLoading}
                  onPress={() => handleTrack(prayer)}
                  activeOpacity={0.70}
                  style={{
                    width: '48%', marginBottom: 10,
                    opacity: isAuthenticated && isUpcoming ? 0.38 : 1,
                  }}>
                  <View style={{
                    position: 'relative',
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderRadius: 18, borderWidth: 1,
                    borderColor, backgroundColor: bgColor,
                    padding: 14,
                    ...(isTracked && {
                      shadowColor: isKazaLog ? '#f97316' : '#14b8a6',
                      shadowOpacity: 0.30, shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }),
                  }}>
                    {/* KAZA badge */}
                    {(isKazaLog || (isAuthenticated && !isTracked && isExpired)) && (
                      <View style={{
                        position: 'absolute', top: -6, right: -6, zIndex: 10,
                        borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2,
                        backgroundColor: isKazaLog ? '#f97316' : 'rgba(255,255,255,0.25)',
                      }}>
                        <Text style={{ fontSize: 7, fontWeight: '900', color: '#fff', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          Kaza
                        </Text>
                      </View>
                    )}

                    {/* Lock for non-auth */}
                    {!isAuthenticated && (
                      <View style={{ position: 'absolute', right: 8, top: 8, zIndex: 10 }}>
                        <Ionicons name="lock-closed" size={10} color={isDark ? "rgba(240,244,255,0.25)" : "rgba(0,0,0,0.20)"} />
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 9, fontWeight: '800', letterSpacing: 1,
                        textTransform: 'uppercase', color: nameColor, marginBottom: 3,
                      }}>
                        {prayer.name}
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: timeColor }}>
                        {time}
                      </Text>
                    </View>

                    {/* Check circle */}
                    <View style={{
                      height: 38, width: 38,
                      borderRadius: 99, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isTracked
                        ? isKazaLog ? 'rgba(249,115,22,0.25)' : 'rgba(20,184,166,0.22)'
                        : isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                      borderWidth: 1,
                      borderColor: isTracked
                        ? isKazaLog ? 'rgba(249,115,22,0.40)' : 'rgba(20,184,166,0.35)'
                        : isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                    }}>
                      {isLoading && !isTracked ? (
                        <ActivityIndicator size="small" color="#14b8a6" />
                      ) : (
                        <Animated.View entering={isTracked ? FadeIn : undefined}>
                          <Ionicons
                            name={isTracked ? 'checkmark' : (prayer.icon as any)}
                            size={18}
                            color={iconColor}
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
