import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { hadithService } from '@/services/hadith.service';
import { quranService } from '@/services/quran.service';
import { useThemeStore } from '@/store/theme.store';

interface Inspiration {
  type: 'Ayet' | 'Hadis';
  text: string;
  source: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function DailyInspirationCard() {
  const [current, setCurrent] = useState<Inspiration | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeStore();

  const fetchInspiration = useCallback(async () => {
    try {
      setLoading(true);
      const randomType = Math.random() > 0.5 ? 'Ayet' : 'Hadis';

      if (randomType === 'Ayet') {
        const result = await quranService.getRandomVerse();
        if (result) {
          setCurrent({
            type: 'Ayet',
            text: result.verse.translation.text,
            source: `${result.surah.name} Suresi, ${result.verse.verse_number}. Ayet`,
            icon: 'sunny',
          });
        }
      } else {
        const result = await hadithService.getRandomHadith();
        if (result) {
          setCurrent({
            type: 'Hadis',
            text: result.hadith.text,
            source: result.bookName,
            icon: 'heart',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching inspiration:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspiration();
  }, [fetchInspiration]);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchInspiration();
  };

  const shareInspiration = async () => {
    if (!current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await Share.share({
        message: `"${current.text}" - ${current.source} #SalahApp`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  if (!current && loading) {
    return (
      <View className="mx-4 mb-6 items-center justify-center rounded-[32px] border border-slate-200 bg-white p-12 dark:border-white/5 dark:bg-[#111827]">
        <ActivityIndicator color={isDark ? '#14b8a6' : '#0f766e'} />
      </View>
    );
  }

  if (!current) return null;

  return (
    <View className="mx-4 mb-6">
      <Animated.View
        layout={Layout.springify()}
        className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-black/5 dark:border-white/5 dark:bg-[#111827] dark:shadow-black/30">
        
        <View className="flex-row items-center justify-between px-6 pt-6">
          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/15">
              <Ionicons name={current.icon as any} size={16} color={isDark ? '#14b8a6' : '#0f766e'} />
            </View>
            <Text className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {current.type}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={shareInspiration}
              className="h-8 w-8 items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5">
              <Ionicons name="share-outline" size={16} color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              className="h-8 w-8 items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5">
              {loading ? (
                <ActivityIndicator size="small" color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'} />
              ) : (
                <Ionicons name="refresh-outline" size={16} color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          key={current.text}
          entering={FadeIn.duration(600)}
          className="items-center p-8">
          <Text
            className="text-center text-lg font-bold italic leading-8 text-slate-900 dark:text-white"
            numberOfLines={0}>
            "{current.text}"
          </Text>
          <View className="mt-6 flex-row items-center gap-2">
            <View className="h-[1px] w-8 bg-slate-200 dark:bg-white/10" />
            <Text className="text-[10px] font-black uppercase tracking-tighter text-teal-700 dark:text-teal-400">
              {current.source}
            </Text>
            <View className="h-[1px] w-8 bg-slate-200 dark:bg-white/10" />
          </View>
        </Animated.View>

        <View className="items-center bg-slate-50 px-6 py-4 dark:bg-white/5">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Manevi Huzur İçin Küçük Bir Hatırlatma
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
