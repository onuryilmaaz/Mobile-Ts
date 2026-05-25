import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { familyApi } from '@/modules/family/family.api';
import type { FamilyStackParamList } from '@/navigation/types';
import { TASK_TYPE_META } from '@/modules/family/family.types';
import type { TaskType } from '@/modules/family/family.types';
import { useTheme } from '@/hooks/useTheme';

type Route = RouteProp<FamilyStackParamList, 'ChildReport'>;

interface WeeklyReport {
  byType: Array<{ task_type: string; assigned: number; completed: number; stars_earned: number }>;
  badgesEarned: Array<{ badge_type: string; emoji?: string; name?: string }>;
}

export default function ChildReportScreen() {
  const route = useRoute<Route>();
  const { childId } = route.params;
  const { children, childStats, fetchChildStats } = useFamilyStore();
  const { isDark } = useTheme();
  const [report, setReport] = useState<WeeklyReport>({ byType: [], badgesEarned: [] });

  const child = children.find((c) => c.id === childId);

  useEffect(() => {
    fetchChildStats(childId);
    familyApi.getWeeklyReport(childId)
      .then((res) => {
        if (res.data.success) {
          setReport({ byType: res.data.data.by_type, badgesEarned: res.data.data.badges_earned });
        }
      })
      .catch(() => {});
  }, [childId]);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Çocuk başlığı */}
        {child && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
                <Text style={{ fontSize: 30 }}>{child.avatar_emoji}</Text>
              </View>
              <View>
                <Text className="text-lg font-black text-slate-900 dark:text-white">{child.name}</Text>
                <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">Haftalık Rapor</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* İstatistik kartları */}
        {childStats && (
          <Animated.View entering={FadeInDown.delay(80).duration(300)} className="flex-row gap-3">
            {[
              { label: 'Toplam Yıldız', value: childStats.total_stars, emoji: '⭐', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
              { label: 'Güncel Seri', value: `${childStats.current_streak}g`, emoji: '🔥', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
              { label: 'Seviye', value: childStats.level, emoji: '🏆', bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-700 dark:text-teal-400' },
            ].map((item) => (
              <View
                key={item.label}
                className={`flex-1 items-center rounded-2xl border border-slate-200 py-4 gap-1 dark:border-slate-800 ${item.bg}`}>
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                <Text className={`text-xl font-black ${item.text}`}>{item.value}</Text>
                <Text className="text-center text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {item.label}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Seviye çubuğu */}
        {childStats && (
          <Animated.View entering={FadeInDown.delay(140).duration(300)}>
            <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-black text-slate-900 dark:text-white">
                  Lv.{childStats.level} — {childStats.level_name}
                </Text>
                {childStats.next_level_stars && (
                  <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    {childStats.next_level_stars - childStats.total_stars} ⭐ kaldı
                  </Text>
                )}
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <View
                  className="h-full rounded-full bg-teal-500"
                  style={{
                    width: `${childStats.next_level_stars ? Math.min(100, (childStats.total_stars / childStats.next_level_stars) * 100) : 100}%`,
                  }}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Görev tipleri kırılımı */}
        {report.byType.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Bu Hafta Görev Tipleri
              </Text>
              <View className="gap-3">
                {report.byType.map((item) => {
                  const meta = TASK_TYPE_META[item.task_type as TaskType] ?? TASK_TYPE_META.custom;
                  const rate = item.assigned > 0 ? Math.round((item.completed / item.assigned) * 100) : 0;
                  return (
                    <View key={item.task_type} className="gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View
                            className="h-6 w-6 items-center justify-center rounded-full border"
                            style={{
                              backgroundColor: isDark ? `${meta.color}20` : `${meta.color}15`,
                              borderColor: `${meta.color}40`,
                            }}>
                            <Text style={{ fontSize: 11 }}>{meta.emoji}</Text>
                          </View>
                          <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">{meta.label}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {item.completed}/{item.assigned}
                          </Text>
                          <View className={`rounded-full px-1.5 py-0.5 ${
                            rate >= 80 ? 'bg-teal-50 dark:bg-teal-500/10' :
                            rate >= 50 ? 'bg-amber-50 dark:bg-amber-500/10' :
                            'bg-red-50 dark:bg-red-500/10'
                          }`}>
                            <Text className={`text-[10px] font-black ${
                              rate >= 80 ? 'text-teal-700 dark:text-teal-400' :
                              rate >= 50 ? 'text-amber-600 dark:text-amber-400' :
                              'text-red-500 dark:text-red-400'
                            }`}>{rate}%</Text>
                          </View>
                        </View>
                      </View>
                      <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${rate}%`,
                            backgroundColor: rate >= 80 ? '#14b8a6' : rate >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Rozetler */}
        {report.badgesEarned.length > 0 && (
          <Animated.View entering={FadeInDown.delay(260).duration(300)}>
            <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <Text className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Bu Hafta Kazanılan Rozetler
              </Text>
              <View className="flex-row flex-wrap gap-4">
                {report.badgesEarned.map((b) => (
                  <View key={b.badge_type} className="items-center gap-1.5 w-14">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                      <Text style={{ fontSize: 24 }}>{b.emoji ?? '🏅'}</Text>
                    </View>
                    <Text className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400" numberOfLines={2}>
                      {b.name ?? b.badge_type}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {report.byType.length === 0 && !childStats && (
          <View className="items-center gap-3 py-10">
            <Ionicons name="analytics-outline" size={40} color={isDark ? '#334155' : '#cbd5e1'} />
            <Text className="text-slate-400 dark:text-slate-600">Henüz veri yok</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
