import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTrackerStore } from '@/modules/tracker/tracker.store';
import { ACTIVITY_META } from '@/modules/tracker/tracker.types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTheme } from '@/hooks/useTheme';
import { useNavigation } from '@react-navigation/native';

const SUMMARY_TYPES = ['quran', 'dhikr', 'nafile', 'fasting', 'sadaka', 'dua'] as const;

function getTotal(type: string, logs: any[]): number {
  const entries = logs.filter((l) => l.activity_type === type);
  if (!entries.length) return 0;
  switch (type) {
    case 'quran': return entries.reduce((s, l) => s + (l.value?.pages || 0), 0);
    case 'dhikr': return entries.reduce((s, l) => s + (l.value?.count || 0), 0);
    case 'nafile': return entries.reduce((s, l) => s + (l.value?.rakaat || 0), 0);
    case 'fasting': return entries.length;
    case 'sadaka': return entries.reduce((s, l) => s + (l.value?.amount || 0), 0);
    case 'dua': return entries.reduce((s, l) => s + (l.value?.minutes || 0), 0);
    default: return entries.length;
  }
}

export function TodayTrackerCard() {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { todayLogs, fetchTodayLogs } = useTrackerStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (isAuthenticated) fetchTodayLogs();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const activeTypes = SUMMARY_TYPES.filter((t) => getTotal(t, todayLogs) > 0);
  const isEmpty = activeTypes.length === 0;

  return (
    <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-950">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View
            className="h-8 w-8 items-center justify-center rounded-xl bg-teal-700/[8%] dark:bg-teal-500/[12%]">
            <Ionicons name="journal" size={16} color={isDark ? '#14b8a6' : '#0f766e'} />
          </View>
          <Text className="text-sm font-black text-slate-900 dark:text-white">
            Bugünkü İbadetler
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Tracker')}
          className="flex-row items-center gap-1">
          <Text className="text-xs font-bold text-teal-700 dark:text-teal-500">
            Ekle
          </Text>
          <Ionicons name="add-circle" size={18} color={isDark ? '#14b8a6' : '#0f766e'} />
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View className="items-center py-5">
          <Text className="text-xs font-medium text-slate-400">
            Bugün henüz kayıt yok
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tracker')}
            className="mt-2 rounded-xl bg-teal-700/[6%] px-4 py-2 dark:bg-teal-500/[8%]">
            <Text className="text-xs font-bold text-teal-700 dark:text-teal-500">
              İlk kaydı ekle
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2 px-4 pb-4">
          {activeTypes.map((type) => {
            const meta = ACTIVITY_META[type];
            const total = getTotal(type, todayLogs);
            return (
              <View
                key={type}
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                style={{ backgroundColor: meta.bgColor }}>
                <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                <Text
                  className="text-xs font-black"
                  style={{ color: meta.color }}>
                  {total}
                  {meta.unit ? ` ${meta.unit}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
