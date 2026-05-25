import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useFamilyStore } from '@/modules/family/family.store';
import { TASK_TYPE_META } from '@/modules/family/family.types';
import type { TaskType } from '@/modules/family/family.types';
import { useTheme } from '@/hooks/useTheme';

export default function ChildTasksScreen() {
  const { todayTasks, fetchTodayTasks, completeTask, isLoading, childStats, fetchChildStats, childSession } = useFamilyStore();
  const { isDark } = useTheme();
  const [completing, setCompleting] = useState<string | null>(null);
  const [celebrateTask, setCelebrateTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayTasks();
    if (childSession?.childId) fetchChildStats(childSession.childId);
  }, []);

  const done = todayTasks.filter((t) => t.status === 'approved' || t.status === 'pending');
  const pending = todayTasks.filter((t) => !t.status);

  const handleComplete = async (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompleting(taskId);
    try {
      await completeTask(taskId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrateTask(taskId);
      setTimeout(() => setCelebrateTask(null), 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Bir hata oluştu';
      Alert.alert('Hata', msg);
    } finally {
      setCompleting(null);
    }
  };

  const totalTasks = todayTasks.length;
  const completedCount = done.length;
  const progress = totalTasks > 0 ? completedCount / totalTasks : 0;

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={fetchTodayTasks}
          tintColor={isDark ? '#14b8a6' : '#0f766e'}
        />
      }>

      {/* İlerleme kartı */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View className="rounded-3xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-500/20 dark:bg-teal-500/10">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-teal-600/70 dark:text-teal-400/70">
                Bugünkü İlerleme
              </Text>
              <Text className="mt-0.5 text-2xl font-black text-teal-700 dark:text-teal-300">
                {completedCount}/{totalTasks} Görev
              </Text>
            </View>
            {completedCount === totalTasks && totalTasks > 0 ? (
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 dark:bg-teal-500">
                <Text style={{ fontSize: 22 }}>🎉</Text>
              </View>
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-500/20">
                <Ionicons name="checkmark-circle-outline" size={26} color={isDark ? '#2dd4bf' : '#0f766e'} />
              </View>
            )}
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-teal-100 dark:bg-teal-500/20">
            <View
              className="h-full rounded-full bg-teal-500"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          {completedCount === totalTasks && totalTasks > 0 && (
            <Text className="mt-2 text-center text-sm font-black text-teal-700 dark:text-teal-300">
              Harika! Bugün tüm görevleri tamamladın! 🌟
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Bekleyen görevler */}
      {pending.length > 0 && (
        <>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Yapılacaklar ({pending.length})
          </Text>
          {pending.map((task, i) => {
            const meta = TASK_TYPE_META[task.task_type as TaskType] ?? TASK_TYPE_META.custom;
            const isCompleting = completing === task.id;
            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                <View className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <View className="flex-row items-center gap-3 p-4">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-2xl border"
                      style={{
                        backgroundColor: isDark ? `${meta.color}20` : `${meta.color}15`,
                        borderColor: `${meta.color}40`,
                      }}>
                      <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-black text-slate-900 dark:text-white">{task.title}</Text>
                      {task.description && (
                        <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{task.description}</Text>
                      )}
                      <View className="mt-1 flex-row items-center gap-1">
                        <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {'⭐'.repeat(Math.min(task.reward_stars ?? 1, 5))} kazanacaksın
                        </Text>
                        {task.requires_approval && (
                          <View className="rounded-full bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                            <Text className="text-[9px] font-bold text-slate-500 dark:text-slate-400">onay gerekli</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleComplete(task.id)}
                    disabled={isCompleting}
                    className={`mx-4 mb-4 rounded-2xl py-3.5 items-center ${
                      isCompleting ? 'bg-slate-200 dark:bg-slate-800' : 'bg-teal-600 dark:bg-teal-500'
                    }`}>
                    <Text className={`text-base font-black ${
                      isCompleting ? 'text-slate-400 dark:text-slate-600' : 'text-white'
                    }`}>
                      {isCompleting ? 'Kaydediliyor...' : 'Tamamladım! ✅'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
        </>
      )}

      {/* Tamamlanan görevler */}
      {done.length > 0 && (
        <>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Tamamlananlar ({done.length})
          </Text>
          {done.map((task, i) => {
            const meta = TASK_TYPE_META[task.task_type as TaskType] ?? TASK_TYPE_META.custom;
            const isPending = task.status === 'pending';
            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(i * 50).duration(300)}>
                <View className="flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 opacity-60 dark:border-slate-800/50 dark:bg-slate-900/50">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-400 line-through dark:text-slate-600">{task.title}</Text>
                    <Text className="mt-0.5 text-xs font-semibold text-slate-400 dark:text-slate-600">
                      {isPending ? '⏳ Onay bekleniyor...' : `✅ +${task.stars_earned ?? task.reward_stars} ⭐`}
                    </Text>
                  </View>
                  <Ionicons
                    name={isPending ? 'time-outline' : 'checkmark-circle'}
                    size={22}
                    color={isPending ? (isDark ? '#92400e' : '#f59e0b') : (isDark ? '#0d9488' : '#10b981')}
                  />
                </View>
              </Animated.View>
            );
          })}
        </>
      )}

      {totalTasks === 0 && !isLoading && (
        <View className="items-center gap-3 py-12">
          <Ionicons name="moon-outline" size={40} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text className="text-base font-black text-slate-900 dark:text-white">Bugün görev yok</Text>
          <Text className="text-center text-sm text-slate-400 dark:text-slate-600">
            Annen veya baban görev eklediğinde burada görünür.
          </Text>
        </View>
      )}

      {/* Kutlama modalı */}
      <Modal visible={!!celebrateTask} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <Animated.View entering={ZoomIn.duration(300)}>
            <View className="w-full rounded-3xl border border-slate-200 bg-white p-8 items-center gap-3 dark:border-slate-800 dark:bg-slate-900">
              <Text style={{ fontSize: 56 }}>🎉</Text>
              <Text className="text-2xl font-black text-teal-600 dark:text-teal-400">Harika!</Text>
              <Text className="text-base text-center font-semibold text-slate-600 dark:text-slate-300">
                Görevi tamamladın!
              </Text>
              <View className="rounded-full bg-amber-50 px-4 py-1.5 dark:bg-amber-500/10">
                <Text className="text-sm font-black text-amber-600 dark:text-amber-400">⭐ Yıldız kazandın!</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}
