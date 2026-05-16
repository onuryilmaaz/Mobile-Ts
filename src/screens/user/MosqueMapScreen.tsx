/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { DraggableBottomSheet } from '@/components/layout/DraggableBottomSheet';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { cssInterop } from 'nativewind';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMosqueStore, type Mosque } from '@/modules/mosque/mosque.store';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/modules/auth/auth.store';
import { mosqueApi } from '@/modules/mosque/mosque.api';
import * as Haptics from 'expo-haptics';

cssInterop(MapView, { className: 'style' });

const INITIAL_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type FormState = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url: string;
  image_public_id: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  latitude: 0,
  longitude: 0,
  image_url: '',
  image_public_id: '',
};

const MosquePin = ({ isMine }: { isMine: boolean }) => (
  <View style={{ alignItems: 'center' }}>
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isMine ? '#10b981' : '#0f766e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 8,
        borderWidth: 2.5,
        borderColor: '#fff',
      }}>
      <Text style={{ fontSize: 20 }}>🕌</Text>
    </View>
    <View
      style={{
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: isMine ? '#10b981' : '#0f766e',
        marginTop: -1,
      }}
    />
  </View>
);

const MosqueMapScreen = () => {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const { mosques, fetchMosques, addMosque, updateMosque, deleteMosque } = useMosqueStore();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [filter, setFilter] = useState<'mine' | 'all'>('all');

  // Add/Edit sheet
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add');
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingMosque, setEditingMosque] = useState<Mosque | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manage sheet (edit/delete for own mosque)
  const [showManageSheet, setShowManageSheet] = useState(false);
  const [managingMosque, setManagingMosque] = useState<Mosque | null>(null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Harita özelliğini kullanmak için konum izni vermeniz gerekiyor.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      fetchMosques(filter);
    })();
  }, [filter]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: 'mosque.jpg',
        type: 'image/jpeg',
      } as any);
      const response = await mosqueApi.uploadImage(formData);
      if (response.data.success) {
        setForm((prev) => ({
          ...prev,
          image_url: response.data.imageUrl,
          image_public_id: response.data.imagePublicId,
        }));
      }
    } catch (error) {
      Alert.alert('Hata', 'Görsel yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const openAddSheet = (lat: number, lng: number) => {
    setSheetMode('add');
    setEditingMosque(null);
    setForm({ ...EMPTY_FORM, latitude: lat, longitude: lng });
    setShowFormSheet(true);
  };

  const openEditSheet = (mosque: Mosque) => {
    setSheetMode('edit');
    setEditingMosque(mosque);
    setForm({
      name: mosque.name,
      description: mosque.description ?? '',
      latitude: parseFloat(mosque.latitude),
      longitude: parseFloat(mosque.longitude),
      image_url: mosque.image_url ?? '',
      image_public_id: mosque.image_public_id ?? '',
    });
    setShowManageSheet(false);
    setShowFormSheet(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Hata', 'Lütfen cami adını girin');
      return;
    }
    setIsSaving(true);
    let success = false;
    if (sheetMode === 'add') {
      success = await addMosque({
        name: form.name,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        image_url: form.image_url || undefined,
        image_public_id: form.image_public_id || undefined,
      });
    } else if (editingMosque) {
      success = await updateMosque(editingMosque.id, {
        name: form.name,
        description: form.description,
        image_url: form.image_url || undefined,
        image_public_id: form.image_public_id || undefined,
      });
    }
    setIsSaving(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFormSheet(false);
      setForm(EMPTY_FORM);
    } else {
      Alert.alert('Hata', 'Kaydedilemedi');
    }
  };

  const handleDelete = (mosque: Mosque) => {
    Alert.alert('Camiyi Sil', `"${mosque.name}" silinecek. Emin misin?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteMosque(mosque.id);
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowManageSheet(false);
          } else {
            Alert.alert('Hata', 'Silinemedi');
          }
        },
      },
    ]);
  };

  const onMapLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    openAddSheet(latitude, longitude);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const centerToUser = () => {
    if (location && mapRef.current) {
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 300);
      setCurrentRegion(region);
    }
  };

  const zoomIn = () => {
    const next = {
      ...currentRegion,
      latitudeDelta: Math.max(currentRegion.latitudeDelta / 2, 0.001),
      longitudeDelta: Math.max(currentRegion.longitudeDelta / 2, 0.001),
    };
    mapRef.current?.animateToRegion(next, 250);
    setCurrentRegion(next);
  };

  const zoomOut = () => {
    const next = {
      ...currentRegion,
      latitudeDelta: Math.min(currentRegion.latitudeDelta * 2, 80),
      longitudeDelta: Math.min(currentRegion.longitudeDelta * 2, 80),
    };
    mapRef.current?.animateToRegion(next, 250);
    setCurrentRegion(next);
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={onMapLongPress}
        onRegionChangeComplete={setCurrentRegion}
        customMapStyle={isDark ? darkMapStyle : []}>
        {mosques.map((mosque) => {
          const isMine = mosque.user_id === user?.id;
          return (
            <Marker
              key={mosque.id}
              coordinate={{
                latitude: parseFloat(mosque.latitude),
                longitude: parseFloat(mosque.longitude),
              }}
              tracksViewChanges={false}
              onCalloutPress={() => {
                if (isMine) {
                  setManagingMosque(mosque);
                  setShowManageSheet(true);
                }
              }}>
              <MosquePin isMine={isMine} />
              <Callout tooltip>
                <View className="w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  {mosque.image_url && (
                    <Image
                      source={{ uri: mosque.image_url }}
                      className="h-32 w-full"
                      resizeMode="cover"
                    />
                  )}
                  <View className="p-3">
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">
                      {mosque.name}
                    </Text>
                    {mosque.username && (
                      <Text className="text-[10px] font-medium text-teal-600">
                        @{mosque.username} tarafından eklendi
                      </Text>
                    )}
                    {mosque.description ? (
                      <Text
                        className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                        numberOfLines={2}>
                        {mosque.description}
                      </Text>
                    ) : null}
                    {isMine && (
                      <Text className="mt-2 text-center text-[10px] font-bold text-teal-600">
                        Düzenlemek için dokun
                      </Text>
                    )}
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Filter */}
      <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 rounded-full bg-white/90 p-1 shadow-sm dark:bg-slate-900/90">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`rounded-full px-4 py-2 ${filter === 'all' ? 'bg-teal-600' : ''}`}>
            <Text className={`text-xs font-bold ${filter === 'all' ? 'text-white' : 'text-slate-600'}`}>
              Herkes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('mine')}
            className={`rounded-full px-4 py-2 ${filter === 'mine' ? 'bg-teal-600' : ''}`}>
            <Text className={`text-xs font-bold ${filter === 'mine' ? 'text-white' : 'text-slate-600'}`}>
              Benimkiler
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zoom + Locate + Add */}
      <View className="absolute bottom-10 right-6 gap-3">
        <View
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}>
          <TouchableOpacity
            onPress={zoomIn}
            style={{
              width: 48,
              height: 48,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#334155' : '#e2e8f0',
            }}>
            <Ionicons name="add" size={22} color={isDark ? '#2dd4bf' : '#0d9488'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={zoomOut}
            style={{
              width: 48,
              height: 48,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="remove" size={22} color={isDark ? '#2dd4bf' : '#0d9488'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={centerToUser}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-slate-800">
          <Ionicons name="locate" size={22} color={isDark ? '#2dd4bf' : '#0d9488'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const lat = location?.coords.latitude ?? INITIAL_REGION.latitude;
            const lng = location?.coords.longitude ?? INITIAL_REGION.longitude;
            openAddSheet(lat, lng);
          }}
          className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-xl">
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Manage Sheet (kendi camisi: düzenle / sil) */}
      <DraggableBottomSheet
        visible={showManageSheet}
        onClose={() => setShowManageSheet(false)}
        isDark={isDark}
        snapPartial={280}>
        {(panHandlers) =>
          managingMosque ? (
            <View className="flex-1 pt-3">
              <View {...panHandlers}>
                <View className="mb-3 items-center py-2">
                  <View className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
                </View>
                <View className="mb-4 border-b border-slate-100 px-5 pb-4 dark:border-slate-800">
                  <Text className="text-xl font-black text-slate-900 dark:text-white">
                    {managingMosque.name}
                  </Text>
                  {managingMosque.description ? (
                    <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {managingMosque.description}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="gap-3 px-5 pb-6">
                <TouchableOpacity
                  onPress={() => openEditSheet(managingMosque)}
                  className="flex-row items-center gap-3 rounded-2xl bg-teal-600 p-4">
                  <Ionicons name="pencil" size={20} color="white" />
                  <Text className="text-base font-bold text-white">Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(managingMosque)}
                  className="flex-row items-center gap-3 rounded-2xl bg-red-500 p-4">
                  <Ionicons name="trash" size={20} color="white" />
                  <Text className="text-base font-bold text-white">Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      </DraggableBottomSheet>

      {/* Add / Edit Form Sheet */}
      <DraggableBottomSheet
        visible={showFormSheet}
        onClose={() => setShowFormSheet(false)}
        isDark={isDark}>
        {(panHandlers) => (
          <View className="flex-1 pt-3">
            <View {...panHandlers}>
              <View className="mb-3 items-center py-2">
                <View className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
              </View>
              <View className="mb-4 flex-row items-center justify-between border-b border-slate-100 px-5 pb-4 dark:border-slate-800">
                <Text className="text-xl font-black text-slate-900 dark:text-white">
                  {sheetMode === 'add' ? 'Cami İşaretle' : 'Camiyi Düzenle'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFormSheet(false)}
                  className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Ionicons name="close" size={22} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              className="flex-1 px-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}>
              <View className="gap-4">
                <View>
                  <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Cami Adı
                  </Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(text) => setForm((p) => ({ ...p, name: text }))}
                    className="rounded-2xl bg-slate-50 p-4 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                    placeholder="Örn: Sultanahmet Camii"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Not / Açıklama
                  </Text>
                  <TextInput
                    value={form.description}
                    onChangeText={(text) => setForm((p) => ({ ...p, description: text }))}
                    multiline
                    numberOfLines={3}
                    className="rounded-2xl bg-slate-50 p-4 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                    placeholder="Burada namaz kılmak çok huzurluydu..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Fotoğraf
                  </Text>
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="h-48 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    {isUploading ? (
                      <ActivityIndicator color="#0d9488" />
                    ) : form.image_url ? (
                      <Image
                        source={{ uri: form.image_url }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <>
                        <Ionicons name="camera" size={40} color="#94a3b8" />
                        <Text className="mt-2 text-xs font-bold text-slate-400">Fotoğraf Seç</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View className="px-5 pb-6 pt-4">
              <TouchableOpacity
                onPress={handleSave}
                disabled={isUploading || isSaving}
                className="flex-row items-center justify-center gap-3 rounded-3xl bg-teal-600 p-5 shadow-lg active:opacity-80">
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text className="text-lg font-black text-white">
                      {sheetMode === 'add' ? 'Kaydet ve Paylaş' : 'Güncelle'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </DraggableBottomSheet>
    </View>
  );
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
];

export default MosqueMapScreen;
