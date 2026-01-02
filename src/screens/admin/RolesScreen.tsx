import { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, RefreshControl } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/layout/EmptyState';
import { adminApi } from '@/modules/admin/admin.api';
import { useAlertStore } from '@/store/alert.store';
import type { AdminRole } from '@/modules/admin/admin.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { InlineLoading } from '@/components/feedback/Loading';
import { Ionicons } from '@expo/vector-icons';

export default function RolesScreen() {
  const alert = useAlertStore();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [newRole, setNewRole] = useState('');

  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [editName, setEditName] = useState('');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  async function loadRoles(isInitial = false) {
    try {
      if (isInitial) setInitialLoading(true);
      setLoading(true);
      const { data } = await adminApi.listRoles();
      console.log('Roles API Response:', data);
      const rolesArray = Array.isArray(data) ? data : Array.isArray(data?.roles) ? data.roles : [];
      setRoles(rolesArray);
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Roller alınamadı');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadRoles(true);
  }, []);

  function validateRoleName(name: string): boolean {
    const regex = /^[a-z_]+$/;
    return regex.test(name.toLowerCase().trim());
  }

  async function handleCreate() {
    if (!newRole) {
      alert.error('Hata', 'Rol adı gerekli');
      return;
    }
    if (!validateRoleName(newRole)) {
      alert.error('Hata', 'Rol adı sadece harf ve alt çizgi (_) içerebilir.\nÖrnek: test_role');
      return;
    }
    try {
      setLoading(true);
      await adminApi.createRole(newRole);
      setNewRole('');
      alert.success('Başarılı', 'Rol oluşturuldu');
      await loadRoles();
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Rol oluşturulamadı. Bu isimde rol zaten var olabilir.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingRole || !editName) return;
    if (!validateRoleName(editName)) {
      alert.error('Hata', 'Rol adı sadece harf ve alt çizgi (_) içerebilir.\nÖrnek: test_role');
      return;
    }
    try {
      setLoading(true);
      await adminApi.updateRole(editingRole.id, editName);
      setEditingRole(null);
      setEditName('');
      alert.success('Başarılı', 'Rol güncellendi');
      await loadRoles();
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Rol güncellenemedi');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    alert.confirm(
      'Rolü Sil',
      'Bu rolü silmek istediğinize emin misiniz?',
      async () => {
        try {
          setLoading(true);
          await adminApi.deleteRole(id);
          alert.success('Başarılı', 'Rol silindi');
          await loadRoles();
        } catch (err) {
          console.log(err);
          alert.error('Hata', 'Rol silinemedi');
        } finally {
          setLoading(false);
        }
      },
      'Sil',
      'Vazgeç',
      true
    );
  }

  return (
    <Screen className="bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={loading && !initialLoading} onRefresh={() => loadRoles()} />
        }>
        <Card className="mb-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Ionicons
              name={editingRole ? 'create-outline' : 'add-circle-outline'}
              size={20}
              color="#0f766e"
            />
            <Text className="text-lg font-bold text-slate-900">
              {editingRole ? 'Rolü Düzenle' : 'Yeni Rol Oluştur'}
            </Text>
          </View>

          <Input
            placeholder={editingRole ? 'Rol adı' : 'Örn: editor'}
            value={editingRole ? editName : newRole}
            onChangeText={editingRole ? setEditName : setNewRole}
          />

          <View className="mt-3 flex-row gap-2">
            {editingRole && (
              <View className="flex-1">
                <Button
                  title="İptal"
                  onPress={() => {
                    setEditingRole(null);
                    setEditName('');
                  }}
                  variant="outline"
                />
              </View>
            )}
            <View className="flex-1">
              <Button
                title={editingRole ? 'Güncelle' : 'Oluştur'}
                onPress={editingRole ? handleUpdate : handleCreate}
                loading={loading}
              />
            </View>
          </View>
        </Card>

        <Text className="mb-3 ml-1 text-lg font-bold text-slate-900">Mevcut Roller</Text>

        {initialLoading ? (
          <InlineLoading message="Roller yükleniyor..." />
        ) : roles.length === 0 ? (
          <EmptyState
            icon="key-outline"
            title="Henüz rol oluşturulmamış"
            message="Yukarıdaki formdan yeni bir rol oluşturabilirsiniz"
          />
        ) : (
          (roles || []).map((role) => (
            <Card key={role.id} className="mb-3 flex-row items-center justify-between p-4">
              <View className="flex-1">
                <View className="mb-1 flex-row items-center gap-2">
                  <Badge variant="primary" size="md">
                    {role.name}
                  </Badge>
                </View>
                <Text className="text-xs text-slate-400">ID: {role.id}</Text>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setEditingRole(role);
                    setEditName(role.name);
                  }}
                  className="rounded-full bg-slate-100 p-2"
                  activeOpacity={0.7}>
                  <Ionicons name="pencil" size={18} color="#475569" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(role.id)}
                  className="rounded-full bg-red-50 p-2"
                  activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
