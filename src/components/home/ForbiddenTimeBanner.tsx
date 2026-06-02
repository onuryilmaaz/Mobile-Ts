import React, { useEffect, useState, useRef } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerTimesStore } from '@/store/prayerTimes.store';
import { getActiveForbiddenWindow } from '@/services/forbiddenTime.service';

function formatHMS(ms: number): string {
  if (ms <= 0) return '0dk';
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m}dk ${s}sn`;
  return `${s}sn`;
}

export function ForbiddenTimeBanner() {
  const { isDark } = useTheme();
  const { gunes, ogle, aksam } = usePrayerTimesStore();
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!gunes || !ogle || !aksam) return null;

  const active = getActiveForbiddenWindow(gunes, ogle, aksam, now);
  if (!active) return null;

  const remaining = active.end.getTime() - now.getTime();
  const endHHMM = `${String(active.end.getHours()).padStart(2, '0')}:${String(active.end.getMinutes()).padStart(2, '0')}`;

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10">
      <View className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-400/10" />
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/20">
          <Ionicons name="warning-outline" size={20} color={isDark ? '#fb7185' : '#e11d48'} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
            Yasak Vakit · {active.label}
          </Text>
          <Text className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300" numberOfLines={2}>
            {active.description}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-black text-rose-600 dark:text-rose-400">
            {formatHMS(remaining)}
          </Text>
          <Text className="text-[9px] font-bold uppercase text-rose-500/70">
            {endHHMM}'a kadar
          </Text>
        </View>
      </View>
    </View>
  );
}
