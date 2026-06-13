import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { gamificationApi } from '@/modules/gamification/gamification.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTheme } from '@/hooks/useTheme';

/**
 * Ana ekranda kullanıcının ibadet verisine göre kişiselleştirilmiş
 * AI motivasyon mesajını gösterir. Mesaj yoksa hiç render edilmez.
 */
export function MotivationCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const fetchMotivation = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await gamificationApi.getMotivation();
      setMessage(res.data?.data?.message ?? null);
    } catch {
      // Motivasyon mesajı kritik değil — sessizce geç.
      setMessage(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMotivation();
  }, [fetchMotivation]);

  if (loading) {
    return (
      <View className="mx-4 mb-6 h-[96px] items-center justify-center rounded-[32px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <ActivityIndicator color={isDark ? '#14b8a6' : '#0f766e'} />
      </View>
    );
  }

  if (!message) return null;

  return (
    <Animated.View entering={FadeIn.duration(600)} className="mx-4 mb-6">
      <View className="overflow-hidden rounded-[32px] border border-teal-100 bg-teal-50/60 p-5 dark:border-teal-500/20 dark:bg-teal-500/[8%]">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-500/20">
            <Ionicons name="sparkles" size={16} color={isDark ? '#2dd4bf' : '#0f766e'} />
          </View>
          <Text className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
            Günün İlhamı
          </Text>
        </View>
        <Text className="mt-3 text-[15px] font-semibold leading-7 text-slate-800 dark:text-slate-100">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
