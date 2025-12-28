import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { adminApi } from '@/modules/admin/admin.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import type { AdminUser, AdminRole } from '@/modules/admin/admin.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageLoading } from '@/components/feedback/Loading';
import { ErrorView } from '@/components/feedback/ErrorView';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AdminStackParamList, 'UserDetail'>;

export default function UserDetailScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const currentUser = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  
  const [user, setUser] = useState<AdminUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AdminRole[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Düzenlenen kullanıcı mevcut giriş yapmış kullanıcı mı?
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
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı');
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
      Alert.alert(
        'Başarılı',
        `Kullanıcı ${user.isActive === false ? 'aktif edildi' : 'pasife alındı'}`
      );
    } catch {
      Alert.alert('Hata', 'Durum değiştirilemedi');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssignRole(roleIdToAssign: string) {
    if (!roleIdToAssign) return;
    
    // Atanacak rolün adını bul
    const roleToAssign = availableRoles.find((r) => r.id === roleIdToAssign);
    const roleNameToAssign = roleToAssign?.name;
    
    try {
      setActionLoading(true);
      await adminApi.assignRole(userId, roleIdToAssign);
      
      // Optimistic update - UI'ı hemen güncelle
      if (roleNameToAssign && user) {
        const updatedRoles = [...user.roles, roleNameToAssign];
        setUser({ ...user, roles: updatedRoles });
        console.log('After assign role (optimistic) - User Roles:', updatedRoles);
        
        // Eğer mevcut kullanıcının rolü değiştiyse auth store'u da optimistic güncelle
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
      
      Alert.alert('Başarılı', 'Rol atandı');
    } catch {
      // Hata durumunda veriyi sunucudan tekrar yükle
      await loadData();
      Alert.alert('Hata', 'Rol atanamadı');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveRole(roleIdToRemove: string) {
    // Kaldırılacak rolün adını bul
    const roleToRemove = availableRoles.find((r) => r.id === roleIdToRemove);
    const roleNameToRemove = roleToRemove?.name;
    
    try {
      setActionLoading(true);
      await adminApi.removeRole(userId, roleIdToRemove);
      
      // Optimistic update - UI'ı hemen güncelle
      if (roleNameToRemove && user) {
        const updatedRoles = user.roles.filter((r) => r !== roleNameToRemove);
        setUser({ ...user, roles: updatedRoles });
        console.log('After remove role (optimistic) - User Roles:', updatedRoles);
        
        // Eğer mevcut kullanıcının rolü değiştiyse auth store'u da optimistic güncelle
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
      
      Alert.alert('Başarılı', 'Rol kaldırıldı');
    } catch {
      // Hata durumunda veriyi sunucudan tekrar yükle
      await loadData();
      Alert.alert('Hata', 'Rol kaldırılamadı');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeAllSessions() {
    try {
      setActionLoading(true);
      await adminApi.revokeAllSessions(userId);
      setSessions([]);
      Alert.alert('Başarılı', 'Tüm oturumlar kapatıldı');
    } catch {
      Alert.alert('Hata', 'Oturumlar kapatılamadı');
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
            <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Text className="text-2xl">👤</Text>
            </View>
            <View
              className={`rounded-full px-3 py-1 ${user.isActive === false ? 'bg-red-100' : 'bg-green-100'}`}>
              <Text
                className={`text-xs font-bold ${user.isActive === false ? 'text-red-700' : 'text-green-700'}`}>
                {user.isActive === false ? 'PASİF' : 'AKTİF'}
              </Text>
            </View>
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
            {userRoles.length === 0 && (
              <Text className="text-sm text-slate-400">Hiç rol atanmamış</Text>
            )}
            {userRoles.map((roleName) => {
              const roleObj = (availableRoles || []).find((r) => r.name === roleName);
              const roleId = roleObj?.id;

              return (
                <View
                  key={roleName}
                  className="flex-row items-center rounded-full bg-primary-100 py-1 pl-3 pr-1">
                  <Text className="mr-1 text-xs font-semibold text-primary-700">{roleName}</Text>
                  {roleId && (
                    <TouchableOpacity
                      onPress={() => handleRemoveRole(roleId)}
                      disabled={actionLoading}
                      className="ml-1 rounded-full bg-white p-1">
                      <Ionicons name="close" size={10} color="#0f766e" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <View className="border-t border-slate-100 pt-3">
            <Text className="mb-2 text-sm font-medium text-slate-700">Rol Ekle</Text>
            <View className="flex-row flex-wrap gap-2">
              {(availableRoles || [])
                .filter((r) => !userRoles.includes(r.name))
                .map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => handleAssignRole(role.id)}
                    disabled={actionLoading}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <Text className="text-sm font-medium text-slate-700">+ {role.name}</Text>
                  </TouchableOpacity>
                ))}
              {availableRoles.length === 0 && (
                <Text className="text-xs text-slate-400">
                  Eklenebilecek rol bulunamadı (rolleri yükleyememiş olabiliriz)
                </Text>
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
            <Text className="text-sm text-slate-400">Aktif oturum yok</Text>
          ) : (
            sessions.map((s, index) => (
              <View
                key={s.id || index}
                className="mb-2 border-b border-slate-50 pb-2 last:border-0">
                <Text className="text-xs font-bold text-slate-700">IP: {s.ip}</Text>
                <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                  {s.userAgent}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
