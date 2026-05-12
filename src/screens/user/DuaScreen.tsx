/* eslint-disable no-unused-expressions */
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Share, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useTheme } from '@/hooks/useTheme';
import { DUA_CATEGORIES, type Dua, type DuaCategory } from '@/data/duas';
import { useFocusEffect } from '@react-navigation/native';

const FAVORITES_KEY = 'DUA_FAVORITES';

export default function DuaScreen() {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<DuaCategory | null>(null);
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
        if (val) setFavorites(new Set(JSON.parse(val)));
      });
    }, [])
  );

  const toggleFavorite = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const shareDua = async (dua: Dua) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `${dua.title}\n\n${dua.arabic}\n\n"${dua.turkish}"\n\n#SalahApp`,
    });
  };

  const favoriteDuas = DUA_CATEGORIES.flatMap((c) => c.duas).filter((d) => favorites.has(d.id));

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="mx-4 mb-5 mt-4">
          <Text className="text-2xl font-black text-slate-900 dark:text-white">
            Dua Koleksiyonu
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Günlük dualar ve zikirler
          </Text>
        </View>

        {/* Favoriler */}
        {favoriteDuas.length > 0 && (
          <View className="mx-4 mb-5">
            <View className="mb-3 flex-row items-center gap-2">
              <Ionicons name="heart" size={16} color="#ec4899" />
              <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Favoriler
              </Text>
            </View>
            {favoriteDuas.map((dua) => (
              <TouchableOpacity
                key={dua.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDua(dua);
                }}
                className="mb-2 flex-row items-center justify-between rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 dark:border-pink-500/20 dark:bg-pink-500/10">
                <Text
                  className="flex-1 text-sm font-bold text-slate-900 dark:text-white"
                  numberOfLines={1}>
                  {dua.title}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? '#ec489960' : '#ec4899'}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Kategoriler */}
        <View className="mx-4">
          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Kategoriler
          </Text>
          <View className="gap-3">
            {DUA_CATEGORIES.map((cat, idx) => (
              <Animated.View key={cat.id} entering={FadeInUp.delay(idx * 60).duration(400)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat);
                  }}
                  className="flex-row items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  activeOpacity={0.7}>
                  <View
                    className="mr-4 h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: cat.accentDim }}>
                    <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-black text-slate-900 dark:text-white">{cat.title}</Text>
                    <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {cat.duas.length} dua
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? 'rgba(255,255,255,0.2)' : '#94a3b8'}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Kategori Modal */}
      <Modal
        visible={!!selectedCategory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCategory(null)}>
        <View className="flex-1 bg-white dark:bg-slate-900">
          <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <View className="flex-row items-center gap-3">
              {selectedCategory && (
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: selectedCategory.accentDim }}>
                  <Ionicons
                    name={selectedCategory.icon as any}
                    size={20}
                    color={selectedCategory.color}
                  />
                </View>
              )}
              <Text className="text-lg font-black text-slate-900 dark:text-white">
                {selectedCategory?.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedCategory?.duas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item: dua }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory(null);
                  setTimeout(() => setSelectedDua(dua), 300);
                }}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60"
                activeOpacity={0.8}>
                <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                  <Text className="font-black text-slate-900 dark:text-white">{dua.title}</Text>
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => toggleFavorite(dua.id)}>
                      <Ionicons
                        name={favorites.has(dua.id) ? 'heart' : 'heart-outline'}
                        size={18}
                        color={favorites.has(dua.id) ? '#ec4899' : isDark ? '#475569' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => shareDua(dua)}>
                      <Ionicons
                        name="share-outline"
                        size={18}
                        color={isDark ? '#475569' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="px-5 py-4">
                  <Text className="mb-3 text-right text-[18px] font-bold leading-8 text-slate-900 dark:text-white">
                    {dua.arabic}
                  </Text>
                  <Text className="mb-2 text-xs italic text-slate-500 dark:text-slate-400">
                    {dua.transliteration}
                  </Text>
                  <Text className="text-sm leading-5 text-slate-700 dark:text-slate-300">
                    {dua.turkish}
                  </Text>
                  {dua.source && (
                    <Text className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      Kaynak: {dua.source}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Dua Detay Modal */}
      <Modal
        visible={!!selectedDua}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDua(null)}>
        {selectedDua && (
          <View className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <Text className="flex-1 text-lg font-black text-slate-900 dark:text-white">
                {selectedDua.title}
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => toggleFavorite(selectedDua.id)}>
                  <Ionicons
                    name={favorites.has(selectedDua.id) ? 'heart' : 'heart-outline'}
                    size={22}
                    color={
                      favorites.has(selectedDua.id) ? '#ec4899' : isDark ? '#475569' : '#94a3b8'
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => shareDua(selectedDua)}>
                  <Ionicons
                    name="share-social-outline"
                    size={22}
                    color={isDark ? '#475569' : '#94a3b8'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedDua(null)}
                  className="ml-1 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
              <View className="mb-6 rounded-3xl bg-slate-50 p-6 dark:bg-slate-800/60">
                <Text className="text-right text-[22px] font-bold leading-10 text-slate-900 dark:text-white">
                  {selectedDua.arabic}
                </Text>
              </View>

              <View className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Okunuş
                </Text>
                <Text className="text-base italic leading-6 text-slate-600 dark:text-slate-300">
                  {selectedDua.transliteration}
                </Text>
              </View>

              <View className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 p-4 dark:border-teal-500/20 dark:bg-teal-500/10">
                <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Türkçe Anlamı
                </Text>
                <Text className="text-base leading-6 text-slate-700 dark:text-slate-200">
                  {selectedDua.turkish}
                </Text>
              </View>

              {selectedDua.source && (
                <View className="flex-row items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                  <Ionicons
                    name="library-outline"
                    size={14}
                    color={isDark ? '#475569' : '#94a3b8'}
                  />
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Kaynak: {selectedDua.source}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </Screen>
  );
}
