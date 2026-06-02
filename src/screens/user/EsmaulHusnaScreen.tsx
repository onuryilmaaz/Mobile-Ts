import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { ESMAUL_HUSNA, type EsmaName } from '@/data/esmaulHusna';
import type { HomeStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const ARABIC_FONT = Platform.OS === 'ios' ? 'GeezaPro' : undefined;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/[âā]/g, 'a')
    .replace(/[îī]/g, 'i')
    .replace(/[ûū]/g, 'u')
    .replace(/[öô]/g, 'o')
    .replace(/[üû]/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/['’\-]/g, '');
}

export default function EsmaulHusnaScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EsmaName | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return ESMAUL_HUSNA;
    const q = normalize(query.trim());
    return ESMAUL_HUSNA.filter(
      (n) =>
        normalize(n.name).includes(q) ||
        normalize(n.meaning).includes(q) ||
        n.id.toString() === query.trim(),
    );
  }, [query]);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Esmaül Hüsna" navigation={navigation} />

      {/* Search */}
      <View className="px-4 pb-2 pt-2">
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <Ionicons name="search" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="İsim veya anlam ara"
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            className="ml-2 flex-1 text-sm text-slate-900 dark:text-white"
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-3 ml-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {filtered.length} İSİM
        </Text>

        {filtered.map((n, i) => (
          <Animated.View key={n.id} entering={FadeInDown.delay((i % 10) * 30).duration(300)}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(n);
              }}
              className="mb-3 flex-row items-center rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/15">
                <Text className="text-sm font-black text-amber-600 dark:text-amber-400">{n.id}</Text>
              </View>

              <View className="ml-4 flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-white">{n.name}</Text>
                <Text
                  className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
                  numberOfLines={2}>
                  {n.meaning}
                </Text>
              </View>

              <Text
                className="ml-2 text-xl text-slate-900 dark:text-white"
                style={{ fontFamily: ARABIC_FONT }}>
                {n.arabic}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {filtered.length === 0 && (
          <View className="items-center py-12">
            <Ionicons name="search-outline" size={36} color={isDark ? '#475569' : '#94a3b8'} />
            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">İsim bulunamadı</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail modal */}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelected(null)}
          className="flex-1 items-center justify-center bg-black/60 px-6">
          <TouchableOpacity
            activeOpacity={1}
            className="w-full overflow-hidden rounded-[32px] bg-white dark:bg-slate-900">
            {selected && (
              <>
                <View className="items-center bg-amber-50 px-6 py-8 dark:bg-amber-500/15">
                  <View className="rounded-2xl bg-amber-100 px-3 py-1 dark:bg-amber-500/20">
                    <Text className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {selected.id}. İSİM
                    </Text>
                  </View>
                  <Text
                    className="mt-4 text-5xl text-slate-900 dark:text-white"
                    style={{ fontFamily: ARABIC_FONT }}>
                    {selected.arabic}
                  </Text>
                  <Text className="mt-3 text-xl font-black text-slate-900 dark:text-white">
                    {selected.name}
                  </Text>
                </View>

                <View className="px-6 py-6">
                  <Text className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Anlamı
                  </Text>
                  <Text className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {selected.meaning}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  className="flex-row items-center justify-center gap-2 border-t border-slate-100 py-4 dark:border-slate-800">
                  <Ionicons name="close" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                  <Text className="text-sm font-bold text-slate-600 dark:text-slate-300">Kapat</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
