import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationService } from '@/services/notification.service';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Switch,
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
import { alert } from '@/store/alert.store';
import { useThemeStore } from '@/store/theme.store';
import type { UserProfile } from '@/modules/user/user.types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  const scrollViewRef = useRef<ScrollView>(null);
  const { isDark, toggleTheme } = useThemeStore();

  const [profile, setProfile] = useState<UserProfile | null>(user as UserProfile | null);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [updateLoading, setUpdateLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleTestNotification = async () => {
    const success = await notificationService.sendTestNotification();
    if (success) {
      alert.success('Test Bildirimi', 'Bildirim 1 saniye içinde gelecek!');
    } else {
      alert.error('Hata', 'Bildirim gönderilemedi');
    }
  };

  const loadProfile = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const { data } = await userApi.profile();
        const profileData = (data as any).user ? (data as any).user : data;

        setProfile(profileData);
        setFirstName(profileData.firstName ?? '');
        setLastName(profileData.lastName ?? '');
        setUsername(profileData.username ?? '');
        setPhone(profileData.phone ?? '');

        if (profileData.roles) {
          setUser(profileData);
        }
      } catch (err) {
        console.log(err);
        alert.error('Hata', 'Profil bilgileri alınamadı');
      } finally {
        setRefreshing(false);
      }
    },
    [setUser]
  );

  async function handleUpdateProfile() {
    try {
      setUpdateLoading(true);
      const { data } = await userApi.updateProfile({ firstName, lastName, phone, username });
      const profileData = (data as any).user ? (data as any).user : data;
      setProfile(profileData);
      await refreshUser();
      setIsEditing(false);
      alert.success('Başarılı', 'Profil bilgileriniz güncellendi');
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Profil güncellenemedi');
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handlePickImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert.warning('İzin Gerekli', 'Galeriye erişim izni vermeniz gerekiyor.');
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
      alert.error('Hata', 'Resim seçilemedi');
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
      alert.success('Başarılı', 'Avatar yüklendi');
      await loadProfile();
      await refreshUser();
      setLocalAvatarUri(null);
    } catch (err) {
      console.log(err);
      alert.error('Hata', 'Avatar yüklenemedi');
    } finally {
      setAvatarLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const roles = profile?.roles ?? user?.roles ?? [];
  const avatarUrl = localAvatarUri || profile?.avatarUrl || user?.avatarUrl;

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <UploadOverlay visible={avatarLoading} message="Fotoğraf yükleniyor" />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadProfile(true)}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
            colors={[isDark ? '#14b8a6' : '#0f766e']}
          />
        }>
        <View className="mb-6 items-center">
          <View className="relative">
            <View className="mt-8 h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800 bg-teal-50 dark:bg-teal-500/10">
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
              className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 bg-teal-600 dark:border-slate-800 dark:bg-teal-500">
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
          </Text>
          { (profile?.username || user?.username) && (
            <Text className="text-sm font-medium text-teal-600 dark:text-teal-400">
              @{profile?.username || user?.username}
            </Text>
          )}
          <Text className="text-slate-500 dark:text-slate-400">
            {profile?.email ?? user?.email}
          </Text>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="primary" size="sm">
                {role}
              </Badge>
            ))}
          </View>
        </View>

        <Card className="mx-4 mb-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Kişisel Bilgiler
            </Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={20} color={isDark ? '#2dd4bf' : '#0f766e'} />
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
                label="Kullanıcı Adı"
                value={username}
                onChangeText={setUsername}
                placeholder="kullaniciadi"
                autoCapitalize="none"
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
                      setUsername(profile?.username ?? '');
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
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <Ionicons name="person-outline" size={20} color={isDark ? '#4b5563' : '#64748b'} />
                <View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Ad Soyad</Text>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile?.firstName || '—'} {profile?.lastName || ''}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <Ionicons name="at-circle-outline" size={20} color={isDark ? '#4b5563' : '#64748b'} />
                <View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Kullanıcı Adı</Text>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile?.username ? `@${profile.username}` : '—'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <Ionicons name="call-outline" size={20} color={isDark ? '#4b5563' : '#64748b'} />
                <View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">Telefon</Text>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile?.phone || '—'}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <Ionicons name="mail-outline" size={20} color={isDark ? '#4b5563' : '#64748b'} />
                <View>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">E-posta</Text>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white">
                    {profile?.email || user?.email || '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {user?.roles.includes('admin') && (
          <Card className="mx-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="mb-1 text-base font-bold text-slate-900 dark:text-white">
                  Bildirim Testi
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  Bildirimlerin çalışıp çalışmadığını test edin
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleTestNotification}
                className="rounded-full bg-teal-600 px-4 py-2.5 active:opacity-80 dark:bg-teal-500"
                activeOpacity={0.8}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="notifications" size={16} color="#fff" />
                  <Text className="text-sm font-semibold text-white">Test Et</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        <View className="mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm dark:shadow-none">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleTheme();
            }}
            activeOpacity={0.85}
            className="flex-row items-center p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/10">
              <Text className="text-xl">{isDark ? '🌙' : '☀️'}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Tema</Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {isDark ? 'Karanlık tema aktif' : 'Aydınlık tema aktif'}
              </Text>
            </View>

            <View className="flex-row items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-teal-500/30 dark:bg-teal-500/20">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${!isDark ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
                <Ionicons
                  name="sunny"
                  size={16}
                  color={!isDark ? '#d97706' : 'rgba(255,255,255,0.30)'}
                />
              </View>
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${isDark ? 'bg-teal-500 shadow-sm shadow-teal-500/40' : 'bg-transparent'}`}>
                <Ionicons name="moon" size={16} color={isDark ? '#ffffff' : 'rgba(0,0,0,0.25)'} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Card className="mx-4 mb-8">
          <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Ayarlar</Text>

          <View className="gap-2">
            {settingsItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className={`flex-row items-center justify-between rounded-xl p-4 ${item.danger ? 'bg-red-50 dark:bg-red-500/10' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                onPress={() => navigation.navigate(item.screen)}>
                <View className="flex-1 flex-row items-center gap-3">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${item.danger ? 'bg-red-100 dark:bg-red-500/20' : 'bg-white dark:bg-slate-800'}`}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.danger ? '#dc2626' : isDark ? '#4b5563' : '#64748b'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-bold ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {item.title}
                    </Text>
                    <Text
                      className={`text-xs ${item.danger ? 'text-red-500 dark:text-red-400/70' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.danger ? '#fca5a5' : isDark ? '#4b5563' : '#94a3b8'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
