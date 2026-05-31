/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import type { FamilyStackParamList } from '@/navigation/types';
import type { TaskType } from '@/modules/family/family.types';
import { TASK_TYPE_META } from '@/modules/family/family.types';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';

type Nav = NativeStackNavigationProp<FamilyStackParamList>;
type Route = RouteProp<FamilyStackParamList, 'CreateTask'>;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export default function CreateTaskScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { childId } = route.params;
  const { templates, fetchTemplates, createTask } = useFamilyStore();
  const { isDark } = useTheme();

  const [tab, setTab] = useState<'template' | 'custom'>('template');
  const [taskType, setTaskType] = useState<TaskType>('prayer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'once'>('daily');
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [rewardStars, setRewardStars] = useState(1);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!templates.length) fetchTemplates();
  }, []);

  const handleSelectTemplate = (t: (typeof templates)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTitle(t.title);
    setDescription(t.description);
    setTaskType(t.task_type);
    setRewardStars(t.reward_stars);
    setRequiresApproval(t.requires_approval);
    setTab('custom');
  };

  const DAYS = [
    { label: 'Paz', value: 0 },
    { label: 'Pzt', value: 1 },
    { label: 'Sal', value: 2 },
    { label: 'Çar', value: 3 },
    { label: 'Per', value: 4 },
    { label: 'Cum', value: 5 },
    { label: 'Cmt', value: 6 },
  ];

  const toggleDay = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScheduledDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await createTask(childId, {
        task_type: taskType,
        title: title.trim(),
        description: description.trim() || undefined,
        recurrence,
        scheduled_days:
          recurrence === 'weekly' && scheduledDays.length > 0 ? scheduledDays : undefined,
        reward_stars: rewardStars,
        requires_approval: requiresApproval,
        requires_proof: false,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <View className="flex-row border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {(['template', 'custom'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 items-center border-b-2 py-3.5 ${
                tab === t ? 'border-teal-600 dark:border-teal-400' : 'border-transparent'
              }`}>
              <Text
                className={`text-sm font-bold ${
                  tab === t
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                {t === 'template' ? 'Şablonlar' : 'Özel Görev'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'template' ? (
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}>
            <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Şablon Seç
            </Text>
            {templates.map((t, i) => {
              const meta = TASK_TYPE_META[t.task_type];
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectTemplate(t)}
                  className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl border"
                    style={{
                      backgroundColor: isDark ? `${meta.color}20` : `${meta.color}15`,
                      borderColor: `${meta.color}35`,
                    }}>
                    <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900 dark:text-white">{t.title}</Text>
                    <Text
                      className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
                      numberOfLines={1}>
                      {t.description}
                    </Text>
                  </View>
                  <View className="rounded-full bg-amber-50 px-2 py-0.5 dark:bg-amber-500/10">
                    <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {'⭐'.repeat(t.reward_stars)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <SectionLabel>Görev Tipi</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 py-0.5">
                  {(Object.keys(TASK_TYPE_META) as TaskType[]).map((type) => {
                    const meta = TASK_TYPE_META[type];
                    const active = taskType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTaskType(type);
                        }}
                        className={`flex-row items-center gap-1.5 rounded-2xl border px-3 py-2 ${
                          active
                            ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                        }`}>
                        <Text style={{ fontSize: 15 }}>{meta.emoji}</Text>
                        <Text
                          className={`text-sm font-bold ${
                            active
                              ? 'text-teal-700 dark:text-teal-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}>
                          {meta.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <SectionLabel>Başlık</SectionLabel>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Görev başlığı"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
              <SectionLabel>Açıklama</SectionLabel>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Opsiyonel açıklama"
                numberOfLines={2}
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
            </View>

            <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <SectionLabel>Tekrar Sıklığı</SectionLabel>
              <View className="flex-row gap-2">
                {(['daily', 'weekly', 'once'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRecurrence(r);
                      if (r !== 'weekly') setScheduledDays([]);
                    }}
                    className={`flex-1 items-center rounded-2xl border py-3 ${
                      recurrence === r
                        ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}>
                    <Text
                      className={`text-sm font-bold ${
                        recurrence === r
                          ? 'text-teal-700 dark:text-teal-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                      {r === 'daily' ? 'Her Gün' : r === 'weekly' ? 'Haftalık' : 'Bir Kez'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {recurrence === 'weekly' && (
                <View className="mt-3">
                  <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                    Günler (boş = her gün)
                  </Text>
                  <View className="flex-row gap-1.5">
                    {DAYS.map((d) => {
                      const active = scheduledDays.includes(d.value);
                      return (
                        <TouchableOpacity
                          key={d.value}
                          onPress={() => toggleDay(d.value)}
                          className={`flex-1 items-center rounded-xl border py-2 ${
                            active
                              ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                              : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                          }`}>
                          <Text
                            className={`text-[11px] font-black ${
                              active
                                ? 'text-teal-700 dark:text-teal-400'
                                : 'text-slate-400 dark:text-slate-600'
                            }`}>
                            {d.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <View className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <SectionLabel>Yıldız Ödülü</SectionLabel>
              <View className="mb-4 flex-row gap-2">
                {[1, 2, 3, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRewardStars(n);
                    }}
                    className={`flex-1 items-center rounded-2xl border py-3 ${
                      rewardStars === n
                        ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}>
                    <Text
                      className={`font-black ${
                        rewardStars === n
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}>
                      {'⭐'.repeat(n)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRequiresApproval(!requiresApproval);
                }}
                className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
                  requiresApproval
                    ? 'border-teal-600/30 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}>
                <View
                  className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                    requiresApproval
                      ? 'border-teal-600 bg-teal-600 dark:border-teal-500 dark:bg-teal-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                  {requiresApproval && <Ionicons name="checkmark" size={11} color="white" />}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    Ebeveyn onayı gereksin
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    Onay verilene kadar yıldız verilmez
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading || !title.trim()}
              className={`items-center rounded-2xl py-4 ${
                loading || !title.trim()
                  ? 'bg-slate-200 dark:bg-slate-800'
                  : 'bg-teal-600 dark:bg-teal-500'
              }`}>
              <Text
                className={`text-base font-black ${
                  loading || !title.trim() ? 'text-slate-400 dark:text-slate-600' : 'text-white'
                }`}>
                {loading ? 'Oluşturuluyor...' : 'Görevi Oluştur'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
