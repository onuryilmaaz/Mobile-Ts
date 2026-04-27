import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useChallengeStore } from '@/modules/challenge/challenge.store';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function timeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Sona erdi';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days  = Math.floor(hours / 24);
  if (days > 0) return `${days} gün kaldı`;
  return `${hours} saat kaldı`;
}

const GOAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  prayer_count: 'sunny',
  prayer_time:  'moon',
  streak:       'flame',
  kaza_complete:'time',
};

const TYPE_COLORS: Record<string, string> = {
  weekly:  '#0f766e',
  monthly: '#6366f1',
  special: '#f59e0b',
};

const TYPE_LABELS: Record<string, string> = {
  weekly:  'Haftalık',
  monthly: 'Aylık',
  special: 'Özel',
};

// ─────────────────────────────────────────────
// CHALLENGE CARD
// ─────────────────────────────────────────────
function ChallengeCard({ challenge, onJoin }: { challenge: any; onJoin: () => void }) {
  const isJoined    = !!challenge.user_challenge_id;
  const isCompleted = !!challenge.is_completed;
  const progress    = isJoined ? (challenge.progress ?? 0) : 0;
  const percent     = Math.min(100, Math.round((progress / challenge.goal_value) * 100));
  const color       = TYPE_COLORS[challenge.type] || '#0f766e';
  const icon        = GOAL_ICONS[challenge.goal_type] || 'trophy';

  return (
    <Animated.View
      entering={FadeInDown}
      className={`mb-4 overflow-hidden rounded-[24px] border bg-white shadow-sm ${
        isCompleted ? 'border-green-200' : 'border-slate-100'
      }`}>
      {/* Header band */}
      <View className="flex-row items-center justify-between px-5 py-3" style={{ backgroundColor: `${color}12` }}>
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}22` }}>
            <Ionicons name={icon} size={14} color={color} />
          </View>
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${color}22` }}>
            <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
              {TYPE_LABELS[challenge.type] || challenge.type}
            </Text>
          </View>
        </View>

        {isCompleted ? (
          <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-3 py-1">
            <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
            <Text className="text-[10px] font-black text-green-700">Tamamlandı</Text>
          </View>
        ) : (
          <Text className="text-[10px] font-bold text-slate-400">{timeLeft(challenge.ends_at)}</Text>
        )}
      </View>

      {/* Body */}
      <View className="px-5 py-4">
        <Text className="mb-1 text-base font-black text-slate-800">{challenge.title}</Text>
        <Text className="mb-4 text-sm text-slate-500 leading-5">{challenge.description}</Text>

        {/* Progress */}
        {isJoined && (
          <View className="mb-4">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="text-xs font-bold text-slate-400">İlerleme</Text>
              <Text className="text-xs font-black" style={{ color }}>
                {progress} / {challenge.goal_value}
              </Text>
            </View>
            <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <View className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
            </View>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text className="text-sm font-black text-slate-700">+{challenge.bonus_points} Puan</Text>
          </View>

          {!isJoined && !isCompleted && (
            <TouchableOpacity
              onPress={onJoin}
              className="rounded-2xl px-5 py-2.5"
              style={{ backgroundColor: color }}>
              <Text className="text-sm font-black text-white">Katıl</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function ChallengeScreen() {
  const { active, isLoading, fetchActive, joinChallenge } = useChallengeStore();

  const load = useCallback(async () => {
    await fetchActive();
  }, [fetchActive]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (challenge: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await joinChallenge(challenge.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Harika! 🎯', `"${challenge.title}" challenge'ına katıldın! Namaz kılmaya devam et.`);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Bir sorun oluştu.');
    }
  };

  const joinedChallenges     = active.filter(c => c.user_challenge_id && !c.is_completed);
  const availableChallenges  = active.filter(c => !c.user_challenge_id);
  const completedChallenges  = active.filter(c => c.is_completed);

  return (
    <Screen className="bg-slate-50" safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>

        {/* ── Stats Banner ── */}
        <View className="mx-4 mb-6 overflow-hidden rounded-[28px] bg-primary-700 p-5">
          <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <View className="flex-row gap-6">
            <View>
              <Text className="text-2xl font-black text-white">{joinedChallenges.length}</Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary-200">Aktif</Text>
            </View>
            <View className="w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">{completedChallenges.length}</Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary-200">Tamamlanan</Text>
            </View>
            <View className="w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">{availableChallenges.length}</Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary-200">Bekleyen</Text>
            </View>
          </View>
        </View>

        {/* ── Active Challenges ── */}
        {joinedChallenges.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="mb-3 text-base font-black text-slate-800">Devam Eden</Text>
            {joinedChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => handleJoin(c)} />
            ))}
          </View>
        )}

        {/* ── Available Challenges ── */}
        {availableChallenges.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="mb-3 text-base font-black text-slate-800">Katılabileceklerin</Text>
            {availableChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => handleJoin(c)} />
            ))}
          </View>
        )}

        {/* ── Completed ── */}
        {completedChallenges.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="mb-3 text-base font-black text-slate-800">Tamamlananlar ✅</Text>
            {completedChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => {}} />
            ))}
          </View>
        )}

        {/* Empty state */}
        {active.length === 0 && !isLoading && (
          <View className="mx-4 items-center rounded-[28px] border border-slate-100 bg-white py-16">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="trophy-outline" size={40} color="#cbd5e1" />
            </View>
            <Text className="text-base font-black text-slate-700">Challenge Yok</Text>
            <Text className="mt-1 text-center text-sm text-slate-400">
              Yakında yeni challenge'lar eklenecek!
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
