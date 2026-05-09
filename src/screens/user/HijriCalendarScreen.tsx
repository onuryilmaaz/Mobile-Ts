import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useTheme } from '@/hooks/useTheme';
import { calendarService } from '@/services/calendar.service';

const HIJRI_MONTHS = [
  'Muharrem', 'Safer', 'Rebiulevvel', 'Rebiulahir',
  'Cemaziyelevvel', 'Cemaziyelahir', 'Receb', 'Şaban',
  'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce',
];

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function HijriCalendarScreen() {
  const { isDark } = useTheme();
  const todayHijri = calendarService.getTodayHijri();
  const allDays = calendarService.getReligiousDays();
  const now = new Date();

  const upcoming = allDays
    .filter((d) => d.date >= now)
    .slice(0, 12);

  const past = allDays
    .filter((d) => d.date < now)
    .slice(-4)
    .reverse();

  const nextDay = calendarService.getNextReligiousDay();
  const daysUntilNext = nextDay ? getDaysUntil(nextDay.date) : null;

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Bugünün Hicri tarihi */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          className="mx-4 mt-4 overflow-hidden rounded-3xl bg-teal-600 dark:bg-teal-700">
          <View className="absolute inset-0 opacity-30">
            <View className="absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full bg-white/10" />
            <View className="absolute -bottom-8 -left-8 h-[120px] w-[120px] rounded-full bg-white/10" />
          </View>
          <View className="p-6">
            <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-100/70">
              Bugün Hicri
            </Text>
            <Text className="text-3xl font-black text-white">{todayHijri}</Text>
            <Text className="mt-1 text-sm text-teal-100/80">
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Animated.View>

        {/* Hicri Aylar */}
        <View className="mx-4 mt-5">
          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Hicri Aylar
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {HIJRI_MONTHS.map((month, i) => {
              const isActive = todayHijri.includes(month);
              return (
                <View
                  key={month}
                  className={`rounded-xl border px-3 py-1.5 ${
                    isActive
                      ? 'border-teal-500 bg-teal-50 dark:border-teal-500/60 dark:bg-teal-500/15'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isActive
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {i + 1}. {month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Sonraki Kandil / Bayram */}
        {nextDay && daysUntilNext !== null && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} className="mx-4 mt-5">
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Yaklaşan Özel Gün
            </Text>
            <View className="flex-row overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
              <View className="w-1.5 bg-amber-500" />
              <View className="flex-1 p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-black text-slate-900 dark:text-white">{nextDay.name}</Text>
                    <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(nextDay.date)}
                    </Text>
                    {nextDay.hijriDate && (
                      <Text className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                        {nextDay.hijriDate}
                      </Text>
                    )}
                  </View>
                  <View className="ml-4 items-center rounded-2xl bg-amber-500 px-3 py-2">
                    <Text className="text-xl font-black text-white">{daysUntilNext}</Text>
                    <Text className="text-[9px] font-bold text-amber-100">
                      {daysUntilNext === 0 ? 'BUGÜN' : daysUntilNext === 1 ? 'YARIN' : 'GÜN'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Yaklaşan Günler */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} className="mx-4 mt-5">
          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            2026 Dini Günler
          </Text>
          <View className="gap-2">
            {upcoming.map((day, idx) => {
              const daysLeft = getDaysUntil(day.date);
              const isToday = daysLeft === 0;
              const isTomorrow = daysLeft === 1;
              return (
                <Animated.View
                  key={day.id}
                  entering={FadeInUp.delay(200 + idx * 40).duration(300)}>
                  <View
                    className={`flex-row items-center rounded-2xl border p-4 ${
                      day.isHoliday
                        ? 'border-rose-100 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10'
                        : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}>
                    <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      <Ionicons
                        name={day.isHoliday ? 'star' : 'moon-outline'}
                        size={18}
                        color={day.isHoliday ? '#f59e0b' : isDark ? '#14b8a6' : '#0f766e'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-slate-900 dark:text-white">{day.name}</Text>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(day.date)}
                        {day.hijriDate ? `  •  ${day.hijriDate}` : ''}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-2.5 py-1 ${
                        isToday
                          ? 'bg-teal-500'
                          : isTomorrow
                            ? 'bg-amber-500'
                            : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                      <Text
                        className={`text-xs font-black ${
                          isToday || isTomorrow ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                        {isToday ? 'Bugün' : isTomorrow ? 'Yarın' : `${daysLeft}g`}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Geçmiş Günler */}
        {past.length > 0 && (
          <View className="mx-4 mt-5 opacity-50">
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              Geçmiş
            </Text>
            <View className="gap-2">
              {past.map((day) => (
                <View
                  key={day.id}
                  className="flex-row items-center rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <Ionicons name="checkmark-circle" size={16} color={isDark ? '#334155' : '#cbd5e1'} />
                  <Text className="ml-3 flex-1 text-sm font-bold text-slate-500 dark:text-slate-600">
                    {day.name}
                  </Text>
                  <Text className="text-xs text-slate-400 dark:text-slate-600">
                    {formatDate(day.date)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
