import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { UserTabParamList, ProfileStackParamList } from '@/navigation/types';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UploadOverlay } from '@/components/feedback/UploadOverlay';
import { userApi } from '@/modules/user/user.api';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useAlertStore } from '@/store/alert.store';
import type { UserProfile } from '@/modules/user/user.types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TURKEY_CITIES } from '@/constants/cities';
import { BlurView } from 'expo-blur';

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
  const alertStore = useAlertStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [profile, setProfile] = useState<UserProfile | null>(user as UserProfile | null);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [updateLoading, setUpdateLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // City Selection Logic
  const [selectedCity, setSelectedCity] = useState('İstanbul');
  const [cityModalVisible, setCityModalVisible] = useState(false);

  useEffect(() => {
    loadCity();
  }, []);

  const loadCity = async () => {
    try {
      const savedCity = await AsyncStorage.getItem('SELECTED_CITY');
      if (savedCity) {
        setSelectedCity(savedCity);
      }
    } catch (e) {
      console.error('Failed to load city', e);
    }
  };

  const handleCitySelect = async (city: string) => {
    try {
      setSelectedCity(city);
      await AsyncStorage.setItem('SELECTED_CITY', city);
      setCityModalVisible(false);
      alertStore.success('Başarılı', `Konum ${city} olarak güncellendi`);
    } catch (e) {
      console.error('Failed to save city', e);
    }
  };

  const renderCityItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className={`flex-row items-center justify-between border-b border-slate-100 p-4 ${item === selectedCity ? 'bg-teal-50' : ''}`}
      onPress={() => handleCitySelect(item)}>
      <Text
        className={`text-base ${item === selectedCity ? 'font-bold text-teal-700' : 'text-slate-700'}`}>
        {item}
      </Text>
      {item === selectedCity && <Ionicons name="checkmark-circle" size={20} color="#0f766e" />}
    </TouchableOpacity>
  );

  const loadProfile = useCallback(
    async (isRefresh = false) => {
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
        alertStore.error('Hata', 'Profil bilgileri alınamadı');
      } finally {
        setRefreshing(false);
      }
    },
    [setUser, alertStore]
  );

  async function handleUpdateProfile() {
    try {
      setUpdateLoading(true);
      const { data } = await userApi.updateProfile({ firstName, lastName, phone });

      const profileData = (data as any).user ? (data as any).user : data;

      setProfile(profileData);

      await refreshUser();

      setIsEditing(false);
      alertStore.success('Başarılı', 'Profil bilgileriniz güncellendi');
    } catch (err) {
      console.log(err);
      alertStore.error('Hata', 'Profil güncellenemedi');
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alertStore.warning('İzin Gerekli', 'Galeriye erişim izni vermeniz gerekiyor.');
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
      alertStore.error('Hata', 'Resim seçilemedi');
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
      alertStore.success('Başarılı', 'Avatar yüklendi');

      await loadProfile();
      await refreshUser();
      setLocalAvatarUri(null);
    } catch (err) {
      console.log(err);
      alertStore.error('Hata', 'Avatar yüklenemedi');
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
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} />
        }>
        <View className="mb-6 items-center">
          <View className="relative">
            <View className="mt-8 h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary-100 shadow-sm">
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
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary-600 shadow-sm">
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="mt-4 text-2xl font-bold text-slate-900">
            {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
          </Text>
          <Text className="text-slate-500">{profile?.email ?? user?.email}</Text>

          {/* City Selection Badge */}
          <TouchableOpacity
            onPress={() => setCityModalVisible(true)}
            className="mt-3 flex-row items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5">
            <Ionicons name="location" size={14} color="#0f766e" />
            <Text className="text-sm font-semibold text-teal-700">{selectedCity}</Text>
            <Ionicons name="create-outline" size={14} color="#0f766e" />
          </TouchableOpacity>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="primary" size="sm">
                {role}
              </Badge>
            ))}
          </View>
        </View>

        <Card className="mb-4">
          <View className="mb-4 flex-row items-center justify-between">
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
                  <Button title="Kaydet" onPress={handleUpdateProfile} loading={updateLoading} />
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
                  <Text className="font-medium text-slate-900">{profile?.phone || '—'}</Text>
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
                onPress={() => navigation.navigate(item.screen)}>
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      item.danger ? 'bg-red-100' : 'bg-white'
                    }`}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.danger ? '#dc2626' : '#64748b'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${item.danger ? 'text-red-700' : 'text-slate-900'}`}>
                      {item.title}
                    </Text>
                    <Text className={`text-xs ${item.danger ? 'text-red-500' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.danger ? '#fca5a5' : '#94a3b8'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cityModalVisible}
        onRequestClose={() => setCityModalVisible(false)}
        statusBarTranslucent>
        <BlurView intensity={20} tint="dark" className="flex-1">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setCityModalVisible(false)}
          />
          <View className="h-[75%] overflow-hidden rounded-t-[32px] bg-white shadow-2xl">
            <View className="z-10 flex-row items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <Text className="text-xl font-bold text-slate-800">Şehir Seçin</Text>
              <TouchableOpacity
                onPress={() => setCityModalVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TURKEY_CITIES}
              renderItem={renderCityItem}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              className="bg-slate-50"
            />
          </View>
        </BlurView>
      </Modal>
    </Screen>
  );
}
