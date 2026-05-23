/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '@/modules/group/group.store';
import { useTheme } from '@/hooks/useTheme';
import type { Group } from '@/modules/group/group.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GroupStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GroupList'>;
};

export default function GroupListScreen({ navigation }: Props) {
  const { isDark } = useTheme();
  const { myGroups, isLoading, fetchMyGroups, joinByCode } = useGroupStore();

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length < 6) {
      alert.error('Hata', 'Geçerli bir davet kodu girin.');
      return;
    }
    try {
      setJoining(true);
      const group = await joinByCode(code);
      setJoinModalVisible(false);
      setInviteCode('');
      navigation.navigate('GroupDetail', { groupId: group.id });
    } catch (e: any) {
      alert.error('Katılım Başarısız', e.message);
    } finally {
      setJoining(false);
    }
  };

  const roleLabel: Record<string, string> = {
    owner: 'Yönetici',
    moderator: 'Moderatör',
    member: 'Üye',
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyGroups} />}>
        {/* Başlık + butonlar */}
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-black text-slate-900 dark:text-white">
            İbadet Grupları
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setJoinModalVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10">
              <Ionicons name="enter-outline" size={20} color={isDark ? '#2dd4bf' : '#0f766e'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupCreate')}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 dark:bg-teal-500">
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Boş durum */}
        {!isLoading && myGroups.length === 0 && (
          <View className="items-center py-16">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-teal-500/10">
              <Ionicons name="people-outline" size={40} color={isDark ? '#2dd4bf' : '#0f766e'} />
            </View>
            <Text className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              Henüz bir grubun yok
            </Text>
            <Text className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Bir grup oluştur veya davet koduyla bir gruba katıl
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupCreate')}
              className="rounded-2xl bg-teal-600 px-6 py-3 dark:bg-teal-500">
              <Text className="font-bold text-white">Grup Oluştur</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Gruplar */}
        {myGroups.map((group: Group) => (
          <TouchableOpacity
            key={group.id}
            onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
            className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-950">
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20">
                {group.avatar_url ? (
                  <Image source={{ uri: group.avatar_url }} className="h-12 w-12 rounded-full" />
                ) : (
                  <Ionicons name="people" size={24} color={isDark ? '#2dd4bf' : '#0f766e'} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {group.name}
                </Text>
                <View className="mt-1 flex-row items-center gap-3">
                  <View className="rounded-full bg-teal-100 px-2 py-0.5 dark:bg-teal-500/20">
                    <Text className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                      {roleLabel[group.role] ?? group.role}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-400 dark:text-slate-500">
                    {group.member_count} üye
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#4b5563' : '#cbd5e1'} />
            </View>
            {group.description && (
              <Text className="mt-2 text-sm text-slate-500 dark:text-slate-400" numberOfLines={2}>
                {group.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Davet kodu ile katıl modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setJoinModalVisible(false)}>
          <View className="flex-1 items-center justify-center px-8">
            <TouchableOpacity
              activeOpacity={1}
              className="w-full rounded-3xl bg-white p-6 dark:bg-teal-900">
              <Text className="mb-1 text-lg font-black text-slate-900 dark:text-white">
                Gruba Katıl
              </Text>
              <Text className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Sana iletilen davet kodunu gir
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                placeholder="Davet Kodu (örn. AB3K7P2Q)"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
                className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xl font-black tracking-widest text-teal-700 dark:border-slate-400 dark:bg-slate-900 dark:text-teal-400"
                placeholderTextColor={isDark ? '#4b5563' : '#94a3b8'}
              />
              <TouchableOpacity
                onPress={handleJoin}
                disabled={joining}
                className="rounded-2xl bg-teal-600 py-3 dark:bg-teal-500">
                <Text className="text-center font-bold text-white">
                  {joining ? 'Katılınıyor...' : 'Katıl'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
