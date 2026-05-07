import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useChallengeStore } from '@/modules/challenge/challenge.store';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Sona erdi';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} gün kaldı`;
  return `${hours} saat kaldı`;
}

const GOAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  prayer_count: 'sunny',
  prayer_time: 'moon',
  streak: 'flame',
  kaza_complete: 'time',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; raw: string }> = {
  weekly: {
    bg: 'bg-teal-700/10 dark:bg-teal-500/15',
    text: 'text-teal-700 dark:text-teal-400',
    raw: '#0f766e',
  },
  monthly: {
    bg: 'bg-indigo-600/10 dark:bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    raw: '#4f46e5',
  },
  special: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    raw: '#f59e0b',
  },
};

const TYPE_LABELS: Record<string, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  special: 'Özel',
};

function ChallengeCard({ challenge, onJoin }: { challenge: any; onJoin: () => void }) {
  const { isDark } = useTheme();
  const isJoined = !!challenge.user_challenge_id;
  const isCompleted = !!challenge.is_completed;
  const progress = isJoined ? (challenge.progress ?? 0) : 0;
  const percent = Math.min(100, Math.round((progress / challenge.goal_value) * 100));

  const typeStyles = TYPE_COLORS[challenge.type] || TYPE_COLORS.weekly;
  const icon = GOAL_ICONS[challenge.goal_type] || 'trophy';

  return (
    <Animated.View
      entering={FadeInDown}
      className={`mb-4 overflow-hidden rounded-[24px] border bg-white shadow-sm shadow-black/5 dark:bg-slate-800/70 dark:shadow-none ${
        isCompleted
          ? 'border-green-200 dark:border-green-400/30'
          : 'border-slate-200 dark:border-slate-700'
      }`}>
      <View className={`flex-row items-center justify-between px-5 py-3 ${typeStyles.bg}`}>
        <View className="flex-row items-center gap-2">
          <View
            className={`h-7 w-7 items-center justify-center rounded-xl bg-black/5 dark:bg-white/10`}>
            <Ionicons name={icon} size={14} color={isDark ? '#fff' : typeStyles.raw} />
          </View>
          <View className="rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
            <Text className={`text-[10px] font-black uppercase tracking-widest ${typeStyles.text}`}>
              {TYPE_LABELS[challenge.type] || challenge.type}
            </Text>
          </View>
        </View>

        {isCompleted ? (
          <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-3 py-1 dark:bg-green-500/20">
            <Ionicons name="checkmark-circle" size={14} color={isDark ? '#4ade80' : '#16a34a'} />
            <Text className="text-[10px] font-black text-green-700 dark:text-green-400">
              Tamamlandı
            </Text>
          </View>
        ) : (
          <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
            {timeLeft(challenge.ends_at)}
          </Text>
        )}
      </View>

      <View className="px-5 py-4">
        <Text className="mb-1 text-base font-black text-slate-900 dark:text-white">
          {challenge.title}
        </Text>
        <Text className="mb-4 text-sm leading-5 text-slate-500 dark:text-slate-300">
          {challenge.description}
        </Text>

        {isJoined && (
          <View className="mb-4">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="text-xs font-bold text-slate-500 dark:text-slate-300">İlerleme</Text>
              <Text className={`text-xs font-black ${typeStyles.text}`}>
                {progress} / {challenge.goal_value}
              </Text>
            </View>
            <View className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900/40">
              <View
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: typeStyles.raw }}
              />
            </View>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text className="text-sm font-black text-slate-900 dark:text-white">
              +{challenge.bonus_points} Puan
            </Text>
          </View>

          {!isJoined && !isCompleted && (
            <TouchableOpacity
              onPress={onJoin}
              style={{ backgroundColor: typeStyles.raw }}
              className="rounded-2xl px-5 py-2.5">
              <Text className="text-sm font-black text-white">Katıl</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function ChallengeScreen() {
  const { active, isLoading, fetchActive, joinChallenge } = useChallengeStore();
  const { isDark } = useTheme();

  const load = useCallback(async () => {
    await fetchActive();
  }, [fetchActive]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (challenge: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await joinChallenge(challenge.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Harika! 🎯',
        `"${challenge.title}" challenge'ına katıldın! Namaz kılmaya devam et.`
      );
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Bir sorun oluştu.');
    }
  };

  const joinedChallenges = active.filter((c) => c.user_challenge_id && !c.is_completed);
  const availableChallenges = active.filter((c) => !c.user_challenge_id);
  const completedChallenges = active.filter((c) => c.is_completed);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
            colors={[isDark ? '#14b8a6' : '#0f766e']}
          />
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>
        <View className="mx-4 mb-6 overflow-hidden rounded-[28px] bg-teal-700 p-5 dark:bg-teal-900">
          <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <View className="flex-row gap-6">
            <View>
              <Text className="text-2xl font-black text-white">{joinedChallenges.length}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                Aktif
              </Text>
            </View>
            <View className="w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">{completedChallenges.length}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                Tamamlanan
              </Text>
            </View>
            <View className="w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">{availableChallenges.length}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-white/80">
                Bekleyen
              </Text>
            </View>
          </View>
        </View>

        {joinedChallenges.length > 0 && (
          <View className="mb-4 px-4">
            <Text className="mb-3 text-base font-black text-slate-900 dark:text-white">
              Devam Eden
            </Text>
            {joinedChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => handleJoin(c)} />
            ))}
          </View>
        )}

        {availableChallenges.length > 0 && (
          <View className="mb-4 px-4">
            <Text className="mb-3 text-base font-black text-slate-900 dark:text-white">
              Katılabileceklerin
            </Text>
            {availableChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => handleJoin(c)} />
            ))}
          </View>
        )}

        {completedChallenges.length > 0 && (
          <View className="mb-4 px-4">
            <Text className="mb-3 text-base font-black text-slate-900 dark:text-white">
              Tamamlananlar ✅
            </Text>
            {completedChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => {}} />
            ))}
          </View>
        )}

        {active.length === 0 && !isLoading && (
          <View className="mx-4 items-center rounded-[28px] border border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800/70">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="trophy-outline" size={40} color={isDark ? '#4b5563' : '#94a3b8'} />
            </View>
            <Text className="text-base font-black text-slate-900 dark:text-white">
              Challenge Yok
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-300">
              Yakında yeni challenge’lar eklenecek!
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
