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
import { useAppTheme } from '@/constants/theme';

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
  const { colors, isDark } = useAppTheme();
  const isJoined    = !!challenge.user_challenge_id;
  const isCompleted = !!challenge.is_completed;
  const progress    = isJoined ? (challenge.progress ?? 0) : 0;
  const percent     = Math.min(100, Math.round((progress / challenge.goal_value) * 100));
  const color       = TYPE_COLORS[challenge.type] || colors.teal;
  const icon        = GOAL_ICONS[challenge.goal_type] || 'trophy';

  return (
    <Animated.View
      entering={FadeInDown}
      style={{
        marginBottom: 16, overflow: 'hidden', borderRadius: 24, borderWidth: 1, backgroundColor: colors.card,
        borderColor: isCompleted ? (isDark ? 'rgba(74,222,128,0.3)' : '#bbf7d0') : colors.cardBorder,
        shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
      }}>
      {/* Header band */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: isDark ? `${color}15` : `${color}12` }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: isDark ? `${color}25` : `${color}22` }}>
            <Ionicons name={icon} size={14} color={color} />
          </View>
          <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: isDark ? `${color}25` : `${color}22` }}>
            <Text style={{ fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, color }}>
              {TYPE_LABELS[challenge.type] || challenge.type}
            </Text>
          </View>
        </View>

        {isCompleted ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, backgroundColor: isDark ? 'rgba(22,163,74,0.2)' : '#dcfce3', paddingHorizontal: 12, paddingVertical: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color={isDark ? '#4ade80' : '#16a34a'} />
            <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#4ade80' : '#15803d' }}>Tamamlandı</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textMuted }}>{timeLeft(challenge.ends_at)}</Text>
        )}
      </View>

      {/* Body */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ marginBottom: 4, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>{challenge.title}</Text>
        <Text style={{ marginBottom: 16, fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{challenge.description}</Text>

        {/* Progress */}
        {isJoined && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textMuted }}>İlerleme</Text>
              <Text style={{ fontSize: 12, fontWeight: '900', color }}>
                {progress} / {challenge.goal_value}
              </Text>
            </View>
            <View style={{ height: 10, overflow: 'hidden', borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <View style={{ height: '100%', borderRadius: 99, width: `${percent}%`, backgroundColor: color }} />
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>+{challenge.bonus_points} Puan</Text>
          </View>

          {!isJoined && !isCompleted && (
            <TouchableOpacity
              onPress={onJoin}
              style={{ borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: color }}>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>Katıl</Text>
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
  const { colors, isDark } = useAppTheme();

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
    <Screen  safeAreaEdges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>

        {/* ── Stats Banner ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 24, overflow: 'hidden', borderRadius: 28, backgroundColor: colors.trackerHeader, padding: 20 }}>
          <View style={{ position: 'absolute', right: -32, top: -32, height: 144, width: 144, borderRadius: 72, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ flexDirection: 'row', gap: 24 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{joinedChallenges.length}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? 'rgba(255,255,255,0.8)' : '#e0e7ff' }}>Aktif</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{completedChallenges.length}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? 'rgba(255,255,255,0.8)' : '#e0e7ff' }}>Tamamlanan</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{availableChallenges.length}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? 'rgba(255,255,255,0.8)' : '#e0e7ff' }}>Bekleyen</Text>
            </View>
          </View>
        </View>

        {/* ── Active Challenges ── */}
        {joinedChallenges.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Devam Eden</Text>
            {joinedChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => handleJoin(c)} />
            ))}
          </View>
        )}

        {/* ── Available Challenges ── */}
        {availableChallenges.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Katılabileceklerin</Text>
            {availableChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => handleJoin(c)} />
            ))}
          </View>
        )}

        {/* ── Completed ── */}
        {completedChallenges.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ marginBottom: 12, fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Tamamlananlar ✅</Text>
            {completedChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onJoin={() => {}} />
            ))}
          </View>
        )}

        {/* Empty state */}
        {active.length === 0 && !isLoading && (
          <View style={{ marginHorizontal: 16, alignItems: 'center', borderRadius: 28, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingVertical: 64 }}>
            <View style={{ marginBottom: 16, height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <Ionicons name="trophy-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.textPrimary }}>Challenge Yok</Text>
            <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 14, color: colors.textSecondary }}>
              Yakında yeni challenge'lar eklenecek!
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
