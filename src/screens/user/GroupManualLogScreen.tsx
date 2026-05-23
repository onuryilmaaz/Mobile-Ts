import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { groupApi } from '@/modules/group/group.api';
import { useGroupStore } from '@/modules/group/group.store';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { GroupStackParamList } from '@/navigation/types';
import type { GroupActivityType } from '@/modules/group/group.types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GroupManualLog'>;
  route: RouteProp<GroupStackParamList, 'GroupManualLog'>;
};

export default function GroupManualLogScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { isDark } = useTheme();
  const { currentGroup, fetchFeed } = useGroupStore();

  const [selectedType, setSelectedType] = useState<GroupActivityType | null>(null);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Sadece base_type = null olan custom tipler manuel giriş için geçerli
  const customTypes: GroupActivityType[] = (currentGroup?.activity_types ?? []).filter(
    (t) => t.base_type === null,
  );

  async function handleLog() {
    if (!selectedType) return alert.error('Hata', 'Bir aktivite tipi seçin.');
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      return alert.error('Hata', 'Geçerli bir değer girin.');
    }

    try {
      setLoading(true);
      await groupApi.logManualActivity(groupId, {
        activity_type_id: selectedType.id,
        value: num,
      });
      await fetchFeed(groupId);
      alert.show({
        type: 'success',
        title: 'Başarılı',
        message: 'Aktivite gruba kaydedildi.',
        buttons: [{ text: 'Tamam', onPress: () => navigation.goBack(), style: 'default' }],
      });
    } catch (e: any) {
      alert.error('Hata', e?.response?.data?.message ?? 'Kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  }

  if (customTypes.length === 0) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Ionicons name="pencil-outline" size={32} color={isDark ? '#4b5563' : '#94a3b8'} />
          </View>
          <Text className="mb-2 text-center text-lg font-bold text-slate-900 dark:text-white">
            Özel Aktivite Tipi Yok
          </Text>
          <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
            Manuel giriş yalnızca standart tracker'a bağlı olmayan özel aktivite tipleri için
            çalışır. Grup yöneticisi özel bir tip eklemedikçe buraya giriş yapılamaz.
          </Text>
        </View>
      </Screen>
    );
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
            Manuel Giriş
          </Text>
          <Text className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Standart tracker'a bağlı olmayan aktivitelerini buradan ekle
          </Text>

          <Text className="mb-3 ml-1 text-sm font-medium text-slate-700 dark:text-slate-100">
            Aktivite Tipi *
          </Text>
          <View className="mb-6 gap-2">
            {customTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type)}
                className={[
                  'flex-row items-center rounded-2xl border p-4',
                  selectedType?.id === type.id
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60',
                ].join(' ')}>
                <View
                  className={[
                    'mr-3 h-5 w-5 items-center justify-center rounded-full border-2',
                    selectedType?.id === type.id
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-slate-300 dark:border-slate-600',
                  ].join(' ')}>
                  {selectedType?.id === type.id && (
                    <View className="h-2 w-2 rounded-full bg-white" />
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className={
                      selectedType?.id === type.id
                        ? 'text-sm font-bold text-teal-700 dark:text-teal-400'
                        : 'text-sm font-bold text-slate-900 dark:text-white'
                    }>
                    {type.name}
                  </Text>
                  <Text className="text-xs text-slate-400">Birim: {type.unit}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="mb-2 ml-1 text-sm font-medium text-slate-700 dark:text-slate-100">
            Değer {selectedType ? `(${selectedType.unit})` : ''} *
          </Text>
          <View className="mb-6 h-12 rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900/60">
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={isDark ? '#4b5563' : '#94a3b8'}
              className="h-full flex-1 text-lg text-slate-900 dark:text-white"
            />
          </View>

          <Button
            title="Gruba Kaydet"
            onPress={handleLog}
            loading={loading}
            disabled={!selectedType || !value}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
