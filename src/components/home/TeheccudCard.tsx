import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerTimesStore } from '@/store/prayerTimes.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTrackerStore } from '@/modules/tracker/tracker.store';
import { calculateTeheccudWindow, getTeheccudStatus } from '@/services/teheccud.service';
import { toast } from '@/components/feedback/Toast';

function timeToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatHMS(ms: number): string {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}

export function TeheccudCard() {
  const { isDark } = useTheme();
  const yatsi = usePrayerTimesStore((s) => s.yatsi);
  const imsak = usePrayerTimesStore((s) => s.imsak);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logActivity = useTrackerStore((s) => s.logActivity);
  const todayLogs = useTrackerStore((s) => s.todayLogs);
  const [now, setNow] = useState(new Date());
  const [logging, setLogging] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!yatsi || !imsak) return null;

  const { state, window } = getTeheccudStatus(yatsi, imsak, now);

  // Card sadece şu durumlarda görünür: yatsı sonrası (akşam) veya sabah erken saatlerde (imsaktan önce)
  if (state === 'before_yatsi') return null;

  const teal = isDark ? '#14b8a6' : '#0f766e';
  const indigo = '#818cf8';

  // Already logged today?
  const alreadyLogged = todayLogs.some(
    (l) => l.activity_type === 'nafile' && (l.value as any)?.type === 'teheccud',
  );

  const handleLog = async () => {
    if (!isAuthenticated || logging || alreadyLogged) return;
    setLogging(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await logActivity('nafile', { type: 'teheccud', rakaat: 2 });
      toast.success('Kaydedildi', 'Teheccüd namazı kaydedildi.');
    } catch {
      toast.error('Hata', 'Kayıt yapılamadı.');
    } finally {
      setLogging(false);
    }
  };

  // Countdown: how long until window starts / ends
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(window.start);
  const endMin = timeToMinutes(window.end);

  let countdownLabel = '';
  let countdownValue = '';

  if (state === 'before_window') {
    const minsUntilStart = startMin >= 12 * 60
      ? (startMin - nowMin + 1440) % 1440  // start is in evening, may wrap
      : (startMin + 1440 - nowMin) % 1440; // start is past midnight
    countdownLabel = 'Vakte kalan';
    countdownValue = formatHMS(minsUntilStart * 60_000);
  } else if (state === 'active') {
    const minsUntilEnd = (endMin + 1440 - nowMin) % 1440;
    countdownLabel = 'Vakit kapanıyor';
    countdownValue = formatHMS(minsUntilEnd * 60_000);
  } else {
    return null; // after_imsak — don't show
  }

  const isActive = state === 'active';

  return (
    <View className={`mx-4 mb-4 overflow-hidden rounded-3xl border ${
      isActive
        ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10'
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
    }`}>
      <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-400/10" />

      <View className="flex-row items-center justify-between px-4 py-3.5">
        {/* Left: icon + title */}
        <View className="flex-row items-center gap-3 flex-1">
          <View className="h-10 w-10 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/20">
            <Ionicons name="moon" size={20} color={indigo} />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              Teheccüd Vakti
            </Text>
            <Text className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {window.start} – {window.end} {isActive && '· Şu an aktif'}
            </Text>
            <Text className="mt-0.5 text-[10px] text-slate-400">
              {countdownLabel}: {countdownValue}
            </Text>
          </View>
        </View>

        {/* Right: log button */}
        {isActive && (
          alreadyLogged ? (
            <View className="flex-row items-center gap-1 rounded-xl bg-teal-50 px-3 py-2 dark:bg-teal-500/15">
              <Ionicons name="checkmark-circle" size={14} color={teal} />
              <Text className="text-[11px] font-black text-teal-700 dark:text-teal-400">
                Kılındı
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleLog}
              disabled={logging}
              className="rounded-xl bg-indigo-500 px-3 py-2 dark:bg-indigo-600">
              <Text className="text-[11px] font-black text-white">
                {logging ? '...' : 'Kıldım'}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}
