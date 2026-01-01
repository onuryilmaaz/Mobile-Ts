import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/layout/EmptyState';
import { adminApi } from '@/modules/admin/admin.api';
import type { AdminUser } from '@/modules/admin/admin.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
              {item.firstName && item.lastName
                ? `${item.firstName} ${item.lastName}`
                : 'İsimsiz Kullanıcı'}
            </Text>
            {!item.isActive && <Badge variant="danger" size="sm">PASİF</Badge>}
          </View>
          <Text className="mb-2 text-sm text-slate-500" numberOfLines={1}>
            {item.email}
          </Text>

          <View className="flex-row flex-wrap gap-1">
            {(item.roles || []).map((role) => (
              <Badge key={role} variant="primary" size="sm">
                {role}
              </Badge>
            ))}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen className="bg-slate-50">
      <View className="mb-3 flex-row items-center justify-between pt-3">
        <Text className="text-sm font-medium text-slate-700">
          Toplam <Text className="font-bold text-slate-900">{users.length}</Text> kullanıcı
        </Text>
      </View>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text className="flex-1 text-sm text-red-700">{error}</Text>
          </View>
        </Card>
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
            <EmptyState
              icon="people-outline"
              title="Kullanıcı bulunamadı"
              message="Henüz sistemde kayıtlı kullanıcı yok"
            />
          ) : null
        }
      />
    </Screen>
  );
}
