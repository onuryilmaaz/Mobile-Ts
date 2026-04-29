import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { quranService, Verse } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/theme.store';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

export default function SurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeStore();

  useEffect(() => {
    fetchVerses();
  }, []);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.acikkuran.com/surah/${surahId}`);
      const result = await response.json();
      setVerses(result.data.verses);
    } catch (error) {
      console.error('Error fetching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareVerse = async (verse: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${surahName} Suresi, ${verse.verse_number}. Ayet: \n\n"${verse.translation.text}"\n\n#SalahApp`,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#0f766e'} />
          <Text className="mt-4 text-base font-semibold text-slate-600 dark:text-slate-400">
            Ayetler yükleniyor...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          {verses.map((verse, index) => (
            <Animated.View
              key={verse.id}
              entering={FadeInUp.delay(index * 50).duration(400)}
              className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#111827] shadow-black/5 dark:shadow-black/30">
              <View className="flex-row items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 dark:border-white/5 dark:bg-white/5">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500">
                  <Text className="text-xs font-black text-white">{verse.verse_number}</Text>
                </View>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'}
                  onPress={() => shareVerse(verse)}
                />
              </View>

              <View className="p-4">
                <Text
                  className={`mb-1 text-2xl text-slate-900 dark:text-white ${Platform.OS === 'ios' ? 'font-sans' : 'font-serif'}`}
                  style={{ lineHeight: 50 }}>
                  {verse.transcription}
                </Text>
                <Text
                  className={`mb-1 text-right text-xl text-slate-900 dark:text-white ${Platform.OS === 'ios' ? 'font-sans' : 'font-serif'}`}
                  style={{ lineHeight: 50 }}>
                  {verse.verse_simplified}
                </Text>

                <View className="my-6 h-[1px] w-full bg-slate-200 dark:bg-white/10" />

                <Text className="text-base font-medium italic leading-7 text-slate-600 dark:text-slate-400">
                  "{verse.translation.text}"
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
