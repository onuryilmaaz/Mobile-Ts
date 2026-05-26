import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useFamilyStore } from '@/modules/family/family.store';
import { useTheme } from '@/hooks/useTheme';

type Gender = 'erkek' | 'kız' | null | undefined;

function genderAccent(gender: Gender, isDark: boolean) {
  if (gender === 'erkek') {
    return {
      primary: isDark ? '#10b981' : '#059669',
      primaryBg: isDark ? '#022c22' : '#ecfdf5',
      primaryBorder: isDark ? '#065f46' : '#6ee7b7',
      progressBg: isDark ? '#064e3b' : '#d1fae5',
    };
  }
  if (gender === 'kız') {
    return {
      primary: isDark ? '#a78bfa' : '#7c3aed',
      primaryBg: isDark ? '#1e1b4b' : '#f5f3ff',
      primaryBorder: isDark ? '#3730a3' : '#c4b5fd',
      progressBg: isDark ? '#2e1065' : '#ede9fe',
    };
  }
  return {
    primary: isDark ? '#2dd4bf' : '#0d9488',
    primaryBg: isDark ? '#021a1a' : '#f0fdfa',
    primaryBorder: isDark ? '#134e4a' : '#99f6e4',
    progressBg: isDark ? '#042f2e' : '#ccfbf1',
  };
}

export default function ChildRewardsScreen() {
  const { childSession, childStats, rewards, fetchChildStats, fetchRewards, redeemReward } =
    useFamilyStore();
  const { isDark } = useTheme();
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [confirmReward, setConfirmReward] = useState<{
    id: string;
    title: string;
    cost: number;
  } | null>(null);
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
    } catch {
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
  const gender = childSession?.gender;
  const a = genderAccent(gender, isDark);

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}>

      {/* Yıldız + Seviye kartı */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View
          className="overflow-hidden rounded-3xl p-5"
          style={{
            backgroundColor: a.primaryBg,
            borderWidth: 1,
            borderColor: a.primaryBorder,
          }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: `${a.primary}99` }}>
                Toplam Yıldızım
              </Text>
              <Text className="mt-1 text-4xl font-black" style={{ color: a.primary }}>
                {stars} ⭐
              </Text>
              <Text
                className="mt-0.5 text-sm font-bold"
                style={{ color: `${a.primary}cc` }}>
                Lv.{level} — {levelName}
              </Text>
            </View>
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${a.primary}25` }}>
              <Text style={{ fontSize: 34 }}>⭐</Text>
            </View>
          </View>
          {nextLevelStars && (
            <>
              <View
                className="mt-4 h-3 overflow-hidden rounded-full"
                style={{ backgroundColor: a.progressBg }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${levelProgress}%`, backgroundColor: a.primary }}
                />
              </View>
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text className="text-xs font-semibold" style={{ color: `${a.primary}80` }}>
                  {stars} / {nextLevelStars} ⭐
                </Text>
                <Text className="text-xs font-bold" style={{ color: `${a.primary}99` }}>
                  Sonraki seviyeye {nextLevelStars - stars} ⭐ kaldı
                </Text>
              </View>
            </>
          )}
        </View>
      </Animated.View>

      {/* Rozetler */}
      {(childStats?.badges ?? []).length > 0 && (
        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Rozetlerim 🏅
            </Text>
            <View className="flex-row flex-wrap gap-4">
              {childStats!.badges.map((b) => (
                <View key={b.badge_type} className="items-center gap-1.5" style={{ width: 60 }}>
                  <View
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${a.primary}18`,
                      borderWidth: 1,
                      borderColor: `${a.primary}30`,
                    }}>
                    <Text style={{ fontSize: 26 }}>{b.emoji ?? '🏅'}</Text>
                  </View>
                  <Text
                    className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                    numberOfLines={2}>
                    {b.name ?? b.badge_type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Mevcut ödüller */}
      {availableRewards.length > 0 && (
        <>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Ödüllerim 🎁 ({availableRewards.length})
          </Text>
          {availableRewards.map((reward, i) => {
            const canAfford = stars >= reward.cost_stars;
            return (
              <Animated.View
                key={reward.id}
                entering={FadeInDown.delay(i * 60 + 120).duration(300)}>
                <View
                  className={`rounded-3xl border border-slate-200 bg-white shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${!canAfford ? 'opacity-50' : ''}`}>
                  <View className="flex-row items-center gap-3 p-4">
                    <View
                      className="h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${a.primary}18` }}>
                      <Text style={{ fontSize: 28 }}>🎁</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-slate-900 dark:text-white">
                        {reward.title}
                      </Text>
                      <View className="mt-0.5 flex-row items-center gap-1.5">
                        <Text
                          className="text-sm font-bold"
                          style={{
                            color: canAfford ? a.primary : isDark ? '#475569' : '#94a3b8',
                          }}>
                          {reward.cost_stars} ⭐
                        </Text>
                        <Text className="text-xs text-slate-400 dark:text-slate-600">gerekli</Text>
                        {canAfford && (
                          <View
                            className="rounded-full px-2 py-0.5"
                            style={{ backgroundColor: `${a.primary}20` }}>
                            <Text
                              className="text-[10px] font-bold"
                              style={{ color: a.primary }}>
                              Alabilirsin!
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setConfirmReward({
                          id: reward.id,
                          title: reward.title,
                          cost: reward.cost_stars,
                        });
                      }}
                      disabled={!canAfford || redeeming === reward.id}
                      className="rounded-2xl px-4 py-3"
                      style={{
                        backgroundColor: canAfford
                          ? a.primary
                          : isDark ? '#1e293b' : '#f1f5f9',
                      }}>
                      <Text
                        className="text-sm font-black"
                        style={{
                          color: canAfford ? 'white' : isDark ? '#475569' : '#94a3b8',
                        }}>
                        {canAfford ? 'Al!' : '😔'}
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
        <View className="items-center gap-4 py-12">
          <Text style={{ fontSize: 52 }}>🎁</Text>
          <Text className="text-center font-bold text-slate-400 dark:text-slate-600">
            Henüz ödül yok.{'\n'}Annen veya baban eklediğinde burada görünür!
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
            <View
              key={reward.id}
              className="flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 opacity-50 dark:border-slate-800/50 dark:bg-slate-900/50">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <Text style={{ fontSize: 18 }}>✅</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-400 line-through dark:text-slate-600">
                  {reward.title}
                </Text>
                <Text className="text-xs text-slate-400 dark:text-slate-600">
                  {reward.cost_stars} ⭐ kullanıldı
                </Text>
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
              <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>🎁</Text>
              <Text className="mb-1 text-center text-xl font-black text-slate-900 dark:text-white">
                Ödülü Kullan
              </Text>
              <Text className="mb-5 text-center text-slate-500 dark:text-slate-400">
                <Text className="font-bold text-slate-900 dark:text-white">
                  "{confirmReward?.title}"
                </Text>
                {'\n'}{confirmReward?.cost} ⭐ yıldız harcanacak.
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setConfirmReward(null)}
                  className="flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 py-3.5 dark:border-slate-700 dark:bg-slate-800">
                  <Text className="font-black text-slate-500 dark:text-slate-400">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRedeem}
                  disabled={!!redeeming}
                  className="flex-1 items-center rounded-2xl py-3.5"
                  style={{ backgroundColor: a.primary }}>
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
            <View className="w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
              <Text style={{ fontSize: 64 }}>🎊</Text>
              <Text className="text-2xl font-black" style={{ color: a.primary }}>
                Tebrikler!
              </Text>
              <Text className="text-center text-base font-semibold text-slate-600 dark:text-slate-300">
                "{redeemSuccess}"{'\n'}ödülünü kazandın! Maşa'Allah! 🌟
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}
