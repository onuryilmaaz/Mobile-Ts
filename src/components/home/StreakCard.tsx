/* eslint-disable react-hooks/exhaustive-deps */
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useEffect } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function StreakCard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { stats, weeklyStats, fetchStats, fetchWeeklyStats } = useGamificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchWeeklyStats();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const streak = stats?.current_streak || 0;
  const longest = stats?.highest_streak || streak;
  const total = stats?.total_points || 0;

  const weekDays = (() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const label = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
      const isToday = i === 6;

      const dayStats = weeklyStats?.daily?.find((day: any) => {
        const dd = new Date(day.date);
        return dd.toDateString() === d.toDateString();
      });
      const count = Number(dayStats?.prayer_count || 0);
      const full = count >= 5;
      const partial = count > 0 && count < 5;

      return { label, isToday, full, partial, count };
    });
  })();

  return (
    <Animated.View entering={FadeInUp.duration(400)} className="mx-4 mb-4">
      <View className="overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Ionicons name="flame" size={18} color="#f59e0b" />
            </View>
            <Text className="font-black text-slate-900 dark:text-white">Namaz Serisi</Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-3 py-1 dark:bg-amber-500/15">
            <Ionicons name="flame" size={14} color="#f59e0b" />
            <Text className="text-sm font-black text-amber-600 dark:text-amber-400">
              {streak} gün
            </Text>
          </View>
        </View>

        <View className="p-5">
          {/* Weekly grid */}
          <View className="mb-4 flex-row justify-between">
            {weekDays.map((day, i) => (
              <View key={i} className="items-center gap-1.5">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-xl ${
                    day.full
                      ? 'bg-teal-500'
                      : day.partial
                        ? 'bg-teal-500/40'
                        : day.isToday
                          ? 'border-2 border-dashed border-slate-300 dark:border-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                  {day.full ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : day.count > 0 ? (
                    <Text className="text-[11px] font-black text-teal-700 dark:text-teal-300">
                      {day.count}
                    </Text>
                  ) : (
                    <Text className="text-[10px] text-slate-400 dark:text-slate-600">—</Text>
                  )}
                </View>
                <Text
                  className={`text-[10px] font-bold ${
                    day.isToday
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Stats row */}
          <View className="flex-row gap-3">
            <View className="flex-1 items-center rounded-xl bg-slate-50 py-3 dark:bg-slate-800">
              <Text className="text-xl font-black text-amber-500">{streak}</Text>
              <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Mevcut Seri
              </Text>
            </View>
            <View className="flex-1 items-center rounded-xl bg-slate-50 py-3 dark:bg-slate-800">
              <Text className="text-xl font-black text-teal-600 dark:text-teal-400">{longest}</Text>
              <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                En Uzun
              </Text>
            </View>
            <View className="flex-1 items-center rounded-xl bg-slate-50 py-3 dark:bg-slate-800">
              <Text className="text-xl font-black text-indigo-500">{total}</Text>
              <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Toplam Puan
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
