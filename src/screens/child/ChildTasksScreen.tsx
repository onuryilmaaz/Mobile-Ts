import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useFamilyStore } from '@/modules/family/family.store';
import { alert } from '@/store/alert.store';
import { TASK_TYPE_META } from '@/modules/family/family.types';
import type { TaskType } from '@/modules/family/family.types';
import { useTheme } from '@/hooks/useTheme';

type Gender = 'erkek' | 'kız' | null | undefined;

function getGreeting(name: string) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const h = now.getHours();
  if (h >= 4 && h < 12) return { text: `Hayırlı Sabahlar, ${name}! 🌅`, sub: 'Bismillah ile başlayalım!' };
  if (h >= 12 && h < 15) return { text: `Hayırlı Öğleler, ${name}! ☀️`, sub: 'Öğle vakti, devam et!' };
  if (h >= 15 && h < 18) return { text: `Hayırlı İkindiler, ${name}! 🌤`, sub: 'Harika gidiyorsun!' };
  if (h >= 18 && h < 21) return { text: `Hayırlı Akşamlar, ${name}! 🌇`, sub: 'Bugün çok güzel geçiyor!' };
  return { text: `Hayırlı Geceler, ${name}! 🌙`, sub: 'Güzel bir gün geçirdin!' };
}

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

export default function ChildTasksScreen() {
  const {
    todayTasks, fetchTodayTasks, completeTask, isLoading,
    childStats, fetchChildStats, childSession,
  } = useFamilyStore();
  const { isDark } = useTheme();
  const [completing, setCompleting] = useState<string | null>(null);
  const [celebrateTask, setCelebrateTask] = useState<{ id: string; stars: number } | null>(null);

  useEffect(() => {
    fetchTodayTasks();
    if (childSession?.childId) fetchChildStats(childSession.childId);
  }, []);

  const done = todayTasks.filter((t) => t.status === 'approved' || t.status === 'pending');
  const pending = todayTasks.filter((t) => !t.status);
  const totalTasks = todayTasks.length;
  const completedCount = done.length;
  const progress = totalTasks > 0 ? completedCount / totalTasks : 0;
  const allDone = totalTasks > 0 && completedCount === totalTasks;

  const gender = childSession?.gender;
  const a = genderAccent(gender, isDark);
  const greeting = getGreeting(childSession?.childName ?? 'Kardeşim');

  const handleComplete = async (taskId: string, rewardStars: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompleting(taskId);
    try {
      await completeTask(taskId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrateTask({ id: taskId, stars: rewardStars });
      setTimeout(() => setCelebrateTask(null), 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Bir hata oluştu';
      alert.error('Hata', msg);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={fetchTodayTasks}
          tintColor={a.primary}
        />
      }>

      {/* Selamlama */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View
          className="rounded-3xl p-5"
          style={{
            backgroundColor: a.primaryBg,
            borderWidth: 1,
            borderColor: a.primaryBorder,
          }}>
          <Text className="text-lg font-black" style={{ color: a.primary }}>
            {greeting.text}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {greeting.sub}
          </Text>
        </View>
      </Animated.View>

      {/* İlerleme kartı */}
      {totalTasks > 0 && (
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <View
            className="rounded-3xl p-5"
            style={{
              backgroundColor: a.primaryBg,
              borderWidth: 1,
              borderColor: a.primaryBorder,
            }}>
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: `${a.primary}99` }}>
                  Bugünkü İlerleme
                </Text>
                <Text className="mt-0.5 text-2xl font-black" style={{ color: a.primary }}>
                  {completedCount}/{totalTasks} Görev
                </Text>
              </View>
              <View
                className="h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${a.primary}25` }}>
                <Text style={{ fontSize: 28 }}>{allDone ? '🎉' : '✨'}</Text>
              </View>
            </View>
            <View
              className="h-3.5 overflow-hidden rounded-full"
              style={{ backgroundColor: a.progressBg }}>
              <View
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, backgroundColor: a.primary }}
              />
            </View>
            {allDone && (
              <Text
                className="mt-2.5 text-center text-base font-black"
                style={{ color: a.primary }}>
                Maşa'Allah! Harika bir gün! 🌟
              </Text>
            )}
          </View>
        </Animated.View>
      )}

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
              <Animated.View key={task.id} entering={FadeInDown.delay(i * 60 + 120).duration(300)}>
                <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <View className="flex-row items-center gap-4 p-5">
                    <View
                      className="h-14 w-14 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: isDark ? `${meta.color}22` : `${meta.color}18`,
                        borderWidth: 1,
                        borderColor: `${meta.color}40`,
                      }}>
                      <Text style={{ fontSize: 28 }}>{meta.emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-black text-slate-900 dark:text-white">
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          {task.description}
                        </Text>
                      ) : null}
                      <View className="mt-1.5 flex-row items-center gap-2">
                        <Text className="text-sm font-bold text-amber-500 dark:text-amber-400">
                          {'⭐'.repeat(Math.min(task.reward_stars ?? 1, 5))}
                        </Text>
                        {task.requires_approval && (
                          <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              Onay gerekli
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleComplete(task.id, task.reward_stars ?? 1)}
                    disabled={isCompleting}
                    className="mx-4 mb-4 items-center rounded-2xl py-4"
                    style={{
                      backgroundColor: isCompleting
                        ? (isDark ? '#1e293b' : '#f1f5f9')
                        : a.primary,
                    }}>
                    <Text
                      className="text-base font-black"
                      style={{
                        color: isCompleting ? (isDark ? '#475569' : '#94a3b8') : 'white',
                      }}>
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
            Tamamlananlar ✅ ({done.length})
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
                    <Text className="font-bold text-slate-400 line-through dark:text-slate-600">
                      {task.title}
                    </Text>
                    <Text className="mt-0.5 text-xs font-semibold text-slate-400 dark:text-slate-600">
                      {isPending
                        ? '⏳ Onay bekleniyor...'
                        : `✅ +${task.stars_earned ?? task.reward_stars} ⭐`}
                    </Text>
                  </View>
                  <Ionicons
                    name={isPending ? 'time-outline' : 'checkmark-circle'}
                    size={22}
                    color={isPending ? '#f59e0b' : a.primary}
                  />
                </View>
              </Animated.View>
            );
          })}
        </>
      )}

      {totalTasks === 0 && !isLoading && (
        <View className="items-center gap-4 py-16">
          <Text style={{ fontSize: 56 }}>🌙</Text>
          <Text className="text-lg font-black text-slate-900 dark:text-white">
            Bugün görev yok
          </Text>
          <Text className="text-center text-sm text-slate-400 dark:text-slate-600">
            Annen veya baban görev eklediğinde{'\n'}burada görünecek.
          </Text>
        </View>
      )}

      {/* Kutlama modalı */}
      <Modal visible={!!celebrateTask} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <Animated.View entering={ZoomIn.duration(300)}>
            <View className="w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
              <Text style={{ fontSize: 64 }}>🎉</Text>
              <Text className="text-2xl font-black" style={{ color: a.primary }}>
                Harika!
              </Text>
              <Text className="text-center text-base font-semibold text-slate-600 dark:text-slate-300">
                Maşa'Allah, görevi tamamladın!
              </Text>
              <View
                className="rounded-full px-5 py-2"
                style={{ backgroundColor: `${a.primary}20` }}>
                <Text className="text-sm font-black" style={{ color: a.primary }}>
                  +{celebrateTask?.stars ?? 1} ⭐ kazandın!
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}
