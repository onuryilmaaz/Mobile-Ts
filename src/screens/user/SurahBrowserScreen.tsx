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
import { useAppTheme } from '@/constants/theme';

type Props = NativeStackScreenProps<SurahsStackParamList, 'SurahsMain'>;

export default function SurahBrowserScreen({ navigation }: Props) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { colors, isDark } = useAppTheme();

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
    <Screen  safeAreaEdges={['left', 'right']}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder="Sure arayın"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ marginLeft: 12, flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary }}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>Sureler yükleniyor...</Text>
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
                style={{
                  marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 24,
                  borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card,
                  padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
                }}>
                <View style={{ height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.teal }}>{surah.id}</Text>
                </View>

                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary }}>{surah.name} Suresi</Text>
                  <Text style={{ marginTop: 2, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>
                    {surah.verse_count} Ayet
                  </Text>
                </View>

                <View style={{ marginRight: 8, alignItems: 'flex-end' }}>
                  <Text
                    style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, fontFamily: 'System' }}>
                    {surah.name_arabic}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {filteredSurahs.length === 0 && (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>Aradığınız sure bulunamadı</Text>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
