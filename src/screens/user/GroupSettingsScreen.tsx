/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { groupApi } from '@/modules/group/group.api';
import { useGroupStore } from '@/modules/group/group.store';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { GroupStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GroupSettings'>;
  route: RouteProp<GroupStackParamList, 'GroupSettings'>;
};

export default function GroupSettingsScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { isDark } = useTheme();
  const { currentGroup, fetchGroup, fetchMyGroups, clearCurrent } = useGroupStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!currentGroup) {
      fetchGroup(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (currentGroup) {
      setName(currentGroup.name);
      setDescription(currentGroup.description ?? '');
      setMaxMembers(String(currentGroup.max_members ?? 20));
    }
  }, [currentGroup]);

  async function handleSave() {
    if (!name.trim()) return alert.error('Hata', 'Grup adı boş olamaz.');
    const max = parseInt(maxMembers, 10);
    if (isNaN(max) || max < 2 || max > 100) {
      return alert.error('Hata', 'Maksimum üye sayısı 2–100 arasında olmalı.');
    }

    try {
      setSaving(true);
      await groupApi.update(groupId, {
        name: name.trim(),
        description: description.trim() || undefined,
        max_members: max,
      });
      await fetchGroup(groupId);
      alert.success('Kaydedildi', 'Grup bilgileri güncellendi.');
    } catch (e: any) {
      alert.error('Hata', e?.response?.data?.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return alert.warning('İzin Gerekli', 'Fotoğraf kütüphanesine erişim izni verin.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      setAvatarUploading(true);
      const asset = result.assets[0]!;
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'group_avatar.jpg',
      } as any);
      await groupApi.uploadAvatar(groupId, formData);
      await fetchGroup(groupId);
    } catch {
      alert.error('Hata', 'Fotoğraf yüklenemedi.');
    } finally {
      setAvatarUploading(false);
    }
  }

  function confirmDelete() {
    alert.confirm(
      'Grubu Sil',
      `"${currentGroup?.name ?? 'bu grubu'}" kalıcı olarak silmek istediğinizden emin misiniz? Tüm üyeler, aktiviteler ve hedefler silinir.`,
      async () => {
        try {
          setDeleting(true);
          await groupApi.remove(groupId);
          clearCurrent();
          await fetchMyGroups();
          navigation.reset({ index: 0, routes: [{ name: 'GroupList' }] });
        } catch (e: any) {
          alert.error('Hata', e?.response?.data?.message ?? 'Grup silinemedi.');
        } finally {
          setDeleting(false);
        }
      },
      'Sil',
      'İptal',
      true
    );
  }

  if (!currentGroup) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#2dd4bf' : '#0f766e'} />
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
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled">
          <View className="mb-8 items-center">
            <TouchableOpacity
              onPress={handleAvatarUpload}
              disabled={avatarUploading}
              className="relative h-24 w-24 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20">
              {avatarUploading ? (
                <ActivityIndicator size="large" color={isDark ? '#2dd4bf' : '#0f766e'} />
              ) : currentGroup.avatar_url ? (
                <Image
                  source={{ uri: currentGroup.avatar_url }}
                  className="h-24 w-24 rounded-full"
                />
              ) : (
                <Ionicons name="people" size={40} color={isDark ? '#2dd4bf' : '#0f766e'} />
              )}
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-teal-600 shadow">
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Fotoğrafa dokun ve değiştir
            </Text>
          </View>

          <Text className="mb-6 text-xl font-black text-slate-900 dark:text-white">
            Grup Bilgileri
          </Text>

          <Input
            label="Grup Adı *"
            value={name}
            onChangeText={setName}
            placeholder="Grup adı"
            maxLength={100}
          />

          <Input
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            placeholder="Grup hakkında kısa bir açıklama"
            maxLength={500}
            numberOfLines={3}
          />

          <Input
            label="Maksimum Üye Sayısı"
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="number-pad"
            placeholder="20"
            maxLength={3}
          />

          <View className="mt-2">
            <Button title="Kaydet" onPress={handleSave} loading={saving} disabled={!name.trim()} />
          </View>

          <View className="my-8 h-px bg-slate-100 dark:bg-slate-800" />

          <Text className="mb-2 text-base font-bold text-red-600 dark:text-red-500">
            Tehlikeli Bölge
          </Text>
          <Text className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Grubu sildiğinizde tüm üyeler, aktiviteler ve hedefler kalıcı olarak silinir. Bu işlem
            geri alınamaz.
          </Text>

          <TouchableOpacity
            onPress={confirmDelete}
            disabled={deleting}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 dark:border-red-500/30 dark:bg-red-500/10">
            {deleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text className="text-sm font-bold text-red-600 dark:text-red-500">
                  Grubu Kalıcı Olarak Sil
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
