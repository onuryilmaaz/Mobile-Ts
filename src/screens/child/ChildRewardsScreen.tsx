import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useFamilyStore } from '@/modules/family/family.store';
import { CHILD_BADGE_DETAILS } from '@/modules/family/family.types';
import { useTheme } from '@/hooks/useTheme';

export default function ChildRewardsScreen() {
  const { childSession, childStats, rewards, fetchChildStats, fetchRewards, redeemReward } = useFamilyStore();
  const { isDark } = useTheme();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [confirmReward, setConfirmReward] = useState<{ id: string; title: string; cost: number } | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (childSession?.childId) {
      fetchChildStats(childSession.childId);
      fetchRewards(childSession.childId);
    }
  }, [childSession?.childId]);

  const handleRedeem = async () => {
    if (!confirmReward) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRedeeming(confirmReward.id);
    const title = confirmReward.title;
    try {
      await redeemReward(confirmReward.id);
      if (childSession?.childId) fetchChildStats(childSession.childId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmReward(null);
      setRedeemSuccess(title);
      setTimeout(() => setRedeemSuccess(null), 2500);
    } catch (e: any) {
      setConfirmReward(null);
    } finally {
      setRedeeming(null);
    }
  };

  const availableRewards = rewards.filter((r) => !r.is_redeemed);
  const redeemedRewards = rewards.filter((r) => r.is_redeemed);
  const stars = childStats?.total_stars ?? 0;
  const level = childStats?.level ?? 1;
  const levelName = childStats?.level_name ?? 'Minik Mümin';
  const nextLevelStars = childStats?.next_level_stars;
  const levelProgress = nextLevelStars ? Math.min(100, (stars / nextLevelStars) * 100) : 100;

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}>

      {/* Yıldız + seviye kartı */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70">
                Toplam Yıldızım
              </Text>
              <Text className="mt-1 text-4xl font-black text-amber-600 dark:text-amber-400">
                {stars} ⭐
              </Text>
              <Text className="mt-0.5 text-xs font-semibold text-amber-600/80 dark:text-amber-400/80">
                Lv.{level} — {levelName}
              </Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20">
              <Ionicons name="star" size={30} color={isDark ? '#fbbf24' : '#d97706'} />
            </View>
          </View>
          {nextLevelStars && (
            <>
              <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-500/20">
                <View className="h-full rounded-full bg-amber-500" style={{ width: `${levelProgress}%` }} />
              </View>
              <Text className="mt-1.5 text-right text-xs font-bold text-amber-600/70 dark:text-amber-400/70">
                {nextLevelStars - stars} ⭐ kaldı
              </Text>
            </>
          )}
        </View>
      </Animated.View>

      {/* Rozetler */}
      {(childStats?.badges ?? []).length > 0 && (
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Rozetlerim 🏅
            </Text>
            <View className="flex-row flex-wrap gap-4">
              {childStats!.badges.map((b) => {
                const detail = CHILD_BADGE_DETAILS[b.badge_type];
                return (
                  <View key={b.badge_type} className="w-14 items-center gap-1.5">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                      <Text style={{ fontSize: 24 }}>{detail?.emoji ?? '🏅'}</Text>
                    </View>
                    <Text className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400" numberOfLines={2}>
                      {detail?.name ?? b.badge_type}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Mevcut ödüller */}
      {availableRewards.length > 0 && (
        <>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Ödüllerim ({availableRewards.length})
          </Text>
          {availableRewards.map((reward, i) => {
            const canAfford = stars >= reward.cost_stars;
            return (
              <Animated.View key={reward.id} entering={FadeInDown.delay(i * 60 + 120).duration(300)}>
                <View className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${!canAfford ? 'opacity-50' : ''}`}>
                  <View className="flex-row items-center gap-3 p-4">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
                      <Ionicons name="gift-outline" size={22} color={isDark ? '#2dd4bf' : '#0f766e'} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-slate-900 dark:text-white">{reward.title}</Text>
                      <View className="mt-0.5 flex-row items-center gap-1">
                        <Text className={`text-sm font-bold ${canAfford ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {reward.cost_stars} ⭐
                        </Text>
                        <Text className="text-xs text-slate-400 dark:text-slate-600">gerekli</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setConfirmReward({ id: reward.id, title: reward.title, cost: reward.cost_stars });
                      }}
                      disabled={!canAfford || redeeming === reward.id}
                      className={`rounded-2xl px-4 py-2.5 ${canAfford ? 'bg-teal-600 dark:bg-teal-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <Text className={`text-sm font-black ${canAfford ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                        {canAfford ? 'Al!' : 'Yetmez'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </>
      )}

      {availableRewards.length === 0 && (
        <View className="items-center gap-3 py-8">
          <Ionicons name="gift-outline" size={40} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text className="text-center text-slate-400 dark:text-slate-600">
            Henüz ödül yok.{'\n'}Annen veya baban ödül eklediğinde burada görünür!
          </Text>
        </View>
      )}

      {/* Kullanılan ödüller */}
      {redeemedRewards.length > 0 && (
        <>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Kullanılan Ödüller
          </Text>
          {redeemedRewards.map((reward) => (
            <View key={reward.id} className="flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 opacity-50 dark:border-slate-800/50 dark:bg-slate-900/50">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Ionicons name="checkmark-circle" size={20} color={isDark ? '#334155' : '#94a3b8'} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-400 line-through dark:text-slate-600">{reward.title}</Text>
                <Text className="text-xs text-slate-400 dark:text-slate-600">{reward.cost_stars} ⭐ kullanıldı</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Onay modalı */}
      <Modal visible={!!confirmReward} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <Animated.View entering={ZoomIn.duration(250)} className="w-full">
            <View className="w-full rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <Text className="mb-1 text-center text-xl font-black text-slate-900 dark:text-white">
                Ödülü Kullan
              </Text>
              <Text className="mb-5 text-center text-slate-500 dark:text-slate-400">
                <Text className="font-bold text-slate-900 dark:text-white">"{confirmReward?.title}"</Text>
                {' '}ödülünü {confirmReward?.cost} ⭐ yıldız karşılığında almak istiyor musun?
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setConfirmReward(null)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-3.5 items-center dark:border-slate-700 dark:bg-slate-800">
                  <Text className="font-black text-slate-500 dark:text-slate-400">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRedeem}
                  disabled={!!redeeming}
                  className="flex-1 rounded-2xl bg-teal-600 py-3.5 items-center dark:bg-teal-500">
                  <Text className="font-black text-white">
                    {redeeming ? '...' : 'Evet, Al! 🎁'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Başarı modalı */}
      <Modal visible={!!redeemSuccess} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <Animated.View entering={ZoomIn.duration(300)}>
            <View className="w-full rounded-3xl border border-slate-200 bg-white p-8 items-center gap-3 dark:border-slate-800 dark:bg-slate-900">
              <Text style={{ fontSize: 56 }}>🎁</Text>
              <Text className="text-2xl font-black text-teal-600 dark:text-teal-400">Tebrikler!</Text>
              <Text className="text-base text-center font-semibold text-slate-600 dark:text-slate-300">
                "{redeemSuccess}" ödülünü kullandın!
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}
