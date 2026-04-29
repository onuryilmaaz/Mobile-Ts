import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { quranService, Surah } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/theme.store';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahsMain'>;

export default function SurahBrowserScreen({ navigation }: Props) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark } = useThemeStore();

  useEffect(() => {
    fetchSurahs();
  }, []);

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
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 shadow-black/5">
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
              <Ionicons name="close-circle" size={18} color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#0f766e'} />
          <Text className="mt-4 text-base font-semibold text-slate-600 dark:text-slate-400">
            Sureler yükleniyor...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}>
          {filteredSurahs.map((surah, index) => (
            <Animated.View
              key={surah.id}
              entering={FadeInDown.delay((index % 10) * 50).duration(400)}
              layout={Layout.springify()}>
              <TouchableOpacity
                onPress={() => handleSurahPress(surah)}
                className="mb-3 flex-row items-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 shadow-black/5">
                
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/15">
                  <Text className="text-lg font-black text-teal-700 dark:text-teal-400">
                    {surah.id}
                  </Text>
                </View>

                <View className="ml-4 flex-1">
                  <Text className="text-base font-bold text-slate-900 dark:text-white">
                    {surah.name} Suresi
                  </Text>
                  <Text className="mt-0.5 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {surah.verse_count} Ayet
                  </Text>
                </View>

                <View className="mr-2 items-end">
                  <Text className="text-xl font-bold text-slate-900 dark:text-white">
                    {surah.name_arabic}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'} />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {filteredSurahs.length === 0 && (
            <View className="items-center justify-center py-20">
              <Ionicons name="search-outline" size={48} color={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'} />
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
