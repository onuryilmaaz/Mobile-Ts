/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { TASK_TYPE_META } from '@/modules/family/family.types';
import { useTheme } from '@/hooks/useTheme';

export default function PendingApprovalsScreen() {
  const { pendingApprovals, fetchPendingApprovals, reviewCompletion, isLoading } = useFamilyStore();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  if (pendingApprovals.length === 0) {
    return (
      <Screen safeAreaEdges={['left', 'right']}>
        <View className="flex-1 items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-500/10">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={40}
              color={isDark ? '#2dd4bf' : '#0f766e'}
            />
          </View>
          <View className="items-center gap-1">
            <Text className="text-base font-black text-slate-900 dark:text-white">
              Onay Bekleyen Yok
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Çocuklarının tüm görevleri incelendi.
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchPendingApprovals}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
          />
        }
        showsVerticalScrollIndicator={false}>
        {pendingApprovals.map((item, i) => {
          const meta = TASK_TYPE_META[item.task_type ?? 'custom'];
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).duration(300)}>
              <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                <View className="p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
                      <Text style={{ fontSize: 24 }}>{item.avatar_emoji ?? '🌙'}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-slate-900 dark:text-white">
                        {item.child_name}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-1.5">
                        <View
                          className="h-5 w-5 items-center justify-center rounded-full border"
                          style={{
                            backgroundColor: isDark ? `${meta.color}20` : `${meta.color}15`,
                            borderColor: `${meta.color}40`,
                          }}>
                          <Text style={{ fontSize: 10 }}>{meta.emoji}</Text>
                        </View>
                        <Text className="text-sm text-slate-600 dark:text-slate-300">
                          {item.title}
                        </Text>
                      </View>
                    </View>
                    <View className="rounded-full bg-amber-50 px-2.5 py-1 dark:bg-amber-500/10">
                      <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        +{'⭐'.repeat(Math.min(item.reward_stars ?? 1, 5))}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row border-t border-slate-100 dark:border-slate-800">
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      reviewCompletion(item.id, false);
                    }}
                    className="flex-1 flex-row items-center justify-center gap-2 border-r border-slate-100 py-3.5 dark:border-slate-800">
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color={isDark ? '#f87171' : '#ef4444'}
                    />
                    <Text className="text-sm font-bold text-red-500 dark:text-red-400">Reddet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      reviewCompletion(item.id, true);
                    }}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3.5">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color={isDark ? '#2dd4bf' : '#0f766e'}
                    />
                    <Text className="text-sm font-black text-teal-700 dark:text-teal-400">
                      Onayla
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
