import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Platform, Share } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SurahsStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { quranService, Verse } from '@/services/quran.service';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/constants/theme';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahDetail'>;

export default function SurahDetailScreen({ route }: Props) {
  const { surahId, surahName } = route.params;
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useAppTheme();

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
    <Screen  safeAreaEdges={['left', 'right']}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>Ayetler yükleniyor...</Text>
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
              style={{
                marginBottom: 24, overflow: 'hidden', borderRadius: 24, borderWidth: 1,
                borderColor: colors.cardBorder, backgroundColor: colors.card,
                shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', paddingHorizontal: 24, paddingVertical: 12 }}>
                <View style={{ height: 24, width: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.teal }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#fff' }}>{verse.verse_number}</Text>
                </View>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color={colors.textSecondary}
                  onPress={() => shareVerse(verse)}
                />
              </View>

              <View style={{ padding: 16 }}>
                <Text
                  style={{ marginBottom: 4, fontSize: 24, lineHeight: 50, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'System' : 'serif' }}>
                  {verse.transcription}
                </Text>
                <Text
                  style={{ marginBottom: 4, textAlign: 'right', fontSize: 20, lineHeight: 50, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'System' : 'serif' }}>
                  {verse.verse_simplified}
                </Text>

                <View style={{ marginBottom: 24, height: 1, width: '100%', backgroundColor: colors.cardBorder }} />

                <Text style={{ fontSize: 16, fontWeight: '500', fontStyle: 'italic', lineHeight: 28, color: colors.textSecondary }}>
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
