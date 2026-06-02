import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/components/feedback/Toast';

// Diyanet Din Hizmetleri — Türkçe Cuma Hutbeleri arşivi
const DIYANET_HUTBE_URL =
  'https://dinhizmetleri.diyanet.gov.tr/kategoriler/yayinlarimiz/hutbeler/t%C3%BCrk%C3%A7e';

function getCumaStatus(now: Date = new Date()): {
  visible: boolean;
  state: 'thursday_evening' | 'friday_morning' | 'friday_done' | null;
} {
  const day = now.getDay(); // 0 Sun, 4 Thu, 5 Fri
  const hour = now.getHours();

  // Perşembe akşam 18:00 sonrası
  if (day === 4 && hour >= 18) {
    return { visible: true, state: 'thursday_evening' };
  }
  // Cuma sabah 06:00 — öğle vakti ortası (~14:00) arası
  if (day === 5 && hour >= 6 && hour < 14) {
    return { visible: true, state: 'friday_morning' };
  }
  // Cuma 14:00 sonrası (hutbe okundu varsayalım)
  if (day === 5 && hour >= 14 && hour < 22) {
    return { visible: true, state: 'friday_done' };
  }
  return { visible: false, state: null };
}

export function CumaHutbesiCard() {
  const { isDark } = useTheme();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { visible, state } = getCumaStatus(now);
  if (!visible) return null;

  const openHutbe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await WebBrowser.openBrowserAsync(DIYANET_HUTBE_URL, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch {
      toast.error('Hata', 'Hutbe sayfası açılamadı.');
    }
  };

  const config =
    state === 'thursday_evening'
      ? {
          label: 'Yarın Cuma',
          subtitle: 'Bu haftanın hutbesini şimdiden okuyabilirsin',
          icon: 'moon-outline' as const,
        }
      : state === 'friday_morning'
        ? {
            label: 'Bugün Cuma',
            subtitle: 'Bu haftanın Diyanet Cuma hutbesini gör',
            icon: 'sunny-outline' as const,
          }
        : state === 'friday_done'
          ? {
              label: 'Cuma Mübarek Olsun',
              subtitle: 'Hutbeyi henüz okumadıysan göz at',
              icon: 'checkmark-circle-outline' as const,
            }
          : {
              label: 'Cuma Hutbesi',
              subtitle: 'Diyanet hutbelerini her zaman görüntüle',
              icon: 'book-outline' as const,
            };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={openHutbe}
      className="mx-4 mb-4 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/10" />
      <View className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-emerald-400/10" />

      <View className="flex-row items-center gap-3 px-4 py-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/20">
          <Ionicons name="book" size={22} color={isDark ? '#10b981' : '#059669'} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name={config.icon} size={11} color={isDark ? '#34d399' : '#059669'} />
            <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {config.label} · Cuma Hutbesi
            </Text>
          </View>
          <Text className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            Diyanet Hutbesi
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">{config.subtitle}</Text>
        </View>
        <Ionicons name="open-outline" size={18} color={isDark ? '#10b981' : '#059669'} />
      </View>
    </TouchableOpacity>
  );
}
