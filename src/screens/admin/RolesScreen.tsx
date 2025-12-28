import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { adminApi } from '@/modules/admin/admin.api';
import type { AdminRole } from '@/modules/admin/admin.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { InlineLoading } from '@/components/feedback/Loading';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AdminStackParamList, 'Roles'>;

export default function RolesScreen(_props: Props) {
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
      const rolesArray = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.roles) 
          ? data.roles 
          : [];
      setRoles(rolesArray);
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Roller alınamadı');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadRoles(true);
  }, []);

  function validateRoleName(name: string): boolean {
    // Sadece küçük harf ve underscore kabul et
    const regex = /^[a-z_]+$/;
    return regex.test(name.toLowerCase().trim());
  }

  async function handleCreate() {
    if (!newRole) {
      Alert.alert('Hata', 'Rol adı gerekli');
      return;
    }
    if (!validateRoleName(newRole)) {
      Alert.alert('Hata', 'Rol adı sadece harf ve alt çizgi (_) içerebilir.\nÖrnek: test_role');
      return;
    }
    try {
      setLoading(true);
      await adminApi.createRole(newRole);
      setNewRole('');
      Alert.alert('Başarılı', 'Rol oluşturuldu');
      await loadRoles();
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Rol oluşturulamadı. Bu isimde rol zaten var olabilir.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingRole || !editName) return;
    if (!validateRoleName(editName)) {
      Alert.alert('Hata', 'Rol adı sadece harf ve alt çizgi (_) içerebilir.\nÖrnek: test_role');
      return;
    }
    try {
      setLoading(true);
      await adminApi.updateRole(editingRole.id, editName);
      setEditingRole(null);
      setEditName('');
      Alert.alert('Başarılı', 'Rol güncellendi');
      await loadRoles();
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Rol güncellenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Sil', 'Bu rolü silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { 
        text: 'Sil', 
        style: 'destructive', 
        onPress: async () => {
          try {
            setLoading(true);
            await adminApi.deleteRole(id);
            Alert.alert('Başarılı', 'Rol silindi');
            await loadRoles();
          } catch (err) {
            console.log(err);
            Alert.alert('Hata', 'Rol silinemedi');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  }

  return (
    <Screen className="bg-slate-50">
       <View className="mb-4 pt-4">
        <Text className="text-2xl font-bold text-slate-900">Rol Yönetimi</Text>
        <Text className="text-slate-500">Sistem rollerini tanımla ve düzenle</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={loading && !initialLoading} onRefresh={() => loadRoles()} />
        }>
        
        <Card className="mb-4">
          <Text className="text-lg font-bold text-slate-900 mb-3">
            {editingRole ? 'Rolü Düzenle' : 'Yeni Rol Oluştur'}
          </Text>
          
          <Input 
            placeholder={editingRole ? 'Rol adı' : 'Örn: editor'} 
            value={editingRole ? editName : newRole} 
            onChangeText={editingRole ? setEditName : setNewRole} 
          />
          
          <View className="flex-row gap-2 mt-2">
            {editingRole && (
              <View className="flex-1">
                 <Button 
                   title="İptal" 
                   onPress={() => {
                     setEditingRole(null);
                     setEditName('');
                   }} 
                   variant="secondary"
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

        <Text className="text-lg font-bold text-slate-900 mb-3 ml-1">Mevcut Roller</Text>
        {(roles || []).map((role) => (
          <Card key={role.id} className="mb-3 flex-row items-center justify-between p-4">
            <View>
              <Text className="text-base font-bold text-slate-900">{role.name}</Text>
              <Text className="text-xs text-slate-400">ID: {role.id}</Text>
            </View>
            
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => {
                  setEditingRole(role);
                  setEditName(role.name);
                }}
                className="rounded-full bg-slate-100 p-2">
                <Ionicons name="pencil" size={18} color="#475569" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleDelete(role.id)}
                className="rounded-full bg-red-50 p-2">
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
        
        {initialLoading ? (
          <InlineLoading message="Roller yükleniyor..." />
        ) : roles.length === 0 && (
          <Text className="text-center text-slate-400 mt-4">Henüz rol oluşturulmamış.</Text>
        )}

      </ScrollView>
    </Screen>
  );
}
