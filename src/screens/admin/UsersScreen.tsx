import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { adminApi } from '@/modules/admin/admin.api';
import type { AdminUser } from '@/modules/admin/admin.types';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AdminStackParamList, 'Users'>;

export default function UsersScreen({ navigation }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await adminApi.listUsers();
      console.log('Users API Response:', data);
      const usersArray = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.users) 
          ? data.users 
          : [];
      setUsers(usersArray);
    } catch (err) {
      console.log('Users API Error:', err);
      setError('Kullanıcı listesi alınamadı');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const renderItem = ({ item }: { item: AdminUser }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('UserDetail', { userId: item.id })}>
      <Card className="mb-3 flex-row items-center justify-between p-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
              {item.firstName && item.lastName
                ? `${item.firstName} ${item.lastName}`
                : 'İsimsiz Kullanıcı'}
            </Text>
            {!item.isActive && (
              <View className="rounded-md bg-red-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-red-600">PASİF</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-slate-500" numberOfLines={1}>
            {item.email}
          </Text>

          <View className="mt-2 flex-row flex-wrap gap-1">
            {(item.roles || []).map((role) => (
              <View
                key={role}
                className="rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5">
                <Text className="text-[10px] text-primary-700">{role}</Text>
              </View>
            ))}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen className="bg-slate-50">
      <View className="mb-2 pt-3">
        <Text className="text-sm text-slate-500">Toplam {users.length} kullanıcı</Text>
      </View>

      {error && (
        <View className="mb-4 rounded-xl bg-red-50 p-3">
          <Text className="text-red-600">{error}</Text>
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
        ListEmptyComponent={
          !loading ? (
            <View className="mt-10 items-center">
              <Text className="text-slate-400">Kullanıcı bulunamadı</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
