import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useGroupStore } from '@/modules/group/group.store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GroupStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GroupCreate'>;
};

export default function GroupCreateScreen({ navigation }: Props) {
  const { createGroup } = useGroupStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('20');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Grup adı en az 2 karakter olmalı.';
    const max = parseInt(maxMembers);
    if (isNaN(max) || max < 2 || max > 100) e.maxMembers = '2 ile 100 arasında bir sayı girin.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    try {
      setLoading(true);
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        max_members: parseInt(maxMembers),
      });
      navigation.replace('GroupInvite', {
        groupId: group.id,
        inviteCode: group.invite_code,
      });
    } catch (e: any) {
      alert.error('Hata', e.message ?? 'Grup oluşturulamadı.');
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
            Grup Oluştur
          </Text>
          <Text className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Arkadaşlarınla birlikte ibadet etmek için bir grup kur
          </Text>

          <Input
            label="Grup Adı *"
            value={name}
            onChangeText={setName}
            placeholder="örn. Aile İbadet Grubu"
            maxLength={100}
            error={errors.name}
          />

          <Input
            label="Açıklama (opsiyonel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Grubun hakkında kısa bir açıklama..."
            maxLength={500}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Maksimum Üye Sayısı"
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="number-pad"
            maxLength={3}
            error={errors.maxMembers}
          />

          <View className="mt-6">
            <Button
              title="Grubu Oluştur"
              onPress={handleCreate}
              loading={loading}
              disabled={!name.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
