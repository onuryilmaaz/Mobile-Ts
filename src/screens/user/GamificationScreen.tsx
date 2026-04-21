import { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, Dimensions, StatusBar } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';

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
          className="rounded-full items-center justify-center border-4"
          style={{
            width: size,
            height: size,
            borderColor: color,
            backgroundColor: isCurrent ? '#f0fdf4' : '#f8fafc',
          }}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} className="rounded-full w-full h-full" />
          ) : (
            <Ionicons name="person" size={size * 0.5} color="#cbd5e1" />
          )}
        </View>
        <View
          className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full items-center justify-center shadow-sm"
          style={{ backgroundColor: color }}>
          <Text className="text-white font-bold text-[10px]">{rank}</Text>
        </View>
      </View>
      <Text className="text-slate-800 font-bold text-[11px] text-center mb-0.5" numberOfLines={1}>
        {user.first_name}
      </Text>
      <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
        <Text className="text-emerald-700 font-black text-[10px]">{user.total_points} Puan</Text>
      </View>
    </View>
  );
}

export function GamificationScreen() {
  const { stats, badges, allBadges, leaderboard, isLoading, fetchStats, fetchLeaderboard } =
    useGamificationStore();
  const { user } = useAuthStore();

  const loadData = async () => {
    await fetchStats();
    await fetchLeaderboard();
  };

  useEffect(() => {
    loadData();
  }, []);

  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <Screen className="bg-emerald-700 p-0 px-0" safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        className="flex-1 bg-slate-50"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Modern Header Section */}
        <View className="bg-emerald-700 px-6 pt-14 pb-24">
          <View className="mb-6">
            <Text className="text-emerald-200 text-xs font-bold uppercase tracking-[2px] mb-1">Hesabım</Text>
            <Text className="text-white text-3xl font-black">Manevi Karne</Text>
          </View>

          <View className="flex-row justify-between bg-white/10 p-5 rounded-[32px] border border-white/20">
            <View className="items-center flex-1">
              <View className="h-10 w-10 bg-white/20 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="star" size={20} color="#fbbf24" />
              </View>
              <Text className="text-white text-lg font-black">{stats?.total_points || 0}</Text>
              <Text className="text-emerald-100 text-[9px] font-bold uppercase">Puan</Text>
            </View>
            <View className="w-[1px] h-10 bg-white/10 self-center" />
            <View className="items-center flex-1">
              <View className="h-10 w-10 bg-white/20 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="flame" size={20} color="#fb7185" />
              </View>
              <Text className="text-white text-lg font-black">{stats?.current_streak || 0}</Text>
              <Text className="text-emerald-100 text-[9px] font-bold uppercase">Seri</Text>
            </View>
            <View className="w-[1px] h-10 bg-white/10 self-center" />
            <View className="items-center flex-1">
              <View className="h-10 w-10 bg-white/20 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="medal" size={20} color="#38bdf8" />
              </View>
              <Text className="text-white text-lg font-black">{badges?.length || 0}</Text>
              <Text className="text-emerald-100 text-[9px] font-bold uppercase">Rozet</Text>
            </View>
          </View>
        </View>

        {/* Content Section (Rounded Top Overlay) */}
        <View className="-mt-12 bg-slate-50 rounded-t-[48px] px-6 pt-10">
          
          {/* Badges Section */}
          <View className="mb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-black text-slate-800">Hedeflerim</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
              {Object.values(allBadges || {}).map((badgeDesc: any) => {
                const isEarned = badges?.some((b) => b.badge_id === badgeDesc.id);
                return (
                  <View key={badgeDesc.id} className="mx-2 items-center" style={{ width: 90 }}>
                    <View
                      className={`h-20 w-20 rounded-[28px] items-center justify-center mb-2 shadow-sm ${
                        isEarned
                          ? 'bg-white border border-emerald-100'
                          : 'bg-slate-100 border border-slate-200 opacity-40'
                      }`}>
                      <Ionicons
                        name={isEarned ? 'ribbon' : 'lock-closed'}
                        size={32}
                        color={isEarned ? '#059669' : '#94a3b8'}
                      />
                    </View>
                    <Text
                      className="text-[10px] font-bold text-slate-600 text-center px-1"
                      numberOfLines={2}>
                      {badgeDesc.name}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Leaderboard Section */}
          <View className="mb-6">
            <Text className="text-2xl font-black text-slate-800 mb-8">Sıralama</Text>

            {/* Podium */}
            <View 
              style={{ width: '100%', height: 160 }} 
              className="flex-row justify-center items-end mb-12"
            >
              {/* Rank 2 */}
              <PodiumItem user={top3[1]} rank={2} isCurrent={user?.id === top3[1]?.id} />
              
              {/* Rank 1 (Middle) */}
              <View className="z-10 -mx-4">
                <PodiumItem user={top3[0]} rank={1} isCurrent={user?.id === top3[0]?.id} />
              </View>
              
              {/* Rank 3 */}
              <PodiumItem user={top3[2]} rank={3} isCurrent={user?.id === top3[2]?.id} />
            </View>

            {/* Others List */}
            <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
              {rest.map((item: any, idx: number) => (
                <View
                  key={item.id}
                  className={`flex-row items-center p-4 mb-2 rounded-[24px] ${
                    user?.id === item.id ? 'bg-emerald-600 shadow-md' : 'bg-slate-50'
                  }`}>
                  <Text
                    className={`w-8 font-black text-xs ${user?.id === item.id ? 'text-white' : 'text-slate-400'}`}>
                    {idx + 4}
                  </Text>

                  <View className="h-10 w-10 rounded-full bg-white overflow-hidden items-center justify-center mr-3 shadow-sm">
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} className="w-full h-full" />
                    ) : (
                      <Ionicons name="person" size={20} color="#cbd5e1" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`font-bold text-sm ${user?.id === item.id ? 'text-white' : 'text-slate-800'}`}>
                      {item.first_name} {item.last_name || ''}
                    </Text>
                    <Text
                      className={`text-[9px] font-medium ${
                        user?.id === item.id ? 'text-emerald-100' : 'text-slate-500'
                      }`}>
                      {item.current_streak} Günlük Seri
                    </Text>
                  </View>

                  <View className="items-end bg-white/20 px-3 py-1 rounded-full">
                    <Text
                      className={`font-black text-xs ${
                        user?.id === item.id ? 'text-white' : 'text-emerald-600'
                      }`}>
                      {item.total_points}
                    </Text>
                  </View>
                </View>
              ))}

              {!leaderboard?.length && !isLoading && (
                <View className="p-12 items-center">
                  <View className="h-20 w-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="people-outline" size={32} color="#cbd5e1" />
                  </View>
                  <Text className="text-slate-400 font-bold text-center">
                    Henüz kimse puan kazanmadı.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
