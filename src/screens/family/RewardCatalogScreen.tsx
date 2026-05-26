/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { alert } from '@/store/alert.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';

type Route = RouteProp<FamilyStackParamList, 'RewardCatalog'>;

export default function RewardCatalogScreen() {
  const route = useRoute<Route>();
  const { childId } = route.params;
  const { isDark } = useTheme();
  const { rewards, childStats, fetchRewards, fetchChildStats, createReward, deleteReward } =
    useFamilyStore();

  const [title, setTitle] = useState('');
  const [costStars, setCostStars] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRewards(childId);
    fetchChildStats(childId);
  }, [childId]);

  const handleAdd = async () => {
    if (!title.trim() || !costStars) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdding(true);
    try {
      await createReward(childId, title.trim(), Number(costStars));
      setTitle('');
      setCostStars('');
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (rewardId: string, rewardTitle: string) => {
    alert.confirm(
      'Ödülü Sil',
      `"${rewardTitle}" silinsin mi?`,
      () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        deleteReward(rewardId);
      },
      'Sil',
      'İptal',
      true,
    );
  };

  const available = rewards.filter((r) => !r.is_redeemed);
  const redeemed = rewards.filter((r) => r.is_redeemed);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Yıldız özeti */}
        <View className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70">
                Mevcut Yıldız
              </Text>
              <Text className="mt-1 text-4xl font-black text-amber-600 dark:text-amber-400">
                {childStats?.total_stars ?? 0} ⭐
              </Text>
              <Text className="mt-1 text-xs font-semibold text-amber-600/80 dark:text-amber-400/80">
                Lv.{childStats?.level ?? 1} — {childStats?.level_name ?? 'Minik Mümin'}
              </Text>
            </View>
            <Ionicons
              name="gift"
              size={48}
              color={isDark ? 'rgba(251,191,36,0.3)' : 'rgba(217,119,6,0.2)'}
            />
          </View>
        </View>

        {/* Yeni ödül ekle */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowForm(!showForm);
          }}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-400 py-3 dark:border-teal-600">
          <Ionicons
            name={showForm ? 'remove-circle-outline' : 'add-circle-outline'}
            size={18}
            color={isDark ? '#2dd4bf' : '#0f766e'}
          />
          <Text className="text-sm font-bold text-teal-700 dark:text-teal-400">
            {showForm ? 'İptal' : 'Yeni Ödül Ekle'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <Animated.View entering={FadeInDown.duration(250)}>
            <View className="gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <Text className="text-xs font-bold  tracking-widest text-slate-500 dark:text-slate-400">
                ÖDÜL BİLGİLERİ
              </Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Ödül adı (ör. Dondurma, Oyun vakti)"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
              <Input
                value={costStars}
                onChangeText={(t) => setCostStars(t.replace(/\D/g, ''))}
                placeholder="Kaç yıldız gerekli?"
                keyboardType="numeric"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
              <TouchableOpacity
                onPress={handleAdd}
                disabled={adding || !title.trim() || !costStars}
                className={`items-center rounded-2xl py-3.5 ${
                  adding || !title.trim() || !costStars
                    ? 'bg-slate-200 dark:bg-slate-800'
                    : 'bg-teal-600 dark:bg-teal-500'
                }`}>
                <Text
                  className={`font-black ${
                    adding || !title.trim() || !costStars
                      ? 'text-slate-400 dark:text-slate-600'
                      : 'text-white'
                  }`}>
                  {adding ? 'Ekleniyor...' : 'Ödül Ekle'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {available.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Aktif Ödüller ({available.length})
            </Text>
            {available.map((reward, i) => (
              <Animated.View key={reward.id} entering={FadeInDown.delay(i * 50).duration(300)}>
                <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
                    <Ionicons
                      name="gift-outline"
                      size={20}
                      color={isDark ? '#2dd4bf' : '#0f766e'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900 dark:text-white">{reward.title}</Text>
                    <View className="mt-0.5 flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {reward.cost_stars} ⭐
                      </Text>
                      <Text className="text-xs text-slate-400 dark:text-slate-600">gerekli</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(reward.id, reward.title)}
                    className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color={isDark ? '#f87171' : '#ef4444'}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {available.length === 0 && !showForm && (
          <View className="items-center gap-3 py-6">
            <Ionicons name="gift-outline" size={40} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text className="text-center text-slate-400 dark:text-slate-600">
              Henüz ödül eklenmedi.{'\n'}Çocuğuna motive edici ödüller ekle!
            </Text>
          </View>
        )}

        {redeemed.length > 0 && (
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Kullanılan Ödüller
            </Text>
            {redeemed.map((reward) => (
              <View
                key={reward.id}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 opacity-50 dark:border-slate-800/50 dark:bg-slate-900/50">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={isDark ? '#334155' : '#94a3b8'}
                  />
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
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
