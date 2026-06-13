import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { gamificationApi } from '@/modules/gamification/gamification.api';
import { useTheme } from '@/hooks/useTheme';

/**
 * Stats ekranında haftalık ibadet pattern'inin AI analizini gösterir.
 * AI kapalıysa / mesaj yoksa hiç render edilmez.
 */
export function AiInsightCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const fetchInsight = useCallback(async () => {
    try {
      const res = await gamificationApi.getInsight();
      setMessage(res.data?.data?.message ?? null);
    } catch {
      setMessage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  if (loading) {
    return (
      <View className="mx-4 mb-5 h-[90px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <ActivityIndicator color={isDark ? '#14b8a6' : '#0f766e'} />
      </View>
    );
  }

  if (!message) return null;

  return (
    <Animated.View entering={FadeIn.duration(500)} className="mx-4 mb-5">
      <View className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/[8%]">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
            <Ionicons name="bulb" size={16} color={isDark ? '#a5b4fc' : '#4f46e5'} />
          </View>
          <Text className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
            AI İçgörü
          </Text>
        </View>
        <Text className="mt-3 text-[15px] font-semibold leading-7 text-slate-800 dark:text-slate-100">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
