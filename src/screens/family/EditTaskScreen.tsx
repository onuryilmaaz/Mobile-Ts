import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { alert } from '@/store/alert.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';

type Nav = NativeStackNavigationProp<FamilyStackParamList>;
type Route = RouteProp<FamilyStackParamList, 'EditTask'>;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export default function EditTaskScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { childId, taskId } = route.params;
  const { tasks, updateTask, deleteTask } = useFamilyStore();
  const { isDark } = useTheme();

  const task = tasks.find((t) => t.id === taskId);

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [rewardStars, setRewardStars] = useState(task?.reward_stars ?? 1);
  const [requiresApproval, setRequiresApproval] = useState(task?.requires_approval ?? false);
  const [isActive, setIsActive] = useState(task?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setRewardStars(task.reward_stars);
      setRequiresApproval(task.requires_approval);
      setIsActive(task.is_active);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await updateTask(childId, taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
        reward_stars: rewardStars,
        requires_approval: requiresApproval,
        is_active: isActive,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    alert.confirm(
      'Görevi Sil',
      'Bu görevi silmek istediğine emin misin?',
      async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await deleteTask(childId, taskId);
        navigation.goBack();
      },
      'Sil',
      'İptal',
      true,
    );
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <SectionLabel>Başlık</SectionLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          />
          <SectionLabel>Açıklama</SectionLabel>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Opsiyonel"
            multiline
            numberOfLines={2}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
          />
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <SectionLabel>Yıldız Ödülü</SectionLabel>
          <View className="flex-row gap-2">
            {[1, 2, 3, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRewardStars(n); }}
                className={`flex-1 rounded-2xl border py-3 items-center ${
                  rewardStars === n
                    ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}>
                <Text className={`font-black ${
                  rewardStars === n ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'
                }`}>{'⭐'.repeat(n)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none gap-3">
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRequiresApproval(!requiresApproval); }}
            className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
              requiresApproval
                ? 'border-teal-600/30 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            }`}>
            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
              requiresApproval ? 'border-teal-600 bg-teal-600 dark:border-teal-500 dark:bg-teal-500' : 'border-slate-300 dark:border-slate-600'
            }`}>
              {requiresApproval && <Ionicons name="checkmark" size={11} color="white" />}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Ebeveyn onayı gereksin</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Onay verilene kadar yıldız verilmez</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsActive(!isActive); }}
            className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
              isActive
                ? 'border-teal-600/30 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            }`}>
            <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
              isActive ? 'border-teal-600 bg-teal-600 dark:border-teal-500 dark:bg-teal-500' : 'border-slate-300 dark:border-slate-600'
            }`}>
              {isActive && <Ionicons name="checkmark" size={11} color="white" />}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">Görev aktif</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">Pasif görevler çocuğa gösterilmez</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !title.trim()}
          className={`rounded-2xl py-4 items-center ${
            loading || !title.trim() ? 'bg-slate-200 dark:bg-slate-800' : 'bg-teal-600 dark:bg-teal-500'
          }`}>
          <Text className={`text-base font-black ${
            loading || !title.trim() ? 'text-slate-400 dark:text-slate-600' : 'text-white'
          }`}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          className="rounded-2xl border border-red-200 bg-red-50 py-4 items-center dark:border-red-500/20 dark:bg-red-500/10">
          <Text className="font-black text-red-500 dark:text-red-400">Görevi Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
