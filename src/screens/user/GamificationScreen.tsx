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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';

const { width } = Dimensions.get('window');

function PodiumItem({ user, rank, isCurrent }: { user: any; rank: number; isCurrent: boolean }) {
  const isFirst = rank === 1;
  const size = isFirst ? 90 : 75;
  const color = isFirst ? '#fbbf24' : rank === 2 ? '#94a3b8' : '#92400e';

  if (!user) return <View style={{ width: width * 0.28 }} />;

  return (
    <View className="items-center" style={{ width: width * 0.28 }}>
      <View className="relative mb-2">
        <View
          className="items-center justify-center rounded-full border-4"
          style={{ width: size, height: size, borderColor: color, backgroundColor: isCurrent ? '#f0fdf4' : '#f8fafc' }}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} className="h-full w-full rounded-full" />
          ) : (
            <Ionicons name="person" size={size * 0.5} color="#cbd5e1" />
          )}
        </View>
        <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: color }}>
          <Text className="text-[10px] font-bold text-white">{rank}</Text>
        </View>
      </View>
      <Text className="mb-0.5 text-center text-[11px] font-bold text-slate-800" numberOfLines={1}>{user.first_name}</Text>
      <View className="rounded-full bg-primary-100 px-2 py-0.5">
        <Text className="text-[10px] font-black text-primary-700">{user.total_points} Puan</Text>
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
    <Screen className="bg-slate-50 p-0 px-0" safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50"
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
          <View className="mx-6 mb-6 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seviye {level.level}</Text>
                <Text className="text-xl font-black" style={{ color: level.color }}>{level.name}</Text>
              </View>
              <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${level.color}18` }}>
                <Ionicons name={level.icon as any} size={28} color={level.color} />
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <View
                className="h-full rounded-full"
                style={{ width: `${level.progressPercent}%`, backgroundColor: level.color }}
              />
            </View>
            <View className="mt-2 flex-row justify-between">
              <Text className="text-[10px] font-bold text-slate-400">%{level.progressPercent} tamamlandı</Text>
              {nextLevel && (
                <Text className="text-[10px] font-bold text-slate-400">
                  {level.pointsToNextLevel} puan kaldı → {nextLevel.name}
                </Text>
              )}
            </View>

            {/* All levels mini strip */}
            <View className="mt-4 flex-row gap-1">
              {LEVELS.map(l => (
                <View
                  key={l.level}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ backgroundColor: level.level >= l.level ? l.color : '#e2e8f0' }}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Badges by Category ── */}
        <View className="bg-slate-50 px-6 pt-2">
          {badgesByCategory.map(cat => (
            <View key={cat.category} className="mb-8">
              <View className="mb-4 flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-xl" style={{ backgroundColor: `${cat.color}18` }}>
                  <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                </View>
                <Text className="text-base font-black capitalize text-slate-800">{cat.category}</Text>
                <Text className="text-xs font-bold text-slate-400">
                  ({cat.badges.filter((b: any) => badges?.some(e => e.badge_id === b.id)).length}/{cat.badges.length})
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
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
                        className={`mb-2 h-20 w-20 items-center justify-center rounded-[28px] shadow-sm ${
                          isEarned ? 'border border-primary-100 bg-white' : 'border border-slate-200 bg-slate-100 opacity-40'
                        }`}>
                        <Ionicons
                          name={isEarned ? (badgeDesc.icon || 'ribbon') : 'lock-closed'}
                          size={32}
                          color={isEarned ? (badgeDesc.color || '#059669') : '#94a3b8'}
                        />
                      </View>
                      <Text className="px-1 text-center text-[10px] font-bold text-slate-600" numberOfLines={2}>
                        {badgeDesc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          {/* ── Leaderboard ── */}
          <View className="mb-6">
            <Text className="mb-8 text-2xl font-black text-slate-800">Sıralama</Text>

            <View style={{ width: '100%', height: 160 }} className="mb-12 flex-row items-end justify-center">
              <PodiumItem user={top3[1]} rank={2} isCurrent={user?.id === top3[1]?.id} />
              <View className="z-10 -mx-4">
                <PodiumItem user={top3[0]} rank={1} isCurrent={user?.id === top3[0]?.id} />
              </View>
              <PodiumItem user={top3[2]} rank={3} isCurrent={user?.id === top3[2]?.id} />
            </View>

            <View className="rounded-[32px] border border-slate-100 bg-white p-2 shadow-sm">
              {rest.map((item: any, idx: number) => (
                <View
                  key={item.id}
                  className={`mb-2 flex-row items-center rounded-[24px] p-4 ${
                    user?.id === item.id ? 'bg-primary-600 shadow-md' : 'bg-slate-50'
                  }`}>
                  <Text className={`w-8 text-xs font-black ${user?.id === item.id ? 'text-white' : 'text-slate-400'}`}>
                    {idx + 4}
                  </Text>
                  <View className="mr-3 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} className="h-full w-full" />
                    ) : (
                      <Ionicons name="person" size={20} color="#cbd5e1" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-bold ${user?.id === item.id ? 'text-white' : 'text-slate-800'}`}>
                      {item.first_name} {item.last_name || ''}
                    </Text>
                    <Text className={`text-[9px] font-medium ${user?.id === item.id ? 'text-primary-100' : 'text-slate-500'}`}>
                      {item.current_streak} Günlük Seri
                    </Text>
                  </View>
                  <View className="items-end rounded-full bg-white/20 px-3 py-1">
                    <Text className={`text-xs font-black ${user?.id === item.id ? 'text-white' : 'text-primary-600'}`}>
                      {item.total_points}
                    </Text>
                  </View>
                </View>
              ))}

              {!leaderboard?.length && !isLoading && (
                <View className="items-center p-12">
                  <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                    <Ionicons name="people-outline" size={32} color="#cbd5e1" />
                  </View>
                  <Text className="text-center font-bold text-slate-400">Henüz kimse puan kazanmadı.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
