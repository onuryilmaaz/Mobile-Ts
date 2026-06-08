import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { useFamilyStore } from '@/modules/family/family.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';

type Nav = NativeStackNavigationProp<FamilyStackParamList>;
type Route = RouteProp<FamilyStackParamList, 'CompletionDetail'>;

export default function CompletionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { completionId } = route.params;
  const { pendingApprovals, reviewCompletion } = useFamilyStore();
  const { isDark } = useTheme();

  const item = pendingApprovals.find((c) => c.id === completionId);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!item) {
    return (
      <Screen safeAreaEdges={['left', 'right']}>
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Text className="text-slate-400 dark:text-slate-600">Tamamlama bulunamadı</Text>
        </View>
      </Screen>
    );
  }

  const handle = async (approved: boolean) => {
    Haptics.impactAsync(
      approved ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
    setLoading(true);
    try {
      await reviewCompletion(item.id, approved, note || undefined);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
            <Text style={{ fontSize: 32 }}>{item.avatar_emoji ?? '🌙'}</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-xl font-black text-slate-900 dark:text-white">
              {item.child_name}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {item.title} görevi tamamlandı
            </Text>
          </View>
          <View className="rounded-full bg-amber-50 px-4 py-1.5 dark:bg-amber-500/10">
            <Text className="text-sm font-black text-amber-600 dark:text-amber-400">
              +{item.reward_stars} ⭐ bekliyor
            </Text>
          </View>
        </View>

        {item.evidence_url && (
          <View className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <Image
              source={{ uri: item.evidence_url }}
              style={{ width: '100%', height: 200 }}
              resizeMode="cover"
            />
          </View>
        )}

        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Mesaj (Opsiyonel)
          </Text>
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="Çocuğuna bir mesaj bırak..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => handle(false)}
            disabled={loading}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 dark:border-red-500/20 dark:bg-red-500/10">
            <Ionicons
              name="close-circle-outline"
              size={18}
              color={isDark ? '#f87171' : '#ef4444'}
            />
            <Text className="font-black text-red-500 dark:text-red-400">Reddet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handle(true)}
            disabled={loading}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-teal-600 py-4 dark:bg-teal-500">
            <Ionicons name="checkmark-circle" size={18} color="white" />
            <Text className="font-black text-white">{loading ? '...' : 'Onayla'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
