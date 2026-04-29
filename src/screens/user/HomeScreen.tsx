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
import { useAppTheme } from '@/constants/theme';

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
  },
  {
    key: 'stats',
    label: 'İstatistikler',
    icon: 'bar-chart-outline' as const,
    color: '#14b8a6',
    glow: 'rgba(20,184,166,0.18)',
    border: 'rgba(20,184,166,0.35)',
    screen: 'Stats' as const,
  },
  {
    key: 'challenges',
    label: 'Challenge',
    icon: 'trophy-outline' as const,
    color: '#f6c358',
    glow: 'rgba(246,195,88,0.18)',
    border: 'rgba(246,195,88,0.35)',
    screen: 'Challenges' as const,
  },
];

export default function HomeScreen({ navigation }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const { colors, isDark } = useAppTheme();

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
    <Screen  safeAreaEdges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <PrayerTimesCard focusNonce={focusNonce} />
        <PrayerTrackerCard />

        {/* ── Premium Quick Actions ── */}
        {isAuthenticated && (
          <View style={{ marginBottom: 20, paddingLeft: 16 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate(action.screen);
                  }}
                  style={{
                    width: 130,
                    alignItems: 'center',
                    borderRadius: 22,
                    padding: 18,
                    backgroundColor: isDark ? action.glow : '#ffffff',
                    borderWidth: 1,
                    borderColor: isDark ? action.border : colors.cardBorder,
                    shadowColor: isDark ? action.color : '#000',
                    shadowOpacity: isDark ? 0.35 : 0.06,
                    shadowRadius: isDark ? 14 : 8,
                    shadowOffset: { width: 0, height: isDark ? 4 : 2 },
                  }}>
                  {/* Glow orb — dark only */}
                  {isDark && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: action.glow,
                      }}
                    />
                  )}

                  <View
                    style={{
                      height: 52,
                      width: 52,
                      borderRadius: 18,
                      backgroundColor: isDark ? `${action.color}20` : `${action.color}15`,
                      borderWidth: 1,
                      borderColor: `${action.color}35`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      shadowColor: action.color,
                      shadowOpacity: isDark ? 0.5 : 0.15,
                      shadowRadius: 8,
                    }}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color: isDark ? '#F0F4FF' : '#0f172a',
                      textAlign: 'center',
                      marginBottom: 6,
                    }}
                    numberOfLines={2}>
                    {action.label}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: action.color }}>
                      Git
                    </Text>
                    <Ionicons name="arrow-forward" size={10} color={action.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Inspiration & Religious Days ── */}
        <DailyInspirationCard />
        <ReligiousDaysCard />
      </ScrollView>
    </Screen>
  );
}
