/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGroupStore } from '@/modules/group/group.store';
import { groupApi } from '@/modules/group/group.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { GroupStackParamList } from '@/navigation/types';
import type { FeedItem, LeaderboardEntry, GroupGoal } from '@/modules/group/group.types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GroupDetail'>;
  route: RouteProp<GroupStackParamList, 'GroupDetail'>;
};

type Tab = 'feed' | 'goals' | 'members' | 'leaderboard';
type LeaderboardPeriod = 'all' | 'week' | 'month';

const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  all: 'Tüm Zamanlar',
  week: 'Bu Hafta',
  month: 'Bu Ay',
};

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const {
    currentGroup,
    currentGoals,
    currentFeed,
    currentLeaderboard,
    isLoadingDetail,
    fetchGroup,
    fetchGoals,
    fetchFeed,
    fetchLeaderboard,
    leaveGroup,
    clearCurrent,
  } = useGroupStore();

  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    load();
    return () => clearCurrent();
  }, [groupId]);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard(groupId, period);
  }, [period, activeTab]);

  async function load() {
    await Promise.all([fetchGroup(groupId), fetchFeed(groupId), fetchGoals(groupId)]);
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    if (activeTab === 'leaderboard') await fetchLeaderboard(groupId, period);
    setRefreshing(false);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'leaderboard' && currentLeaderboard.length === 0) {
      fetchLeaderboard(groupId, period);
    }
  }

  async function handleAvatarUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return alert.warning('İzin Gerekli', 'Fotoğraf kütüphanesine erişim izni verin.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      setAvatarUploading(true);
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'group_avatar.jpg',
      } as any);
      await groupApi.uploadAvatar(groupId, formData);
      await fetchGroup(groupId);
    } catch (e: any) {
      alert.error('Hata', 'Fotoğraf yüklenemedi.');
    } finally {
      setAvatarUploading(false);
    }
  }

  function confirmLeave() {
    alert.confirm(
      'Gruptan Ayrıl',
      'Bu gruptan ayrılmak istediğinizden emin misiniz?',
      async () => {
        try {
          await leaveGroup(groupId);
          navigation.goBack();
        } catch (e: any) {
          alert.error('Hata', e.message);
        }
      },
      'Ayrıl',
      'İptal',
      true,
    );
  }

  if (isLoadingDetail && !currentGroup) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#2dd4bf' : '#0f766e'} />
        </View>
      </Screen>
    );
  }

  if (!currentGroup) return null;

  const isAdmin = ['owner', 'moderator'].includes(currentGroup.my_role ?? '');
  const isOwner = currentGroup.my_role === 'owner';

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'feed', label: 'Akış', icon: 'list-outline' },
    { key: 'goals', label: 'Hedefler', icon: 'flag-outline' },
    { key: 'leaderboard', label: 'Sıralama', icon: 'trophy-outline' },
    { key: 'members', label: 'Üyeler', icon: 'people-outline' },
  ];

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="border-b border-slate-100 px-4 pb-4 pt-2 dark:border-slate-800">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row items-center gap-3">
              <TouchableOpacity
                onPress={isAdmin ? handleAvatarUpload : undefined}
                disabled={avatarUploading}
                className="h-14 w-14 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20">
                {avatarUploading ? (
                  <ActivityIndicator size="small" color={isDark ? '#2dd4bf' : '#0f766e'} />
                ) : currentGroup.avatar_url ? (
                  <Image
                    source={{ uri: currentGroup.avatar_url }}
                    className="h-14 w-14 rounded-full"
                  />
                ) : (
                  <Ionicons name="people" size={28} color={isDark ? '#2dd4bf' : '#0f766e'} />
                )}
                {isAdmin && (
                  <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-teal-600">
                    <Ionicons name="camera" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-xl font-black text-slate-900 dark:text-white">
                  {currentGroup.name}
                </Text>
                {currentGroup.description && (
                  <Text
                    className="mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                    numberOfLines={1}>
                    {currentGroup.description}
                  </Text>
                )}
                <Text className="mt-0.5 text-xs text-slate-400">
                  {currentGroup.member_count} üye
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              {isAdmin && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('GroupInvite', {
                      groupId,
                      inviteCode: currentGroup.invite_code,
                    })
                  }
                  className="h-9 w-9 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10">
                  <Ionicons name="share-outline" size={18} color={isDark ? '#2dd4bf' : '#0f766e'} />
                </TouchableOpacity>
              )}
              {isOwner && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('GroupSettings', { groupId })}
                  className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
              )}
              {!isOwner && (
                <TouchableOpacity
                  onPress={confirmLeave}
                  className="h-9 w-9 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                  <Ionicons name="exit-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-slate-100 dark:border-slate-800"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabChange(tab.key)}
              className={[
                'flex-row items-center gap-1.5 rounded-full px-4 py-2',
                activeTab === tab.key
                  ? 'bg-teal-600 dark:bg-teal-500'
                  : 'bg-slate-100 dark:bg-slate-800',
              ].join(' ')}>
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? '#fff' : isDark ? '#94a3b8' : '#64748b'}
              />
              <Text
                className={
                  activeTab === tab.key
                    ? 'text-sm font-bold text-white'
                    : 'text-sm font-semibold text-slate-500 dark:text-slate-400'
                }>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-4 pt-4">
          {/* ── FEED ── */}
          {activeTab === 'feed' && (
            <>
              {currentGroup.activity_types?.some((t: any) => t.base_type === null) && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('GroupManualLog', { groupId })}
                  className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-500 py-3">
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={isDark ? '#2dd4bf' : '#0f766e'}
                  />
                  <Text className="text-sm font-bold text-teal-600 dark:text-teal-400">
                    Manuel Aktivite Ekle
                  </Text>
                </TouchableOpacity>
              )}
              <FeedTab feed={currentFeed} isDark={isDark} />
            </>
          )}

          {/* ── GOALS ── */}
          {activeTab === 'goals' && (
            <GoalsTab
              goals={currentGoals}
              isDark={isDark}
              isAdmin={isAdmin}
              onCreateGoal={() => navigation.navigate('GoalCreate', { groupId })}
              onSuggestGoal={() => navigation.navigate('GoalSuggest', { groupId })}
            />
          )}

          {/* ── LEADERBOARD ── */}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab
              leaderboard={currentLeaderboard}
              period={period}
              onPeriodChange={setPeriod}
              currentUserId={user?.id ?? ''}
              isDark={isDark}
            />
          )}

          {/* ── MEMBERS ── */}
          {activeTab === 'members' && (
            <MembersTab
              members={currentGroup.members}
              isOwner={currentGroup.my_role === 'owner'}
              isAdmin={isAdmin}
              currentUserId={user?.id ?? ''}
              groupId={groupId}
              isDark={isDark}
              onKick={async (memberId) => {
                await groupApi.kickMember(groupId, memberId);
                fetchGroup(groupId);
              }}
              onRoleChange={async (memberId, role) => {
                try {
                  await groupApi.updateMemberRole(groupId, memberId, role);
                  fetchGroup(groupId);
                } catch (e: any) {
                  alert.error('Hata', e?.response?.data?.message ?? 'Rol değiştirilemedi.');
                }
              }}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FeedTab({ feed, isDark }: { feed: FeedItem[]; isDark: boolean }) {
  if (!feed.length) {
    return (
      <View className="items-center py-12">
        <Ionicons name="time-outline" size={40} color={isDark ? '#374151' : '#cbd5e1'} />
        <Text className="mt-3 text-sm text-slate-400">Henüz aktivite yok</Text>
      </View>
    );
  }
  return (
    <View className="gap-3">
      {feed.map((item) => (
        <View
          key={item.id}
          className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-950">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20">
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} className="h-10 w-10 rounded-full" />
              ) : (
                <Ionicons name="person" size={18} color={isDark ? '#2dd4bf' : '#0f766e'} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                {item.first_name} {item.last_name}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {item.activity_name} • {item.value} {item.unit}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">
                +{item.points} puan
              </Text>
              <Text className="text-[10px] text-slate-400">
                {new Date(item.logged_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function GoalsTab({
  goals,
  isDark,
  isAdmin,
  onCreateGoal,
  onSuggestGoal,
}: {
  goals: GroupGoal[];
  isDark: boolean;
  isAdmin: boolean;
  onCreateGoal: () => void;
  onSuggestGoal: () => void;
}) {
  const goalTypeLabel: Record<string, string> = {
    group_total: 'Toplam Grup Hedefi',
    per_person: 'Kişi Başı Hedef',
    streak: 'Seri Hedefi',
  };

  return (
    <View>
      <View className="mb-4 flex-row gap-2">
        {isAdmin && (
          <TouchableOpacity
            onPress={onCreateGoal}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-500 py-3">
            <Ionicons name="add-circle-outline" size={18} color={isDark ? '#2dd4bf' : '#0f766e'} />
            <Text className="text-sm font-bold text-teal-600 dark:text-teal-400">Yeni Hedef</Text>
          </TouchableOpacity>
        )}
        {!isAdmin && (
          <TouchableOpacity
            onPress={onSuggestGoal}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-500 py-3">
            <Ionicons name="bulb-outline" size={18} color={isDark ? '#fbbf24' : '#d97706'} />
            <Text className="text-sm font-bold text-amber-600 dark:text-amber-400">Hedef Öner</Text>
          </TouchableOpacity>
        )}
      </View>
      {!goals.length && (
        <View className="items-center py-12">
          <Ionicons name="flag-outline" size={40} color={isDark ? '#374151' : '#cbd5e1'} />
          <Text className="mt-3 text-sm text-slate-400">Henüz hedef yok</Text>
        </View>
      )}
      {goals.map((goal) => {
        const progress = goal.progress as any;
        const groupTotalProgress = 'total' in progress ? progress : null;

        return (
          <View
            key={goal.id}
            className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/60">
            <View className="mb-2 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {goal.title}
                </Text>
                <Text className="text-xs text-slate-400">
                  {goalTypeLabel[goal.goal_type]} • {goal.activity_type_name ?? 'Genel'}
                </Text>
              </View>
              <View
                className={[
                  'rounded-full px-2 py-0.5',
                  goal.status === 'active'
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : 'bg-slate-100 dark:bg-slate-700',
                ].join(' ')}>
                <Text
                  className={
                    goal.status === 'active'
                      ? 'text-xs font-bold text-green-700 dark:text-green-400'
                      : 'text-xs font-bold text-slate-500'
                  }>
                  {goal.status === 'active' ? 'Aktif' : goal.status}
                </Text>
              </View>
            </View>

            {groupTotalProgress && (
              <>
                <View className="mb-1 flex-row justify-between">
                  <Text className="text-xs text-slate-500">
                    {groupTotalProgress.total} / {groupTotalProgress.target} {goal.unit}
                  </Text>
                  <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    %
                    {Math.min(
                      100,
                      Math.round((groupTotalProgress.total / groupTotalProgress.target) * 100)
                    )}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <View
                    className="h-full rounded-full bg-teal-500"
                    style={{
                      width: `${Math.min(100, (groupTotalProgress.total / groupTotalProgress.target) * 100)}%`,
                    }}
                  />
                </View>
              </>
            )}

            <Text className="mt-2 text-xs text-slate-400">
              {new Date(goal.start_date).toLocaleDateString('tr-TR')}
              {goal.end_date
                ? ` – ${new Date(goal.end_date).toLocaleDateString('tr-TR')}`
                : ' – Süresiz'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function LeaderboardTab({
  leaderboard,
  period,
  onPeriodChange,
  currentUserId,
  isDark,
}: {
  leaderboard: LeaderboardEntry[];
  period: LeaderboardPeriod;
  onPeriodChange: (p: LeaderboardPeriod) => void;
  currentUserId: string;
  isDark: boolean;
}) {
  return (
    <View>
      {/* Period selector */}
      <View className="mb-4 flex-row gap-2">
        {(['all', 'week', 'month'] as LeaderboardPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => onPeriodChange(p)}
            className={[
              'flex-1 rounded-xl py-2',
              period === p ? 'bg-teal-600 dark:bg-teal-500' : 'bg-slate-100 dark:bg-slate-800',
            ].join(' ')}>
            <Text
              className={
                period === p
                  ? 'text-center text-xs font-bold text-white'
                  : 'text-center text-xs font-semibold text-slate-500 dark:text-slate-400'
              }>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {leaderboard.map((entry, index) => {
        const isCurrent = entry.id === currentUserId;
        const points = period === 'all' ? entry.total_points : entry.period_points;
        const rankColors = ['#fbbf24', '#94a3b8', '#92400e'];
        const rankColor = index < 3 ? rankColors[index] : null;

        return (
          <View
            key={entry.id}
            className={[
              'mb-2 flex-row items-center rounded-2xl border p-3',
              isCurrent
                ? 'border-teal-500/40 bg-teal-50 dark:bg-teal-500/10'
                : 'border-slate-100 bg-white dark:border-slate-700/50 dark:bg-slate-950',
            ].join(' ')}>
            <View
              className="mr-3 h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: rankColor ? `${rankColor}22` : 'transparent' }}>
              <Text
                className="text-sm font-black"
                style={{ color: rankColor ?? (isDark ? '#94a3b8' : '#64748b') }}>
                {index + 1}
              </Text>
            </View>
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              {entry.avatar_url ? (
                <Image source={{ uri: entry.avatar_url }} className="h-9 w-9 rounded-full" />
              ) : (
                <Ionicons name="person" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                {entry.first_name} {entry.last_name}
                {isCurrent && (
                  <Text className="text-xs text-teal-600 dark:text-teal-400"> (Sen)</Text>
                )}
              </Text>
            </View>
            <Text className="text-sm font-black text-teal-600 dark:text-teal-400">
              {points ?? 0} puan
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MembersTab({
  members,
  isOwner,
  isAdmin,
  currentUserId,
  groupId,
  isDark,
  onKick,
  onRoleChange,
}: {
  members: any[];
  isOwner: boolean;
  isAdmin: boolean;
  currentUserId: string;
  groupId: string;
  isDark: boolean;
  onKick: (memberId: string) => void;
  onRoleChange: (memberId: string, role: 'moderator' | 'member') => void;
}) {
  const roleLabel: Record<string, string> = {
    owner: 'Yönetici',
    moderator: 'Moderatör',
    member: 'Üye',
  };

  function confirmKick(member: any) {
    alert.confirm(
      'Üyeyi Çıkar',
      `${member.first_name} ${member.last_name} adlı üyeyi gruptan çıkarmak istiyor musunuz?`,
      () => onKick(member.user_id),
      'Çıkar',
      'İptal',
      true,
    );
  }

  function confirmRoleChange(member: any) {
    const newRole = member.role === 'moderator' ? 'member' : 'moderator';
    const action = newRole === 'moderator' ? 'Moderatör Yap' : 'Üye Yap';
    alert.confirm(
      action,
      `${member.first_name} ${member.last_name} adlı kişiyi ${newRole === 'moderator' ? 'moderatör' : 'normal üye'} yapmak istiyor musunuz?`,
      () => onRoleChange(member.user_id, newRole),
      action,
      'İptal',
    );
  }

  return (
    <View className="gap-2">
      {members.map((member) => {
        const isCurrent = member.user_id === currentUserId;
        const canManage = isOwner && !isCurrent && member.role !== 'owner';

        return (
          <View
            key={member.user_id}
            className={[
              'flex-row items-center rounded-2xl border p-3',
              isCurrent
                ? 'border-teal-500/40 bg-teal-50 dark:bg-teal-500/10'
                : 'border-slate-100 bg-white dark:border-slate-700/50 dark:bg-slate-800/60',
            ].join(' ')}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              {member.avatar_url ? (
                <Image source={{ uri: member.avatar_url }} className="h-10 w-10 rounded-full" />
              ) : (
                <Ionicons name="person" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                {member.first_name} {member.last_name}
              </Text>
              <View
                className={[
                  'mt-0.5 self-start rounded-full px-2 py-0.5',
                  member.role === 'owner'
                    ? 'bg-amber-100 dark:bg-amber-500/20'
                    : member.role === 'moderator'
                      ? 'bg-teal-100 dark:bg-teal-500/20'
                      : 'bg-slate-100 dark:bg-slate-700',
                ].join(' ')}>
                <Text
                  className={[
                    'text-[10px] font-bold',
                    member.role === 'owner'
                      ? 'text-amber-700 dark:text-amber-400'
                      : member.role === 'moderator'
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')}>
                  {roleLabel[member.role] ?? member.role}
                </Text>
              </View>
            </View>
            {canManage && (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => confirmRoleChange(member)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
                  <Ionicons
                    name={
                      member.role === 'moderator' ? 'arrow-down-circle-outline' : 'shield-outline'
                    }
                    size={18}
                    color={isDark ? '#2dd4bf' : '#0f766e'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmKick(member)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                  <Ionicons name="remove-circle-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
