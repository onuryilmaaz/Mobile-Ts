import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { calendarService } from '@/services/calendar.service';
import type { HomeStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function gregorianToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const mo = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * mo + 2) / 5) + 1,
    month: mo + 3 - 12 * Math.floor(mo / 10),
    year: 100 * b + d2 - 4800 + Math.floor(mo / 10),
  };
}

function daysInHijriMonth(month: number, year: number): number {
  if (month % 2 === 1) return 30;
  if (month === 12) return [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(year % 30) ? 30 : 29;
  return 29;
}

function hijriYearStartJDN(year: number): number {
  return 1948440 + 354 * (year - 1) + Math.floor((11 * (year - 1) + 3) / 30);
}

function hijriToJDN(year: number, month: number, day: number): number {
  const A = 354 * (year - 1) + Math.floor((11 * (year - 1) + 3) / 30);
  const B = (month - 1) * 29 + Math.floor(month / 2);
  return 1948440 + A + B + (day - 1);
}

function jdnToHijri(jdn: number): { year: number; month: number; day: number } {
  let year = Math.max(1, Math.floor((jdn - 1948440) / 354.37) + 1);
  while (hijriYearStartJDN(year + 1) <= jdn) year++;
  while (hijriYearStartJDN(year) > jdn) year--;
  let days = jdn - hijriYearStartJDN(year);
  let month = 1;
  while (month < 12 && days >= daysInHijriMonth(month, year)) {
    days -= daysInHijriMonth(month, year);
    month++;
  }
  return { year, month, day: days + 1 };
}

function hijriFirstWeekday(year: number, month: number): number {
  const jdn = hijriToJDN(year, month, 1);
  const { year: gy, month: gm, day: gd } = jdnToGregorian(jdn);
  return (new Date(gy, gm - 1, gd).getDay() + 6) % 7;
}

function todayHijri() {
  const n = new Date();
  return jdnToHijri(gregorianToJDN(n.getFullYear(), n.getMonth() + 1, n.getDate()));
}

function gregorianForHijri(year: number, month: number, day: number): Date {
  const { year: gy, month: gm, day: gd } = jdnToGregorian(hijriToJDN(year, month, day));
  return new Date(gy, gm - 1, gd);
}

const HIJRI_MONTHS = [
  'Muharrem',
  'Safer',
  'Rebiulevvel',
  'Rebiulahir',
  'Cemaziyelevvel',
  'Cemaziyelahir',
  'Receb',
  'Şaban',
  'Ramazan',
  'Şevval',
  'Zilkade',
  'Zilhicce',
];
const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function buildSpecialDayMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of calendarService.getReligiousDays()) {
    map.set(`${d.date.getFullYear()}-${d.date.getMonth() + 1}-${d.date.getDate()}`, d.name);
  }
  return map;
}

export default function HijriCalendarScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();

  const today = useMemo(() => todayHijri(), []);
  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);
  const specialDayMap = useMemo(() => buildSpecialDayMap(), []);

  const daysInMonth = daysInHijriMonth(viewMonth, viewYear);
  const firstDOW = hijriFirstWeekday(viewYear, viewMonth);

  const monthEvents = useMemo(() => {
    const events: { day: number; name: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const gd = gregorianForHijri(viewYear, viewMonth, d);
      const key = `${gd.getFullYear()}-${gd.getMonth() + 1}-${gd.getDate()}`;
      const name = specialDayMap.get(key);
      if (name) events.push({ day: d, name });
    }
    return events;
  }, [viewYear, viewMonth, daysInMonth, specialDayMap]);

  const prevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const goToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewYear(today.year);
    setViewMonth(today.month);
  };

  const isViewingToday = viewMonth === today.month && viewYear === today.year;

  const cells: (number | null)[] = [
    ...Array(firstDOW).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const teal = isDark ? '#14b8a6' : '#0f766e';
  const now = new Date();

  const viewGDate = gregorianForHijri(viewYear, viewMonth, 1);
  const viewGStr = viewGDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Hicri Takvim" navigation={navigation} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <View className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 dark:border-teal-500/30 dark:bg-teal-500/10">
            <Text className="text-xs font-black text-teal-700 dark:text-teal-400">
              Bugün · {today.day} {HIJRI_MONTHS[today.month - 1]} {today.year}
            </Text>
            <Text className="mt-0.5 text-[10px] text-teal-600/70 dark:text-teal-500/80">
              {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          {!isViewingToday && (
            <TouchableOpacity
              onPress={goToday}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Bugüne Dön
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
            <TouchableOpacity
              onPress={prevMonth}
              hitSlop={12}
              className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700">
              <Ionicons name="chevron-back" size={18} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="text-lg font-black text-slate-900 dark:text-white">
                {HIJRI_MONTHS[viewMonth - 1]} {viewYear}
              </Text>
              <Text className="text-[11px] text-slate-400 dark:text-slate-500">{viewGStr}</Text>
            </View>
            <TouchableOpacity
              onPress={nextMonth}
              hitSlop={12}
              className="h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700">
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
          </View>

          <View className="flex-row px-3 pt-3">
            {WEEKDAYS.map((wd, i) => (
              <Text
                key={wd}
                className={`flex-1 text-center text-[11px] font-black uppercase tracking-wider ${
                  i === 4
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                {wd}
              </Text>
            ))}
          </View>

          <View className="px-3 pb-4 pt-2">
            {Array.from({ length: cells.length / 7 }, (_, row) => (
              <View key={row} className="flex-row">
                {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                  if (!day) return <View key={col} className="flex-1 py-1" />;
                  const gd = gregorianForHijri(viewYear, viewMonth, day);
                  const gdKey = `${gd.getFullYear()}-${gd.getMonth() + 1}-${gd.getDate()}`;
                  const specialName = specialDayMap.get(gdKey);
                  const itIsToday = isViewingToday && day === today.day;
                  const isFriday = col === 4;
                  return (
                    <View key={col} className="flex-1 items-center py-1">
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-full ${
                          itIsToday
                            ? 'bg-teal-600 dark:bg-teal-500'
                            : specialName
                              ? 'bg-amber-50 dark:bg-amber-500/10'
                              : ''
                        }`}>
                        <Text
                          className={`text-sm font-bold ${
                            itIsToday
                              ? 'text-white'
                              : specialName
                                ? 'text-amber-600 dark:text-amber-400'
                                : isFriday
                                  ? 'text-teal-600 dark:text-teal-400'
                                  : 'text-slate-700 dark:text-slate-300'
                          }`}>
                          {day}
                        </Text>
                      </View>
                      {specialName && !itIsToday && (
                        <View className="mt-0.5 h-1 w-1 rounded-full bg-amber-400" />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View className="flex-row gap-4 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <View className="flex-row items-center gap-1.5">
              <View className="h-3 w-3 rounded-full bg-teal-600" />
              <Text className="text-[10px] font-bold text-slate-400">Bugün</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <Text className="text-[10px] font-bold text-slate-400">Önemli Gün</Text>
            </View>
          </View>
        </View>

        {monthEvents.length > 0 && (
          <View>
            <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              BU AYDAKİ ÖZEL GÜNLER
            </Text>
            <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {monthEvents.map((ev, i) => {
                const gd = gregorianForHijri(viewYear, viewMonth, ev.day);
                const isPast = gd < new Date(new Date().setHours(0, 0, 0, 0));
                const daysLeft = Math.ceil((gd.getTime() - Date.now()) / 86_400_000);
                return (
                  <View
                    key={i}
                    className={`flex-row items-center border-b border-slate-100 px-4 py-3.5 last:border-0 dark:border-slate-800 ${isPast ? 'opacity-50' : ''}`}>
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <Text className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {ev.day}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {ev.name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {ev.day} {HIJRI_MONTHS[viewMonth - 1]} ·{' '}
                        {gd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </Text>
                    </View>
                    {!isPast && (
                      <Text className="text-xs font-bold text-amber-500">{daysLeft} gün</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View>
          <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            YAKLAŞAN ÖZEL GÜNLER
          </Text>
          <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {calendarService
              .getReligiousDays()
              .filter((d) => d.date >= new Date(new Date().setHours(0, 0, 0, 0)))
              .slice(0, 6)
              .map((d) => {
                const h = jdnToHijri(
                  gregorianToJDN(d.date.getFullYear(), d.date.getMonth() + 1, d.date.getDate())
                );
                const daysLeft = Math.ceil((d.date.getTime() - Date.now()) / 86_400_000);
                return (
                  <View
                    key={d.id}
                    className="flex-row items-center border-b border-slate-100 px-4 py-3.5 last:border-0 dark:border-slate-800">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10">
                      <Ionicons name="star-outline" size={18} color={teal} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        {d.name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {h.day} {HIJRI_MONTHS[h.month - 1]} {h.year} ·{' '}
                        {d.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-black text-teal-600 dark:text-teal-400">
                        {daysLeft}
                      </Text>
                      <Text className="text-[9px] font-bold uppercase text-slate-400">
                        gün kaldı
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
