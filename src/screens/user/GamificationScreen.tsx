import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/modules/auth/auth.store';
import { LEVELS } from '@/constants/levels';
import { useAppTheme } from '@/constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';

const { width } = Dimensions.get('window');

function PodiumItem({ user, rank, isCurrent, colors, isDark }: { user: any; rank: number; isCurrent: boolean, colors: any, isDark: boolean }) {
  const isFirst = rank === 1;
  const size = isFirst ? 90 : 75;
  const color = isFirst ? '#fbbf24' : rank === 2 ? '#94a3b8' : '#92400e';

  if (!user) return <View style={{ width: width * 0.28 }} />;

  return (
    <View style={{ alignItems: 'center', width: width * 0.28 }}>
      <View style={{ position: 'relative', marginBottom: 8 }}>
        <View
          style={{
            alignItems: 'center', justifyContent: 'center', borderRadius: 99, borderWidth: 4,
            width: size, height: size, borderColor: color, backgroundColor: isCurrent ? (isDark ? 'rgba(74,222,128,0.2)' : '#f0fdf4') : (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc')
          }}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={{ height: '100%', width: '100%', borderRadius: 99 }} />
          ) : (
            <Ionicons name="person" size={size * 0.5} color={colors.textMuted} />
          )}
        </View>
        <View style={{ position: 'absolute', bottom: -4, right: -4, height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: color }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>{rank}</Text>
        </View>
      </View>
      <Text style={{ marginBottom: 2, textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: colors.textPrimary }} numberOfLines={1}>{user.first_name}</Text>
      <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: colors.teal }}>{user.total_points} Puan</Text>
      </View>
    </View>
  );
}

type BadgeCategory = { category: string; icon: string; color: string };
const BADGE_CATEGORIES: BadgeCategory[] = [
  { category: 'başlangıç', icon: 'footsteps', color: '#10b981' },
  { category: 'seri',      icon: 'flame',     color: '#f97316' },
  { category: 'puan',      icon: 'star',      color: '#fbbf24' },
  { category: 'vakit',     icon: 'sunny',     color: '#0ea5e9' },
  { category: 'özel',      icon: 'planet',    color: '#a855f7' },
];

export function GamificationScreen() {
  const { stats, badges, allBadges, leaderboard, isLoading, fetchStats, fetchLeaderboard } =
    useGamificationStore();
  const { user } = useAuthStore();
  const { colors, isDark } = useAppTheme();

  const loadData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchStats();
    await fetchLeaderboard();
  };

  useEffect(() => { loadData(); }, []);

  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  const level = stats?.level;
  const nextLevel = level?.nextLevel;

  // Group badges by category
  const badgesByCategory = BADGE_CATEGORIES.map(cat => ({
    ...cat,
    badges: Object.values(allBadges || {}).filter((b: any) => b.category === cat.category),
  }));

  return (
    <Screen style={{ backgroundColor: colors.bg, paddingHorizontal: 0 }} safeAreaEdges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Stats Banner ── */}
        <View className="px-6 pb-4 pt-6">
          <View className="flex-row justify-between rounded-[32px] bg-primary-700 p-5 shadow-lg shadow-primary-900/20">
            <View className="flex-1 items-center">
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Ionicons name="star" size={20} color="#fbbf24" />
              </View>
              <Text className="text-lg font-black text-white">{stats?.total_points || 0}</Text>
              <Text className="text-[9px] font-bold uppercase text-primary-100">Puan</Text>
            </View>
            <View className="h-10 w-[1px] self-center bg-white/10" />
            <View className="flex-1 items-center">
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Ionicons name="flame" size={20} color="#fb7185" />
              </View>
              <Text className="text-lg font-black text-white">{stats?.current_streak || 0}</Text>
              <Text className="text-[9px] font-bold uppercase text-primary-100">Seri</Text>
            </View>
            <View className="h-10 w-[1px] self-center bg-white/10" />
            <View className="flex-1 items-center">
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Ionicons name="medal" size={20} color="#38bdf8" />
              </View>
              <Text className="text-lg font-black text-white">{badges?.length || 0}</Text>
              <Text className="text-[9px] font-bold uppercase text-primary-100">Rozet</Text>
            </View>
          </View>
        </View>

        {/* ── Level Card ── */}
        {level && (
          <View style={{ marginHorizontal: 24, marginBottom: 24, overflow: 'hidden', borderRadius: 28, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 20, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>Seviye {level.level}</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: level.color }}>{level.name}</Text>
              </View>
              <View style={{ height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: `${level.color}18` }}>
                <Ionicons name={level.icon as any} size={28} color={level.color} />
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ height: 10, overflow: 'hidden', borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <View
                className="h-full rounded-full"
                style={{ width: `${level.progressPercent}%`, backgroundColor: level.color }}
              />
            </View>
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>%{level.progressPercent} tamamlandı</Text>
              {nextLevel && (
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>
                  {level.pointsToNextLevel} puan kaldı → {nextLevel.name}
                </Text>
              )}
            </View>

            {/* All levels mini strip */}
            <View style={{ marginTop: 16, flexDirection: 'row', gap: 4 }}>
              {LEVELS.map(l => (
                <View
                  key={l.level}
                  style={{ flex: 1, height: 6, borderRadius: 99, backgroundColor: level.level >= l.level ? l.color : (isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0') }}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Badges by Category ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          {badgesByCategory.map(cat => (
            <View key={cat.category} style={{ marginBottom: 32 }}>
              <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: `${cat.color}18` }}>
                  <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'capitalize', color: colors.textPrimary }}>{cat.category}</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted }}>
                  ({cat.badges.filter((b: any) => badges?.some(e => e.badge_id === b.id)).length}/{cat.badges.length})
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8 }}>
                {cat.badges.map((badgeDesc: any) => {
                  const isEarned = badges?.some((b) => b.badge_id === badgeDesc.id);
                  return (
                    <TouchableOpacity
                      key={badgeDesc.id}
                      onPress={() => {
                        if (isEarned) {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Share.share({ message: `Salah uygulamasında "${badgeDesc.name}" rozetini kazandım! 🏅 #SalahApp` });
                        } else {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      className="mx-2 items-center"
                      style={{ width: 90 }}>
                      <View
                        style={{
                          marginBottom: 8, height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 28,
                          borderWidth: 1, borderColor: isEarned ? colors.tealDim : (isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'),
                          backgroundColor: isEarned ? colors.card : (isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9'),
                          opacity: isEarned ? 1 : 0.4
                        }}>
                        <Ionicons
                          name={isEarned ? (badgeDesc.icon || 'ribbon') : 'lock-closed'}
                          size={32}
                          color={isEarned ? (badgeDesc.color || '#059669') : colors.textMuted}
                        />
                      </View>
                      <Text style={{ paddingHorizontal: 4, textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }} numberOfLines={2}>
                        {badgeDesc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          {/* ── Leaderboard ── */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ marginBottom: 32, fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Sıralama</Text>

            <View style={{ width: '100%', height: 160, marginBottom: 48, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <PodiumItem user={top3[1]} rank={2} isCurrent={user?.id === top3[1]?.id} colors={colors} isDark={isDark} />
              <View style={{ zIndex: 10, marginHorizontal: -16 }}>
                <PodiumItem user={top3[0]} rank={1} isCurrent={user?.id === top3[0]?.id} colors={colors} isDark={isDark} />
              </View>
              <PodiumItem user={top3[2]} rank={3} isCurrent={user?.id === top3[2]?.id} colors={colors} isDark={isDark} />
            </View>

            <View style={{ borderRadius: 32, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, padding: 8, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
              {rest.map((item: any, idx: number) => {
                const isMe = user?.id === item.id;
                return (
                <View
                  key={item.id}
                  style={{
                    marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 16,
                    backgroundColor: isMe ? colors.teal : colors.bg,
                    shadowColor: isMe ? colors.teal : 'transparent', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
                  }}>
                  <Text style={{ width: 32, fontSize: 12, fontWeight: '900', color: isMe ? '#fff' : colors.textMuted }}>
                    {idx + 4}
                  </Text>
                  <View style={{ marginRight: 12, height: 40, width: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 20, backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : '#fff') }}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={{ height: '100%', width: '100%' }} />
                    ) : (
                      <Ionicons name="person" size={20} color={isMe ? '#fff' : colors.textMuted} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: isMe ? '#fff' : colors.textPrimary }}>
                      {item.first_name} {item.last_name || ''}
                    </Text>
                    <Text style={{ fontSize: 9, fontWeight: '500', color: isMe ? 'rgba(255,255,255,0.8)' : colors.textSecondary }}>
                      {item.current_streak} Günlük Seri
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', borderRadius: 99, backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim), paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: isMe ? '#fff' : colors.teal }}>
                      {item.total_points}
                    </Text>
                  </View>
                </View>
                );
              })}

              {!leaderboard?.length && !isLoading && (
                <View style={{ alignItems: 'center', padding: 48 }}>
                  <View style={{ marginBottom: 16, height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                    <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                  </View>
                  <Text style={{ textAlign: 'center', fontWeight: 'bold', color: colors.textMuted }}>Henüz kimse puan kazanmadı.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
