import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useGoalsStore, type Goal, type GoalActivity, GOAL_META } from '@/store/goals.store';
import { useTrackerStore } from '@/modules/tracker/tracker.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { liveActivityService } from '@/modules/liveActivity/liveActivity.service';
import { toast } from '@/components/feedback/Toast';
import type { TrackerLog } from '@/modules/tracker/tracker.types';

// ─── Progress helpers ─────────────────────────────────────────────────────────

function getProgress(logs: TrackerLog[], activity: GoalActivity): number {
  const filtered = logs.filter((l) => l.activity_type === activity);
  switch (activity) {
    case 'quran':        return filtered.reduce((s, l) => s + (Number(l.value.pages) || 0), 0);
    case 'dhikr':        return filtered.reduce((s, l) => s + (Number(l.value.count) || 0), 0);
    case 'nafile':       return filtered.reduce((s, l) => s + (Number(l.value.rakaat) || 0), 0);
    case 'fasting':      return filtered.length;
    case 'dua':          return filtered.reduce((s, l) => s + (Number(l.value.minutes) || 0), 0);
    case 'memorization': return filtered.reduce((s, l) => s + (Number(l.value.new_ayets) || 0) + (Number(l.value.revision_ayets) || 0), 0);
    default:             return 0;
  }
}

// ─── Complete value builder ───────────────────────────────────────────────────

function buildCompleteValue(activity: GoalActivity, remaining: number): Record<string, any> {
  switch (activity) {
    case 'quran':        return { pages: remaining };
    case 'dhikr':        return { subtype: 'Genel', count: remaining };
    case 'nafile':       return { type: 'diger', rakaat: remaining };
    case 'fasting':      return { type: 'nafile' };
    case 'dua':          return { type: 'Genel', minutes: remaining };
    case 'memorization': return { new_ayets: remaining, revision_ayets: 0 };
  }
}

// ─── Widget sync ─────────────────────────────────────────────────────────────

function syncWidget(goals: Goal[], logs: TrackerLog[]) {
  const activeGoals = goals.filter((g) => g.enabled);
  const items = activeGoals.map((g) => ({
    activity: g.activity,
    label: g.label,
    target: g.target,
    progress: getProgress(logs, g.activity),
    unit: g.unit,
    colorHex: g.colorHex,
    sfSymbol: g.sfSymbol,
  }));
  const completedCount = items.filter((i) => i.progress >= i.target).length;
  liveActivityService.updateGoalsData({
    goals: items,
    completedCount,
    totalCount: activeGoals.length,
    date: new Date().toISOString().split('T')[0]!,
  });
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withSpring(Math.min(pct, 1), { damping: 20, stiffness: 120 });
  }, [pct]);
  const style = useAnimatedStyle(() => ({ width: `${width.value * 100}%` as any }));
  return (
    <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <Animated.View className="h-full rounded-full" style={[{ backgroundColor: color }, style]} />
    </View>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  visible,
  goals,
  onClose,
  onToggle,
  onTargetChange,
}: {
  visible: boolean;
  goals: Goal[];
  onClose: () => void;
  onToggle: (a: GoalActivity, enabled: boolean) => void;
  onTargetChange: (a: GoalActivity, t: number) => void;
}) {
  const { isDark } = useTheme();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      const d: Record<string, string> = {};
      goals.forEach((g) => { d[g.activity] = String(g.target); });
      setDrafts(d);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] overflow-hidden rounded-t-[32px] bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <View>
              <Text className="text-lg font-black text-slate-900 dark:text-white">Günlük Hedefler</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500">Aktif hedefler ana ekranda ve widget'ta görünür</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="close" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
            {goals.map((g) => (
              <View key={g.activity}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                <TouchableOpacity activeOpacity={0.8}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(g.activity, !g.enabled); }}
                  className="flex-row items-center px-4 py-3">
                  <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${g.colorHex}20` }}>
                    <Ionicons name={g.icon as any} size={18} color={g.colorHex} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{g.label}</Text>
                    <Text className="text-xs text-slate-400">{g.unit} cinsinden günlük hedef</Text>
                  </View>
                  {/* Toggle */}
                  <View className={`h-6 w-11 rounded-full ${g.enabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    style={{ justifyContent: 'center', paddingHorizontal: 2 }}>
                    <View className="h-5 w-5 rounded-full bg-white shadow"
                      style={{ alignSelf: g.enabled ? 'flex-end' : 'flex-start' }} />
                  </View>
                </TouchableOpacity>

                {g.enabled && (
                  <View className="flex-row items-center border-t border-slate-100 px-4 py-2.5 dark:border-slate-700">
                    <Text className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                      Hedef ({g.unit})
                    </Text>
                    <View className="flex-row items-center gap-2">
                      {[
                        { delta: -10, label: '−10' },
                        { delta: -1,  label: '−1'  },
                      ].map(({ delta, label }) => (
                        <TouchableOpacity
                          key={label}
                          hitSlop={6}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const next = Math.max(1, (drafts[g.activity] ? parseInt(drafts[g.activity]) : g.target) + delta);
                            setDrafts((p) => ({ ...p, [g.activity]: String(next) }));
                            onTargetChange(g.activity, next);
                          }}
                          className="h-8 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</Text>
                        </TouchableOpacity>
                      ))}
                      <View className="min-w-[44px] items-center rounded-xl border border-teal-200 bg-teal-50 px-2 py-1.5 dark:border-teal-500/30 dark:bg-teal-500/10">
                        <Text className="text-sm font-black text-teal-700 dark:text-teal-400">
                          {drafts[g.activity] ?? g.target}
                        </Text>
                      </View>
                      {[
                        { delta: +1,  label: '+1'  },
                        { delta: +10, label: '+10' },
                      ].map(({ delta, label }) => (
                        <TouchableOpacity
                          key={label}
                          hitSlop={6}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            const next = (drafts[g.activity] ? parseInt(drafts[g.activity]) : g.target) + delta;
                            setDrafts((p) => ({ ...p, [g.activity]: String(next) }));
                            onTargetChange(g.activity, next);
                          }}
                          className="h-8 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                          <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">{label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function PersonalGoalsCard() {
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { goals, loaded, load, updateGoal } = useGoalsStore();
  const todayLogs = useTrackerStore((s) => s.todayLogs);
  const logActivity = useTrackerStore((s) => s.logActivity);
  const fetchTodayLogs = useTrackerStore((s) => s.fetchTodayLogs);
  const [editVisible, setEditVisible] = useState(false);
  const [completing, setCompleting] = useState<GoalActivity | null>(null);

  // Load goals (with server sync if authenticated)
  useEffect(() => { load(isAuthenticated); }, [isAuthenticated]);

  // Sync widget whenever goals or logs change
  useEffect(() => {
    if (loaded) syncWidget(goals, todayLogs);
  }, [goals, todayLogs, loaded]);

  const handleComplete = useCallback(async (activity: GoalActivity, target: number, progress: number) => {
    if (!isAuthenticated) {
      toast.warning('Giriş Gerekli', 'İbadeti kaydetmek için giriş yapmalısın.');
      return;
    }
    if (completing) return;
    const remaining = Math.max(1, target - progress);
    setCompleting(activity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await logActivity(activity, buildCompleteValue(activity, remaining));
      // Fetch fresh data so TodayTrackerCard + goals card both sync
      await fetchTodayLogs();
      toast.success('Kaydedildi', 'İbadet tamamlandı olarak işaretlendi.');
    } catch {
      toast.error('Hata', 'Kayıt yapılamadı.');
    } finally {
      setCompleting(null);
    }
  }, [isAuthenticated, completing, logActivity]);

  const handleToggle = useCallback((activity: GoalActivity, enabled: boolean) => {
    updateGoal(activity, { enabled }, isAuthenticated);
  }, [isAuthenticated]);

  const handleTarget = useCallback((activity: GoalActivity, target: number) => {
    updateGoal(activity, { target }, isAuthenticated);
  }, [isAuthenticated]);

  if (!loaded) return null;

  const activeGoals = goals.filter((g) => g.enabled);
  const teal = isDark ? '#14b8a6' : '#0f766e';

  if (activeGoals.length === 0) {
    return (
      <>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditVisible(true); }}
          className="mx-4 mb-4 flex-row items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <View className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <Ionicons name="flag-outline" size={18} color={isDark ? '#475569' : '#94a3b8'} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-600 dark:text-slate-300">Günlük hedef belirle</Text>
            <Text className="text-xs text-slate-400">Widget'ta da görünecek</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#94a3b8'} />
        </TouchableOpacity>
        <EditModal visible={editVisible} goals={goals} onClose={() => setEditVisible(false)}
          onToggle={handleToggle} onTargetChange={handleTarget} />
      </>
    );
  }

  const goalItems = activeGoals.map((g) => ({
    ...g,
    progress: getProgress(todayLogs, g.activity),
  }));
  const completedCount = goalItems.filter((i) => i.progress >= i.target).length;
  const allDone = completedCount === activeGoals.length;

  return (
    <>
      <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditVisible(true); }}
          className="flex-row items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Ionicons name={allDone ? 'flag' : 'flag-outline'} size={15} color={teal} />
          <Text className="ml-2 flex-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Günlük Hedefler
          </Text>
          <Text className="mr-3 text-xs font-black" style={{ color: teal }}>
            {completedCount}/{activeGoals.length}
          </Text>
          {allDone ? (
            <View className="rounded-full bg-teal-50 px-2.5 py-0.5 dark:bg-teal-500/15">
              <Text className="text-[10px] font-black text-teal-600 dark:text-teal-400">TÜMÜ TAMAM 🎉</Text>
            </View>
          ) : (
            <Ionicons name="settings-outline" size={13} color={isDark ? '#475569' : '#94a3b8'} />
          )}
        </TouchableOpacity>

        {/* Goals */}
        <View className="px-4 py-3 gap-3.5">
          {goalItems.map((g) => {
            const pct = g.target > 0 ? g.progress / g.target : 0;
            const done = pct >= 1;
            const barColor = done ? teal : g.colorHex;
            const isCompleting = completing === g.activity;
            return (
              <View key={g.activity}>
                <View className="mb-1.5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={done ? 'checkmark-circle' : (g.icon as any)}
                      size={13}
                      color={barColor}
                    />
                    <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {g.label}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-black" style={{ color: done ? teal : '#94a3b8' }}>
                      <Text style={{ color: barColor }}>{g.progress}</Text>
                      {'/'}{g.target} {g.unit}
                    </Text>
                    {!done && (
                      <TouchableOpacity
                        onPress={() => handleComplete(g.activity, g.target, g.progress)}
                        disabled={!!completing}
                        className="rounded-lg px-2 py-0.5"
                        style={{ backgroundColor: `${g.colorHex}20` }}>
                        <Text className="text-[10px] font-black" style={{ color: isCompleting ? '#94a3b8' : g.colorHex }}>
                          {isCompleting ? '...' : 'Tamamla'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <ProgressBar pct={pct} color={barColor} />
              </View>
            );
          })}
        </View>
      </View>

      <EditModal visible={editVisible} goals={goals} onClose={() => setEditVisible(false)}
        onToggle={handleToggle} onTargetChange={handleTarget} />
    </>
  );
}
