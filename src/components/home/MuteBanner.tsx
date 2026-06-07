import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { notificationService } from '@/services/notification.service';
import { toast } from '@/components/feedback/Toast';

function formatRemaining(until: number): string {
  const ms = until - Date.now();
  if (ms <= 0) return 'sona erdi';
  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin < 60) return `${totalMin} dakika`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} saat` : `${h} sa ${m} dk`;
}

/**
 * Compact banner shown only while notifications are silenced. Refreshes every
 * minute and auto-hides when the mute window expires.
 */
export function MuteBanner() {
  const { isDark } = useTheme();
  const [muteUntil, setMuteUntil] = useState<number | null>(null);

  const refresh = async () => {
    const ts = await notificationService.getMuteUntil();
    setMuteUntil(ts);
  };

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, []),
  );

  useEffect(() => {
    if (!muteUntil) return;
    const tick = setInterval(refresh, 60_000);
    return () => clearInterval(tick);
  }, [muteUntil]);

  if (!muteUntil) return null;

  const handleUnmute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.unmute();
    setMuteUntil(null);
    toast.success('Aktifleştirildi', 'Bildirimler tekrar açıldı.');
  };

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <View className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-400/10" />
      <View className="flex-row items-center gap-3 px-4 py-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/20">
          <Ionicons name="moon" size={20} color={isDark ? '#a5b4fc' : '#6366f1'} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Sessiz Mod Aktif
          </Text>
          <Text className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {formatRemaining(muteUntil)} kaldı
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleUnmute}
          accessibilityLabel="Sessiz modu kapat"
          className="rounded-xl bg-indigo-500 px-3 py-2 dark:bg-indigo-600">
          <Text className="text-[11px] font-black text-white">Aç</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
