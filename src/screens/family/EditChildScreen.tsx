/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { alert } from '@/store/alert.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';

type Nav = NativeStackNavigationProp<FamilyStackParamList>;
type Route = RouteProp<FamilyStackParamList, 'EditChild'>;

const EMOJIS = [
  '🌙',
  '⭐',
  '🌟',
  '☀️',
  '🌸',
  '🦋',
  '🐬',
  '🦁',
  '🐧',
  '🍀',
  '🎈',
  '🌺',
  '🦅',
  '🐉',
  '🌴',
];

function Label({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export default function EditChildScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { childId } = route.params;
  const { children, updateChild } = useFamilyStore();
  const { isDark } = useTheme();

  const child = children.find((c) => c.id === childId);

  const [name, setName] = useState(child?.name ?? '');
  const [birthYear, setBirthYear] = useState(child?.birth_year?.toString() ?? '');
  const [gender, setGender] = useState<'erkek' | 'kız' | null>(child?.gender ?? null);
  const [selectedEmoji, setSelectedEmoji] = useState(child?.avatar_emoji ?? '🌙');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!child) navigation.goBack();
  }, [child]);

  if (!child) return null;

  const hasChanges =
    name !== child.name ||
    birthYear !== (child.birth_year?.toString() ?? '') ||
    gender !== child.gender ||
    selectedEmoji !== child.avatar_emoji;

  const handleSave = async () => {
    if (!name.trim()) {
      alert.error('Hata', 'İsim boş bırakılamaz');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await updateChild(childId, {
        name: name.trim(),
        birth_year: birthYear ? Number(birthYear) : null,
        gender: gender ?? null,
        avatar_emoji: selectedEmoji,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const avatarBg =
    gender === 'erkek'
      ? 'bg-emerald-50 dark:bg-emerald-500/10'
      : gender === 'kız'
        ? 'bg-violet-50 dark:bg-violet-500/10'
        : 'bg-teal-50 dark:bg-teal-500/10';

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <View className={`h-20 w-20 items-center justify-center rounded-[24px] ${avatarBg}`}>
            <Text style={{ fontSize: 40 }}>{selectedEmoji}</Text>
          </View>
          <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Emoji Seç
          </Text>
          <View className="flex-row flex-wrap justify-center gap-2">
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedEmoji(e);
                }}
                className={`h-11 w-11 items-center justify-center rounded-2xl border ${
                  selectedEmoji === e
                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <Label>İsim</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Çocuğun adı"
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            autoCapitalize="words"
          />
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <Label>Doğum Yılı</Label>
          <Input
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder="ör. 2016"
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          />
          <Label>Cinsiyet</Label>
          <View className="flex-row gap-3">
            {(['erkek', 'kız'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGender(gender === g ? null : g);
                }}
                className={`flex-1 items-center rounded-2xl border py-3 ${
                  gender === g
                    ? g === 'erkek'
                      ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/15'
                      : 'border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-500/15'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}>
                <Text
                  className={`font-bold ${
                    gender === g
                      ? g === 'erkek'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-violet-700 dark:text-violet-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}>
                  {g === 'erkek' ? '👦 Erkek' : '👧 Kız'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !name.trim() || !hasChanges}
          className={`items-center rounded-2xl py-4 ${
            loading || !name.trim() || !hasChanges
              ? 'bg-slate-200 dark:bg-slate-800'
              : 'bg-teal-600 dark:bg-teal-500'
          }`}>
          <Text
            className={`text-base font-black ${
              loading || !name.trim() || !hasChanges
                ? 'text-slate-400 dark:text-slate-600'
                : 'text-white'
            }`}>
            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
