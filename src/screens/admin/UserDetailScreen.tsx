import { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { adminApi } from '@/modules/admin/admin.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useAlertStore } from '@/store/alert.store';
import type { AdminUser, AdminRole } from '@/modules/admin/admin.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';
import { PageLoading } from '@/components/feedback/Loading';
import { ErrorView } from '@/components/feedback/ErrorView';
import { EmptyState } from '@/components/layout/EmptyState';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AdminStackParamList, 'UserDetail'>;

export default function UserDetailScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const currentUser = useAuthStore((s) => s.user);
  //const refreshUser = useAuthStore((s) => s.refreshUser);
  const alert = useAlertStore();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AdminRole[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isCurrentUser = currentUser?.id === userId;

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [{ data: userData }, { data: rolesData }] = await Promise.all([
        adminApi.getUser(userId),
        adminApi.listRoles(),
      ]);

      const userObj = 'user' in userData ? userData.user : userData;
      console.log('UserDetail - User Data:', JSON.stringify(userObj, null, 2));
      console.log('UserDetail - User Roles:', userObj.roles);
      setUser(userObj);

      const rolesArray = Array.isArray(rolesData)
        ? rolesData
        : Array.isArray(rolesData?.roles)
          ? rolesData.roles
          : [];
      setAvailableRoles(rolesArray);

      loadSessions();
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Kullanıcı bilgileri alınamadı');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadSessions() {
    try {
      const { data } = await adminApi.listUserSessions(userId);
      const list = Array.isArray(data) ? data : ((data as any)?.sessions ?? []);
      setSessions(list);
    } catch (err) {
      console.log('Session load error', err);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function toggleUserStatus() {
    if (!user) return;
    try {
      setActionLoading(true);
      if (user.isActive === false) {
        await adminApi.activateUser(user.id);
      } else {
        await adminApi.deactivateUser(user.id);
      }
      await loadData();
      alert.success(
        'Başarılı',
        `Kullanıcı ${user.isActive === false ? 'aktif edildi' : 'pasife alındı'}`
      );
    } catch {
      alert.error('Hata', 'Durum değiştirilemedi');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignRole(roleIdToAssign: string) {
    if (!roleIdToAssign) return;

    const roleToAssign = availableRoles.find((r) => r.id === roleIdToAssign);
    const roleNameToAssign = roleToAssign?.name;

    try {
      setActionLoading(true);
      await adminApi.assignRole(userId, roleIdToAssign);

      if (roleNameToAssign && user) {
        const updatedRoles = [...user.roles, roleNameToAssign];
        setUser({ ...user, roles: updatedRoles });
        console.log('After assign role (optimistic) - User Roles:', updatedRoles);

        if (isCurrentUser) {
          const currentUserData = useAuthStore.getState().user;
          if (currentUserData) {
            useAuthStore.getState().setUser({
              ...currentUserData,
              roles: updatedRoles,
            });
            console.log('Auth store updated (optimistic) - User Roles:', updatedRoles);
          }
        }
      }

      alert.success('Başarılı', 'Rol atandı');
    } catch {
      await loadData();
      alert.error('Hata', 'Rol atanamadı');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveRole(roleIdToRemove: string) {
    const roleToRemove = availableRoles.find((r) => r.id === roleIdToRemove);
    const roleNameToRemove = roleToRemove?.name;

    try {
      setActionLoading(true);
      await adminApi.removeRole(userId, roleIdToRemove);

      if (roleNameToRemove && user) {
        const updatedRoles = user.roles.filter((r) => r !== roleNameToRemove);
        setUser({ ...user, roles: updatedRoles });
        console.log('After remove role (optimistic) - User Roles:', updatedRoles);

        if (isCurrentUser) {
          const currentUserData = useAuthStore.getState().user;
          if (currentUserData) {
            useAuthStore.getState().setUser({
              ...currentUserData,
              roles: updatedRoles,
            });
            console.log('Auth store updated (optimistic) - User Roles:', updatedRoles);
          }
        }
      }

      alert.success('Başarılı', 'Rol kaldırıldı');
    } catch {
      await loadData();
      alert.error('Hata', 'Rol kaldırılamadı');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeAllSessions() {
    try {
      setActionLoading(true);
      await adminApi.revokeAllSessions(userId);
      setSessions([]);
      alert.success('Başarılı', 'Tüm oturumlar kapatıldı');
    } catch {
      alert.error('Hata', 'Oturumlar kapatılamadı');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !user) {
    return (
      <Screen>
        <PageLoading message="Kullanıcı bilgileri yükleniyor..." />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <ErrorView
          title="Kullanıcı Bulunamadı"
          message="Bu kullanıcıya ait bilgi bulunamadı."
          icon="person-outline"
          onRetry={() => navigation.goBack()}
          retryText="Geri Dön"
        />
      </Screen>
    );
  }

  const userRoles = user.roles || [];

  return (
    <Screen className="bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }>
        <Card className="mb-4">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Ionicons name="person" size={32} color="#0f766e" />
            </View>
            <Badge variant={user.isActive === false ? 'danger' : 'success'} size="md">
              {user.isActive === false ? 'PASİF' : 'AKTİF'}
            </Badge>
          </View>

          <Text className="text-xl font-bold text-slate-900">
            {user.firstName} {user.lastName}
          </Text>
          <Text className="mb-4 text-slate-500">{user.email}</Text>

          <Button
            title={user.isActive === false ? 'Hesabı Aktifleştir' : 'Hesabı Pasife Al'}
            onPress={toggleUserStatus}
            loading={actionLoading}
            variant={user.isActive === false ? 'primary' : 'danger'}
          />
        </Card>

        <Card className="mb-4">
          <Text className="mb-3 text-lg font-bold text-slate-900">Roller</Text>

          <View className="mb-4 flex-row flex-wrap gap-2">
            {userRoles.length === 0 ? (
              <Text className="text-sm text-slate-400">Hiç rol atanmamış</Text>
            ) : (
              userRoles.map((roleName) => {
                const roleObj = (availableRoles || []).find((r) => r.name === roleName);
                const roleId = roleObj?.id;

                return (
                  <View key={roleName} className="flex-row items-center">
                    <Badge variant="primary" size="md" className="mr-1">
                      {roleName}
                    </Badge>
                    {roleId && (
                      <TouchableOpacity
                        onPress={() => handleRemoveRole(roleId)}
                        disabled={actionLoading}
                        className="rounded-full bg-red-50 p-1">
                        <Ionicons name="close" size={12} color="#dc2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <Divider />
          <View className="pt-3">
            <Text className="mb-2 text-sm font-medium text-slate-700">Rol Ekle</Text>
            <View className="flex-row flex-wrap gap-2">
              {(availableRoles || [])
                .filter((r) => !userRoles.includes(r.name))
                .map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => handleAssignRole(role.id)}
                    disabled={actionLoading}
                    className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="add" size={16} color="#0f766e" />
                      <Text className="text-sm font-medium text-primary-700">{role.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              {availableRoles.length === 0 && (
                <Text className="text-xs text-slate-400">Eklenebilecek rol bulunamadı</Text>
              )}
            </View>
          </View>
        </Card>

        <Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900">Aktif Oturumlar</Text>
            {sessions.length > 0 && (
              <TouchableOpacity onPress={handleRevokeAllSessions} disabled={actionLoading}>
                <Text className="text-xs font-bold text-red-600">Hepsini Kapat</Text>
              </TouchableOpacity>
            )}
          </View>

          {sessions.length === 0 ? (
            <EmptyState
              icon="phone-portrait-outline"
              title="Aktif oturum yok"
              message="Bu kullanıcının aktif oturumu bulunmuyor"
            />
          ) : (
            <View className="gap-2">
              {sessions.map((s, index) => (
                <View
                  key={s.id || index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <View className="mb-1 flex-row items-center gap-2">
                    <Ionicons name="phone-portrait-outline" size={16} color="#64748b" />
                    <Text className="text-xs font-semibold text-slate-700">
                      IP: {s.ip || 'Bilinmiyor'}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                    {s.userAgent || 'Bilinmeyen cihaz'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
