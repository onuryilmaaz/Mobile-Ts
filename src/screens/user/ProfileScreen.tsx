import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { UserTabParamList, ProfileStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UploadOverlay } from '@/components/feedback/UploadOverlay';
import { userApi } from '@/modules/user/user.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import type { UserProfile } from '@/modules/user/user.types';
import { Ionicons } from '@expo/vector-icons';

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>,
  BottomTabScreenProps<UserTabParamList>
>;

interface SettingsItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof ProfileStackParamList;
  danger?: boolean;
}

const settingsItems: SettingsItem[] = [
  {
    id: 'password',
    title: 'Şifre Değiştir',
    subtitle: 'Hesap şifrenizi güncelleyin',
    icon: 'lock-closed-outline',
    screen: 'ChangePassword',
  },
  {
    id: 'email',
    title: 'E-posta Değiştir',
    subtitle: 'E-posta adresinizi güncelleyin',
    icon: 'mail-outline',
    screen: 'ChangeEmail',
  },
  {
    id: 'sessions',
    title: 'Oturumlar',
    subtitle: 'Aktif oturumlarınızı yönetin',
    icon: 'phone-portrait-outline',
    screen: 'Sessions',
  },
  {
    id: 'account',
    title: 'Hesap',
    subtitle: 'Çıkış yap ve hesap ayarları',
    icon: 'person-circle-outline',
    screen: 'Account',
    danger: false,
  },
];

export default function ProfileScreen({ navigation }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const user = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<UserProfile | null>(user as UserProfile | null);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [updateLoading, setUpdateLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await userApi.profile();
      
      const profileData = (data as any).user ? (data as any).user : data;

      setProfile(profileData);
      setFirstName(profileData.firstName ?? '');
      setLastName(profileData.lastName ?? '');
      setPhone(profileData.phone ?? '');
      
      if (profileData.roles) {
        setUser(profileData);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Profil bilgileri alınamadı');
    } finally {
      setRefreshing(false);
    }
  }, [setUser]);

  async function handleUpdateProfile() {
    try {
      setUpdateLoading(true);
      const { data } = await userApi.updateProfile({ firstName, lastName, phone });
      
      const profileData = (data as any).user ? (data as any).user : data;

      setProfile(profileData);
      
      // Auth store'u güncelle
      await refreshUser();
      
      setIsEditing(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi');
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Profil güncellenemedi');
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        setLocalAvatarUri(selectedImage.uri);
        await uploadAvatar(selectedImage.uri);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Resim seçilemedi');
    }
  }

  async function uploadAvatar(uri: string) {
    try {
      setAvatarLoading(true);

      const formData = new FormData();
      formData.append('avatar', {
        uri: uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);

      await userApi.uploadAvatar(formData);
      Alert.alert('Başarılı', 'Avatar yüklendi');
      
      await loadProfile();
      // Auth store'u güncelle
      await refreshUser();
      setLocalAvatarUri(null);
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Avatar yüklenemedi');
    } finally {
      setAvatarLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const roles = profile?.roles ?? user?.roles ?? [];
  const avatarUrl = localAvatarUri || profile?.avatarUrl || user?.avatarUrl;

  return (
    <Screen className="bg-slate-50">
      <UploadOverlay visible={avatarLoading} message="Fotoğraf yükleniyor" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} />
        }>
        
        {/* Header Section */}
        <View className="mb-6 items-center pt-4">
          <View className="relative">
            <View className="h-28 w-28 items-center justify-center rounded-full bg-primary-100 border-4 border-white shadow-sm overflow-hidden">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Text className="text-4xl">👤</Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={handlePickImage}
              disabled={avatarLoading}
              activeOpacity={0.8}
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full bg-primary-600 border-2 border-white shadow-sm">
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text className="mt-4 text-2xl font-bold text-slate-900">
            {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
          </Text>
          <Text className="text-slate-500">{profile?.email ?? user?.email}</Text>
          
          <View className="mt-2 flex-row gap-2">
            {roles.map((role) => (
              <View key={role} className="rounded-full bg-primary-100 px-3 py-1">
                <Text className="text-xs font-semibold text-primary-700 capitalize">{role}</Text>
              </View>
            ))}
          </View>
        </View>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900">Kişisel Bilgiler</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={20} color="#0f766e" />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditing ? (
            <>
              <Input 
                label="Ad" 
                value={firstName} 
                onChangeText={setFirstName} 
                placeholder="Adınız"
              />
              <Input 
                label="Soyad" 
                value={lastName} 
                onChangeText={setLastName} 
                placeholder="Soyadınız"
              />
              <Input 
                label="Telefon" 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad"
                placeholder="+90 555 123 45 67"
              />

              <View className="mt-2 flex-row gap-3">
                <View className="flex-1">
                  <Button 
                    title="Vazgeç" 
                    onPress={() => {
                      setIsEditing(false);
                      setFirstName(profile?.firstName ?? '');
                      setLastName(profile?.lastName ?? '');
                      setPhone(profile?.phone ?? '');
                    }} 
                    variant="outline"
                  />
                </View>
                <View className="flex-1">
                  <Button 
                    title="Kaydet" 
                    onPress={handleUpdateProfile} 
                    loading={updateLoading}
                  />
                </View>
              </View>
            </>
          ) : (
            <View className="gap-3">
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Ionicons name="person-outline" size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500">Ad Soyad</Text>
                  <Text className="font-medium text-slate-900">
                    {profile?.firstName || '—'} {profile?.lastName || ''}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Ionicons name="call-outline" size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500">Telefon</Text>
                  <Text className="font-medium text-slate-900">
                    {profile?.phone || '—'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Ionicons name="mail-outline" size={20} color="#64748b" />
                <View>
                  <Text className="text-xs text-slate-500">E-posta</Text>
                  <Text className="font-medium text-slate-900">
                    {profile?.email || user?.email || '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        <Card>
          <Text className="mb-4 text-lg font-bold text-slate-900">Ayarlar</Text>
          
          <View className="gap-2">
            {settingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className={`flex-row items-center justify-between rounded-xl p-4 ${
                  item.danger ? 'bg-red-50' : 'bg-slate-50'
                }`}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className={`h-10 w-10 items-center justify-center rounded-full ${
                    item.danger ? 'bg-red-100' : 'bg-white'
                  }`}>
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={item.danger ? '#dc2626' : '#64748b'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${item.danger ? 'text-red-700' : 'text-slate-900'}`}>
                      {item.title}
                    </Text>
                    <Text className={`text-xs ${item.danger ? 'text-red-500' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={item.danger ? '#fca5a5' : '#94a3b8'} />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

      </ScrollView>
    </Screen>
  );
}
