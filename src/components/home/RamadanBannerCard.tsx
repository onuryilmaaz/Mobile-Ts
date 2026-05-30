import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerTimesStore } from '@/store/prayerTimes.store';
import * as Haptics from 'expo-haptics';

const RAMAZAN_START = new Date('2027-02-08T00:00:00');
const RAMAZAN_END = new Date('2027-03-10T00:00:00');

function getStatus(): { isRamazan: boolean; day: number | null; daysLeft: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(RAMAZAN_START);
  start.setHours(0, 0, 0, 0);
  const end = new Date(RAMAZAN_END);
  end.setHours(0, 0, 0, 0);

  if (today >= start && today < end) {
    const day = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
    return { isRamazan: true, day, daysLeft: 0 };
  }
  const daysLeft = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
  return { isRamazan: false, day: null, daysLeft: Math.max(0, daysLeft) };
}

function parseTimestamp(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  return d.getTime();
}

function formatHMS(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

type Props = { onPress: () => void };

export function RamadanBannerCard({ onPress }: Props) {
  const { isDark } = useTheme();
  const imsak = usePrayerTimesStore((s) => s.imsak);
  const aksam = usePrayerTimesStore((s) => s.aksam);

  const { isRamazan, day: ramazanDay, daysLeft } = getStatus();

  // Ramazan dönemi için saat countdown state'i
  const [timeLabel, setTimeLabel] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [iftarDone, setIftarDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = () => {
    if (!imsak || !aksam) return;
    const now = Date.now();
    const imsakMs = parseTimestamp(imsak);
    const aksamMs = parseTimestamp(aksam);

    if (now < imsakMs) {
      setTimeLabel('Sahura kalan');
      setTimeValue(formatHMS(imsakMs - now));
      setIftarDone(false);
    } else if (now < aksamMs) {
      setTimeLabel('İftara kalan');
      setTimeValue(formatHMS(aksamMs - now));
      setIftarDone(false);
    } else {
      setTimeLabel('');
      setTimeValue('');
      setIftarDone(true);
    }
  };

  useEffect(() => {
    if (!isRamazan) return;
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRamazan, imsak, aksam]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="mx-4 mb-4 overflow-hidden rounded-3xl border border-violet-200 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10">
      <View className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-400/10" />

      <View className="flex-row items-center justify-between px-4 py-3.5">
        {/* Sol: ikon + başlık */}
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl border border-violet-300 bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/20">
            <Ionicons name="moon" size={20} color="#a78bfa" />
          </View>
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-violet-400">
              {isRamazan ? `Ramazan · ${ramazanDay}. Gün` : 'Ramazan 1447'}
            </Text>
            {isRamazan ? (
              <Text className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {iftarDone ? 'Hayırlı İftarlar 🌙' : timeLabel}
              </Text>
            ) : (
              <Text className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                başlamasına kaldı
              </Text>
            )}
          </View>
        </View>

        {/* Sağ: sayı */}
        <View className="items-end">
          {isRamazan ? (
            iftarDone ? (
              <Text className="text-lg font-black text-violet-500 dark:text-violet-400">🌙</Text>
            ) : (
              <Text className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
                {timeValue || '--:--:--'}
              </Text>
            )
          ) : (
            <View className="flex-row items-baseline gap-1">
              <Text className="text-3xl font-black text-slate-900 dark:text-white">{daysLeft}</Text>
              <Text className="text-sm font-bold text-violet-400">gün</Text>
            </View>
          )}
          <View className="mt-0.5 flex-row items-center gap-0.5">
            <Text className="text-[10px] font-bold text-violet-400">
              {isRamazan && imsak && aksam ? `${imsak} · ${aksam}` : 'Detaylar'}
            </Text>
            <Ionicons name="chevron-forward" size={10} color="#a78bfa" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
