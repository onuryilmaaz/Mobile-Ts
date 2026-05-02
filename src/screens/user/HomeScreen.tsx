import { useEffect, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { userApi } from '@/modules/user/user.api';
import { Screen } from '@/components/layout/Screen';
import { useAuthStore } from '@/modules/auth/auth.store';
import { PrayerTimesCard } from '@/components/home/PrayerTimesCard';
import { PrayerTrackerCard } from '@/components/home/PrayerTrackerCard';
import { ReligiousDaysCard } from '@/components/home/ReligiousDaysCard';
import { DailyInspirationCard } from '@/components/home/DailyInspirationCard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/theme.store';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

const QUICK_ACTIONS = [
  {
    key: 'kaza',
    label: 'Kaza Takip',
    icon: 'time-outline' as const,
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.18)',
    border: 'rgba(129,140,248,0.35)',
    screen: 'KazaTracker' as const,
    twColor: 'indigo',
  },
  {
    key: 'stats',
    label: 'İstatistikler',
    icon: 'bar-chart-outline' as const,
    color: '#14b8a6',
    glow: 'rgba(20,184,166,0.18)',
    border: 'rgba(20,184,166,0.35)',
    screen: 'Stats' as const,
    twColor: 'teal',
  },
  {
    key: 'challenges',
    label: 'Challenge',
    icon: 'trophy-outline' as const,
    color: '#f6c358',
    glow: 'rgba(246,195,88,0.18)',
    border: 'rgba(246,195,88,0.35)',
    screen: 'Challenges' as const,
    twColor: 'amber',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const { isDark } = useThemeStore();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await userApi.profile();
      const userData = (data as any).user ? (data as any).user : data;
      setUser(userData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (isAuthenticated && !user?.firstName) fetchData();
      setFocusNonce((n) => n + 1);
    });
    return unsub;
  }, [navigation, isAuthenticated, user?.firstName, fetchData]);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
            colors={[isDark ? '#14b8a6' : '#0f766e']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <PrayerTimesCard focusNonce={focusNonce} />
        <PrayerTrackerCard />

        {isAuthenticated && (
          <View className="mb-5 pl-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
              {QUICK_ACTIONS.map((action) => {
                return (
                  <TouchableOpacity
                    key={action.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate(action.screen);
                    }}
                    className="relative h-[116px] w-[116px] items-center overflow-hidden rounded-[22px] border border-slate-200 bg-white p-[10px] shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900">
                    <View
                      className="absolute -right-5 -top-5 h-[70px] w-[70px] rounded-full"
                      style={{ backgroundColor: action.glow }}
                    />

                    <View
                      className="mb-3 h-[52px] w-[52px] items-center justify-center rounded-[18px] border"
                      style={{
                        backgroundColor: isDark ? `${action.color}20` : `${action.color}15`,
                        borderColor: `${action.color}35`,
                      }}>
                      <Ionicons name={action.icon} size={24} color={action.color} />
                    </View>

                    <Text
                      className="mb-1.5 text-center text-[13px] font-black text-slate-900 dark:text-slate-100"
                      numberOfLines={2}>
                      {action.label}
                    </Text>

                    <View className="flex-row items-center gap-1">
                      <Text className="text-[10px] font-bold" style={{ color: action.color }}>
                        Git
                      </Text>
                      <Ionicons name="arrow-forward" size={10} color={action.color} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <DailyInspirationCard />
        <ReligiousDaysCard />
      </ScrollView>
    </Screen>
  );
}
