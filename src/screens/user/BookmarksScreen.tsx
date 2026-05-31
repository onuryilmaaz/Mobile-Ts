/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { useQuranStore } from '@/store/quran.store';
import { alert } from '@/store/alert.store';
import type { SurahsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<SurahsStackParamList>;

export default function BookmarksScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const { bookmarks, load, removeBookmark } = useQuranStore();

  useEffect(() => {
    load();
  }, []);

  const open = (surahId: number, surahName: string, verseNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SurahDetail', { surahId, surahName, focusVerse: verseNumber } as any);
  };

  const confirmRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    alert.confirm(
      'Yer İmini Kaldır',
      'Bu ayeti yer imlerinden çıkarmak istiyor musun?',
      async () => {
        await removeBookmark(id);
      },
      'Kaldır',
      'İptal',
      true
    );
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Yer İmlerim" navigation={navigation as any} />

      {bookmarks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-500/10">
            <Ionicons name="bookmark-outline" size={36} color={isDark ? '#14b8a6' : '#0f766e'} />
          </View>
          <Text className="mt-5 text-lg font-black text-slate-900 dark:text-white">
            Henüz yer imi yok
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Sure detayında ayetin yanındaki yer imi simgesine dokunarak burayı doldurabilirsin.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          <Text className="mb-3 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {bookmarks.length} YER İMİ
          </Text>
          {bookmarks.map((b, i) => (
            <Animated.View key={b.id} entering={FadeInDown.delay(i * 30).duration(300)}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => open(b.surahId, b.surahName, b.verseNumber)}
                onLongPress={() => confirmRemove(b.id)}
                className="mb-3 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/15">
                    <Ionicons name="bookmark" size={18} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-black text-slate-900 dark:text-white">
                      {b.surahName} Suresi
                    </Text>
                    <Text className="mt-0.5 text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                      {b.verseNumber}. Ayet
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmRemove(b.id)}
                    hitSlop={8}
                    className="h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color={isDark ? '#94a3b8' : '#64748b'}
                    />
                  </TouchableOpacity>
                </View>
                {b.preview && (
                  <Text
                    className="mt-3 text-xs italic leading-5 text-slate-500 dark:text-slate-400"
                    numberOfLines={3}>
                    “{b.preview}”
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
