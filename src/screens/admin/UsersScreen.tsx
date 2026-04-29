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
import { useAppTheme } from '@/constants/theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'Users'>;

export default function UsersScreen({ navigation }: Props) {
  const { colors, isDark } = useAppTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await adminApi.listUsers();
      console.log('Users API Response:', data);
      const usersArray = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];
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
      <Card className="mx-4 mt-4 mb-2 flex-row items-center justify-between p-4">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <Text className="text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>
              {item.firstName && item.lastName
                ? `${item.firstName} ${item.lastName}`
                : 'İsimsiz Kullanıcı'}
            </Text>
            {!item.isActive && (
              <Badge variant="danger" size="sm">
                PASİF
              </Badge>
            )}
          </View>
          <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400" numberOfLines={1}>
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

        <Ionicons name="chevron-forward" size={20} color={isDark ? "rgba(255,255,255,0.3)" : "#94a3b8"} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      {error && (
        <Card className="mx-4 my-4 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text className="flex-1 text-sm text-red-700 dark:text-red-400">{error}</Text>
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
