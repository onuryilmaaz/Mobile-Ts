import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { quranService, Verse } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

export default function SurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

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
    <Screen className="bg-slate-50" safeAreaEdges={['left', 'right']}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text className="mt-4 font-medium text-slate-500">Ayetler yükleniyor...</Text>
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
              className="mb-6 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm">
              <View className="flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50 px-6 py-3">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-600">
                  <Text className="text-xs font-black text-white">{verse.verse_number}</Text>
                </View>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color="#64748b"
                  onPress={() => shareVerse(verse)}
                />
              </View>

              <View className="p-4">
                <Text
                  className="mb-1 text-2xl leading-[50px] text-slate-900"
                  style={{ fontFamily: Platform.OS === 'ios' ? 'System' : 'serif' }}>
                  {verse.transcription}
                </Text>
                <Text
                  className="mb-1 text-right text-xl leading-[50px] text-slate-900"
                  style={{ fontFamily: Platform.OS === 'ios' ? 'System' : 'serif' }}>
                  {verse.verse_simplified}
                </Text>

                <View className="mb-6 h-[1px] w-full bg-slate-100" />

                <Text className="text-base font-medium italic leading-7 text-slate-700">
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
