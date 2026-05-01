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
import { useThemeStore } from '@/store/theme.store';

const { width } = Dimensions.get('window');

function PodiumItem({ user, rank, isCurrent, isDark }: { user: any; rank: number; isCurrent: boolean, isDark: boolean }) {
  const isFirst = rank === 1;
  const size = isFirst ? 90 : 75;
  const color = isFirst ? '#fbbf24' : rank === 2 ? '#94a3b8' : '#92400e';

  if (!user) return <View style={{ width: width * 0.28 }} />;

  return (
    <View style={{ width: width * 0.28 }} className="items-center">
      <View className="relative mb-2">
        <View
          className="items-center justify-center rounded-full border-4"
          style={{
            width: size, height: size, borderColor: color, 
            backgroundColor: isCurrent ? (isDark ? 'rgba(74,222,128,0.2)' : '#f0fdf4') : (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc')
          }}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} className="h-full w-full rounded-full" />
          ) : (
            <Ionicons name="person" size={size * 0.5} color={isDark ? '#4b5563' : '#94a3b8'} />
          )}
        </View>
        <View 
          className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full" 
          style={{ backgroundColor: color }}>
          <Text className="text-[10px] font-bold text-white">{rank}</Text>
        </View>
      </View>
      <Text className="mb-0.5 text-center text-[11px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>{user.first_name}</Text>
      <View className="rounded-full bg-teal-50 px-2 py-0.5 dark:bg-teal-500/15">
        <Text className="text-[10px] font-black text-teal-700 dark:text-teal-400">{user.total_points} Puan</Text>
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
  const { isDark } = useThemeStore();

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

  const badgesByCategory = BADGE_CATEGORIES.map(cat => ({
    ...cat,
    badges: Object.values(allBadges || {}).filter((b: any) => b.category === cat.category),
  }));

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={loadData}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
            colors={[isDark ? '#14b8a6' : '#0f766e']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>

        <View className="px-6 pb-4 pt-6">
          <View 
            className={`flex-row justify-between rounded-[32px] p-5 shadow-lg ${
              isDark ? 'border border-slate-700 bg-slate-800' : 'bg-teal-700 shadow-teal-900/20'
            }`}>
            <View className="flex-1 items-center">
              <View className={`mb-2 h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-amber-500/10' : 'bg-white/20'}`}>
                <Ionicons name="star" size={20} color="#fbbf24" />
              </View>
              <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-white'}`}>{stats?.total_points || 0}</Text>
              <Text className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-teal-400' : 'text-teal-100'}`}>Puan</Text>
            </View>
            <View className={`h-10 w-[1px] self-center ${isDark ? 'bg-slate-700' : 'bg-white/10'}`} />
            <View className="flex-1 items-center">
              <View className={`mb-2 h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-rose-500/10' : 'bg-white/20'}`}>
                <Ionicons name="flame" size={20} color="#fb7185" />
              </View>
              <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-white'}`}>{stats?.current_streak || 0}</Text>
              <Text className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-teal-400' : 'text-teal-100'}`}>Seri</Text>
            </View>
            <View className={`h-10 w-[1px] self-center ${isDark ? 'bg-slate-700' : 'bg-white/10'}`} />
            <View className="flex-1 items-center">
              <View className={`mb-2 h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-sky-500/10' : 'bg-white/20'}`}>
                <Ionicons name="medal" size={20} color="#38bdf8" />
              </View>
              <Text className={`text-lg font-black ${isDark ? 'text-white' : 'text-white'}`}>{badges?.length || 0}</Text>
              <Text className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-teal-400' : 'text-teal-100'}`}>Rozet</Text>
            </View>
          </View>
        </View>

        {level && (
          <View 
            className={`mx-6 mb-6 overflow-hidden rounded-[28px] border p-5 shadow-sm ${
              isDark 
                ? 'border-slate-700 bg-slate-800/70 shadow-none' 
                : 'border-slate-200 bg-white shadow-black/5'
            }`}>
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Seviye {level.level}</Text>
                <Text className="text-xl font-black" style={{ color: level.color }}>{level.name}</Text>
              </View>
              <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${level.color}18` }}>
                <Ionicons name={level.icon as any} size={28} color={level.color} />
              </View>
            </View>

            <View className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <View
                className="h-full rounded-full"
                style={{ width: `${level.progressPercent}%`, backgroundColor: level.color }}
              />
            </View>
            <View className="mt-2 flex-row justify-between">
              <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-300">%{level.progressPercent} tamamlandı</Text>
              {nextLevel && (
                <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                  {level.pointsToNextLevel} puan kaldı → {nextLevel.name}
                </Text>
              )}
            </View>

            <View className="mt-4 flex-row gap-1">
              {LEVELS.map(l => (
                <View
                  key={l.level}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: level.level >= l.level ? l.color : (isDark ? '#1e293b' : '#e2e8f0') }}
                />
              ))}
            </View>
          </View>
        )}

        <View className="px-6 pt-2">
          {badgesByCategory.map(cat => (
            <View key={cat.category} className="mb-8">
              <View className="mb-4 flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-xl" style={{ backgroundColor: `${cat.color}18` }}>
                  <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                </View>
                <Text className="text-base font-black capitalize text-slate-900 dark:text-white">{cat.category}</Text>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                      className="mx-2 w-[90px] items-center">
                      <View
                        className={`mb-2 h-20 w-20 items-center justify-center rounded-[28px] border ${
                          isEarned 
                            ? (isDark ? 'border-teal-500/20 bg-slate-800' : 'border-teal-100 bg-white') 
                            : (isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-100')
                        }`}
                        style={{ opacity: isEarned ? 1 : 0.4 }}>
                        <Ionicons
                          name={isEarned ? (badgeDesc.icon || 'ribbon') : 'lock-closed'}
                          size={32}
                          color={isEarned ? (badgeDesc.color || '#059669') : (isDark ? '#4b5563' : '#94a3b8')}
                        />
                      </View>
                      <Text className="px-1 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400" numberOfLines={2}>
                        {badgeDesc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          <View className="mb-6">
            <Text className="mb-8 text-2xl font-black text-slate-900 dark:text-white">Sıralama</Text>

            <View className="mb-12 h-40 w-full flex-row items-end justify-center">
              <PodiumItem user={top3[1]} rank={2} isCurrent={user?.id === top3[1]?.id} isDark={isDark} />
              <View className="z-10 -mx-4">
                <PodiumItem user={top3[0]} rank={1} isCurrent={user?.id === top3[0]?.id} isDark={isDark} />
              </View>
              <PodiumItem user={top3[2]} rank={3} isCurrent={user?.id === top3[2]?.id} isDark={isDark} />
            </View>

            <View 
              className={`rounded-[32px] border p-2 shadow-sm ${
                isDark 
                  ? 'border-slate-700 bg-slate-800/70 shadow-none' 
                  : 'border-slate-200 bg-white shadow-black/5'
              }`}>
              {rest.map((item: any, idx: number) => {
                const isMe = user?.id === item.id;
                return (
                <View
                  key={item.id}
                  className={`mb-2 flex-row items-center rounded-3xl p-4 ${
                    isMe 
                      ? 'bg-teal-600 dark:bg-teal-500 shadow-sm shadow-teal-600/30' 
                      : 'bg-transparent'
                  }`}>
                  <Text className={`w-8 text-xs font-black ${isMe ? 'text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                    {idx + 4}
                  </Text>
                  <View className={`mr-3 h-10 w-10 items-center justify-center overflow-hidden rounded-full ${
                    isMe ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} className="h-full w-full" />
                    ) : (
                      <Ionicons name="person" size={20} color={isMe ? '#fff' : (isDark ? '#4b5563' : '#94a3b8')} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-bold ${isMe ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {item.first_name} {item.last_name || ''}
                    </Text>
                    <Text className={`text-[9px] font-medium ${isMe ? 'text-white/80' : 'text-slate-500 dark:text-slate-300'}`}>
                      {item.current_streak} Günlük Seri
                    </Text>
                  </View>
                  <View className={`items-end rounded-full px-3 py-1 ${
                    isMe ? 'bg-white/20' : 'bg-teal-50 dark:bg-teal-500/15'
                  }`}>
                    <Text className={`text-xs font-black ${isMe ? 'text-white' : 'text-teal-700 dark:text-teal-400'}`}>
                      {item.total_points}
                    </Text>
                  </View>
                </View>
                );
              })}

              {!leaderboard?.length && !isLoading && (
                <View className="items-center p-12">
                  <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Ionicons name="people-outline" size={32} color={isDark ? '#4b5563' : '#94a3b8'} />
                  </View>
                  <Text className="text-center font-bold text-slate-500 dark:text-slate-300">Henüz kimse puan kazanmadı.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
