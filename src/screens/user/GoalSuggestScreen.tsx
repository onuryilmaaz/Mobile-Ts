import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { groupApi } from '@/modules/group/group.api';
import { useGroupStore } from '@/modules/group/group.store';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { GroupStackParamList } from '@/navigation/types';
import type { GroupActivityType } from '@/modules/group/group.types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GoalSuggest'>;
  route: RouteProp<GroupStackParamList, 'GoalSuggest'>;
};

type GoalType = 'group_total' | 'per_person' | 'streak';

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'group_total', label: 'Toplam Grup Hedefi', desc: 'Herkesin katkısı toplanarak tek hedef' },
  { value: 'per_person', label: 'Kişi Başı Hedef', desc: 'Her üye kendi hedefini tamamlar' },
  { value: 'streak', label: 'Seri Hedefi', desc: 'Arka arkaya gün sayısı' },
];

export default function GoalSuggestScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { isDark } = useTheme();
  const { currentGroup } = useGroupStore();

  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('group_total');
  const [targetValue, setTargetValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activityTypes: GroupActivityType[] = currentGroup?.activity_types ?? [];

  async function handleSuggest() {
    if (!title.trim()) return alert.error('Hata', 'Hedef başlığı gerekli.');
    const target = parseFloat(targetValue);
    if (!targetValue || isNaN(target) || target <= 0) {
      return alert.error('Hata', 'Geçerli bir hedef değeri girin.');
    }

    try {
      setLoading(true);
      await groupApi.suggestGoal(groupId, {
        title: title.trim(),
        goal_type: goalType,
        target_value: target,
        activity_type_id: selectedTypeId ?? undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        note: note.trim() || undefined,
      });
      alert.show({
        type: 'success',
        title: 'Gönderildi',
        message: 'Hedef öneriniz yöneticilere iletildi.',
        buttons: [{ text: 'Tamam', onPress: () => navigation.goBack(), style: 'default' }],
      });
    } catch (e: any) {
      alert.error('Hata', e?.response?.data?.message ?? 'Öneri gönderilemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">

          <Text className="mb-1 text-2xl font-black text-slate-900 dark:text-white">
            Hedef Öner
          </Text>
          <Text className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Yöneticiler önerinizi inceleyip onaylayabilir
          </Text>

          <Input
            label="Hedef Başlığı *"
            value={title}
            onChangeText={setTitle}
            placeholder="örn. Bu ay 500 sayfa Kuran okuyalım"
            maxLength={200}
          />

          {/* Hedef tipi */}
          <Text className="mb-2 ml-1 text-sm font-medium text-slate-700 dark:text-slate-100">
            Hedef Tipi *
          </Text>
          <View className="mb-4 gap-2">
            {GOAL_TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setGoalType(opt.value)}
                className={[
                  'rounded-2xl border p-4',
                  goalType === opt.value
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60',
                ].join(' ')}>
                <View className="flex-row items-center">
                  <View
                    className={[
                      'mr-3 h-5 w-5 items-center justify-center rounded-full border-2',
                      goalType === opt.value
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-slate-300 dark:border-slate-600',
                    ].join(' ')}>
                    {goalType === opt.value && (
                      <View className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={
                        goalType === opt.value
                          ? 'text-sm font-bold text-teal-700 dark:text-teal-400'
                          : 'text-sm font-bold text-slate-900 dark:text-white'
                      }>
                      {opt.label}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* İbadet tipi seçimi */}
          {activityTypes.length > 0 && (
            <>
              <Text className="mb-2 ml-1 text-sm font-medium text-slate-700 dark:text-slate-100">
                İbadet Tipi (opsiyonel)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setSelectedTypeId(null)}
                  className={[
                    'rounded-full border px-4 py-2',
                    selectedTypeId === null
                      ? 'border-teal-500 bg-teal-600'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                  ].join(' ')}>
                  <Text
                    className={
                      selectedTypeId === null
                        ? 'text-sm font-bold text-white'
                        : 'text-sm font-semibold text-slate-600 dark:text-slate-300'
                    }>
                    Genel
                  </Text>
                </TouchableOpacity>
                {activityTypes.map((at) => (
                  <TouchableOpacity
                    key={at.id}
                    onPress={() => setSelectedTypeId(at.id)}
                    className={[
                      'rounded-full border px-4 py-2',
                      selectedTypeId === at.id
                        ? 'border-teal-500 bg-teal-600'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                    ].join(' ')}>
                    <Text
                      className={
                        selectedTypeId === at.id
                          ? 'text-sm font-bold text-white'
                          : 'text-sm font-semibold text-slate-600 dark:text-slate-300'
                      }>
                      {at.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Input
            label="Hedef Değeri *"
            value={targetValue}
            onChangeText={setTargetValue}
            keyboardType="decimal-pad"
            placeholder={goalType === 'streak' ? 'Gün sayısı' : 'Miktar'}
          />

          <Input
            label="Başlangıç Tarihi (opsiyonel)"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2024-01-01"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Input
            label="Bitiş Tarihi (opsiyonel)"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2024-12-31"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Input
            label="Notunuz (opsiyonel)"
            value={note}
            onChangeText={setNote}
            placeholder="Neden bu hedefi öneriyorsunuz?"
            maxLength={500}
            multiline
            numberOfLines={3}
          />

          <View className="mt-4">
            <Button
              title="Öneriyi Gönder"
              onPress={handleSuggest}
              loading={loading}
              disabled={!title.trim() || !targetValue}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
