/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { quranService, Surah } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useQuranStore } from '@/store/quran.store';
import { useHifzStore } from '@/modules/hifz/hifz.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { Skeleton, SkeletonLine } from '@/components/feedback/Skeleton';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahsMain'>;

export default function SurahBrowserScreen({ navigation }: Props) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark } = useTheme();
  const { lastRead, bookmarks, load: loadQuran } = useQuranStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { rows: hifzRows, load: loadHifz } = useHifzStore();

  useEffect(() => {
    fetchSurahs();
    loadQuran();
    if (isAuthenticated) loadHifz();
  }, [isAuthenticated]);

  const hifzMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of hifzRows) m.set(r.surah_id, r.status);
    return m;
  }, [hifzRows]);

  const memorizedCount = hifzRows.filter((r) => r.status === 'memorized').length;

  const fetchSurahs = async () => {
    try {
      setLoading(true);
      const data = await quranService.getSurahs();
      setSurahs(data || []);
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurahs = useMemo(() => {
    return surahs.filter(
      (s) =>
        (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        s.id.toString().includes(searchQuery)
    );
  }, [surahs, searchQuery]);

  const handleSurahPress = (surah: Surah) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SurahDetail', {
      surahId: surah.id,
      surahName: surah.name,
    });
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <View className="px-4 pb-2 pt-4">
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-950">
          <Ionicons name="search" size={20} color={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'} />
          <TextInput
            placeholder="Sure arayın"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-3 flex-1 text-base font-semibold text-slate-900 dark:text-white"
            placeholderTextColor={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={i}
              className="mb-3 flex-row items-center rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <Skeleton width={48} height={48} radius={16} />
              <View className="ml-4 flex-1 gap-2">
                <SkeletonLine width="60%" />
                <SkeletonLine width="30%" />
              </View>
              <Skeleton width={56} height={20} radius={4} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}>
          {!searchQuery && (lastRead || bookmarks.length > 0 || isAuthenticated) && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              className="mb-4">
              {lastRead && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('SurahDetail', {
                      surahId: lastRead.surahId,
                      surahName: lastRead.surahName,
                      focusVerse: lastRead.verseNumber,
                    } as any);
                  }}
                  className="w-44 overflow-hidden rounded-3xl border border-teal-200 bg-teal-50 p-3.5 dark:border-teal-500/30 dark:bg-teal-500/10">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="play-circle" size={18} color={isDark ? '#14b8a6' : '#0f766e'} />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">
                      Devam Et
                    </Text>
                  </View>
                  <Text className="mt-1.5 text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    {lastRead.surahName}
                  </Text>
                  <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">
                    {lastRead.verseNumber}. ayet
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Bookmarks' as any);
                }}
                className="w-44 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="bookmark" size={18} color="#f59e0b" />
                  <Text className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Yer İmleri
                  </Text>
                </View>
                <Text className="mt-1.5 text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
                  {bookmarks.length > 0 ? `${bookmarks.length} ayet` : 'Henüz yok'}
                </Text>
                <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {bookmarks.length > 0 ? 'Listeyi gör' : 'Bir ayete dokun'}
                </Text>
              </TouchableOpacity>
              {isAuthenticated && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Hafizlik' as any);
                  }}
                  className="w-44 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="library" size={18} color="#10b981" />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Hafızlık
                    </Text>
                  </View>
                  <Text className="mt-1.5 text-sm font-black text-slate-900 dark:text-white" numberOfLines={1}>
                    {memorizedCount}/114 sure
                  </Text>
                  <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {memorizedCount > 0 ? 'İlerlemeyi gör' : 'Hıfz takibi başlat'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {filteredSurahs.map((surah, index) => (
            <Animated.View
              key={surah.id}
              entering={FadeInDown.delay((index % 10) * 50).duration(400)}
              layout={Layout.springify()}>
              <TouchableOpacity
                onPress={() => handleSurahPress(surah)}
                className="mb-3 flex-row items-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-950">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/15">
                  <Text className="text-lg font-black text-teal-700 dark:text-teal-400">
                    {surah.id}
                  </Text>
                </View>

                <View className="ml-4 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">
                      {surah.name} Suresi
                    </Text>
                    {hifzMap.get(surah.id) === 'memorized' && (
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                    )}
                    {hifzMap.get(surah.id) === 'reviewing' && (
                      <Ionicons name="repeat" size={13} color="#a78bfa" />
                    )}
                    {hifzMap.get(surah.id) === 'in_progress' && (
                      <Ionicons name="time-outline" size={13} color="#f59e0b" />
                    )}
                  </View>
                  <Text className="mt-0.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {surah.verse_count} Ayet
                  </Text>
                </View>

                <View className="mr-2 items-end">
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">
                    {surah.name_arabic}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {filteredSurahs.length === 0 && (
            <View className="items-center justify-center py-20">
              <Ionicons
                name="search-outline"
                size={48}
                color={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'}
              />
              <Text className="mt-4 text-base font-semibold text-slate-500 dark:text-slate-400">
                Aradığınız sure bulunamadı
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
