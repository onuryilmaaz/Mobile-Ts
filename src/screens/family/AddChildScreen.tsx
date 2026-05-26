import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { alert } from '@/store/alert.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';

type Nav = NativeStackNavigationProp<FamilyStackParamList>;

const EMOJIS = ['🌙', '⭐', '🌟', '☀️', '🌸', '🦋', '🐬', '🦁', '🐧', '🍀', '🎈'];

function Label({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export default function AddChildScreen() {
  const navigation = useNavigation<Nav>();
  const { createChild } = useFamilyStore();
  const { isDark } = useTheme();

  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState<'erkek' | 'kız' | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState('🌙');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert.error('Hata', 'Çocuğun adını girin');
      return;
    }
    if (pin && pin.length !== 4) {
      alert.error('Hata', 'PIN 4 haneli olmalıdır');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const child = await createChild({
        name: name.trim(),
        birth_year: birthYear ? Number(birthYear) : undefined,
        gender: gender ?? undefined,
        avatar_emoji: selectedEmoji,
        pin_code: pin || undefined,
      });
      if (child) navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Avatar seçici */}
        <View className="items-center gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-teal-50 dark:bg-teal-500/10">
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

        {/* İsim */}
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

        {/* Doğum yılı & Cinsiyet */}
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
                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}>
                <Text
                  className={`font-bold ${
                    gender === g
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}>
                  {g === 'erkek' ? '👦 Erkek' : '👧 Kız'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PIN */}
        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <Label>PIN Kodu (Opsiyonel)</Label>
          <Input
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="4 haneli PIN"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          />
          <View className="mt-2 flex-row items-center gap-2">
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={isDark ? '#475569' : '#94a3b8'}
            />
            <Text className="text-[11px] text-slate-400 dark:text-slate-500">
              PIN ile çocuk modu açılır. Boş bırakılabilir.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          className={`items-center rounded-2xl py-4 ${
            loading || !name.trim()
              ? 'bg-slate-200 dark:bg-slate-800'
              : 'bg-teal-600 dark:bg-teal-500'
          }`}>
          <Text
            className={`text-base font-black ${
              loading || !name.trim() ? 'text-slate-400 dark:text-slate-600' : 'text-white'
            }`}>
            {loading ? 'Oluşturuluyor...' : 'Profil Oluştur'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
