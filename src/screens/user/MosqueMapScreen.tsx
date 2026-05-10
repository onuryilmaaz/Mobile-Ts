/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMosqueStore } from '@/modules/mosque/mosque.store';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/modules/auth/auth.store';
import { mosqueApi } from '@/modules/mosque/mosque.api';
import * as Haptics from 'expo-haptics';

const INITIAL_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
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
  const { mosques, isLoading, fetchMosques, addMosque } = useMosqueStore();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [filter, setFilter] = useState<'mine' | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMosque, setNewMosque] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    image_url: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          'Harita özelliğini kullanmak için konum izni vermeniz gerekiyor.'
        );
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
        setNewMosque({ ...newMosque, image_url: response.data.imageUrl });
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Hata', 'Görsel yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveMosque = async () => {
    if (!newMosque.name) {
      Alert.alert('Hata', 'Lütfen cami adını girin');
      return;
    }

    const success = await addMosque(newMosque);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      setNewMosque({ name: '', description: '', latitude: 0, longitude: 0, image_url: '' });
    } else {
      Alert.alert('Hata', 'Cami kaydedilemedi');
    }
  };

  const onMapLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setNewMosque({ ...newMosque, latitude, longitude });
    setShowAddModal(true);
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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={onMapLongPress}
        onRegionChangeComplete={setCurrentRegion}
        customMapStyle={isDark ? darkMapStyle : []}>
        {mosques.map((mosque) => (
          <Marker
            key={mosque.id}
            coordinate={{
              latitude: parseFloat(mosque.latitude),
              longitude: parseFloat(mosque.longitude),
            }}
            tracksViewChanges={false}>
            <MosquePin isMine={mosque.user_id === user?.id} />
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
                  {mosque.description && (
                    <Text
                      className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                      numberOfLines={2}>
                      {mosque.description}
                    </Text>
                  )}
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Floating Controls */}
      <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 rounded-full bg-white/90 p-1 shadow-sm dark:bg-slate-900/90">
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`rounded-full px-4 py-2 ${filter === 'all' ? 'bg-teal-600' : ''}`}>
            <Text
              className={`text-xs font-bold ${filter === 'all' ? 'text-white' : 'text-slate-600'}`}>
              Herkes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('mine')}
            className={`rounded-full px-4 py-2 ${filter === 'mine' ? 'bg-teal-600' : ''}`}>
            <Text
              className={`text-xs font-bold ${filter === 'mine' ? 'text-white' : 'text-slate-600'}`}>
              Benimkiler
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="absolute bottom-10 right-6 gap-3">
        {/* Zoom Controls */}
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

        {/* Locate */}
        <TouchableOpacity
          onPress={centerToUser}
          className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-slate-800">
          <Ionicons name="locate" size={22} color={isDark ? '#2dd4bf' : '#0d9488'} />
        </TouchableOpacity>

        {/* Add Mosque */}
        <TouchableOpacity
          onPress={() => {
            if (location) {
              setNewMosque({
                ...newMosque,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              setShowAddModal(true);
            }
          }}
          className="h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-xl">
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-[40px] bg-white p-6 pb-12 dark:bg-slate-900">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-xl font-black text-slate-900 dark:text-white">
                Cami İşaretle
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[500px]" showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Cami Adı
                  </Text>
                  <TextInput
                    value={newMosque.name}
                    onChangeText={(text) => setNewMosque({ ...newMosque, name: text })}
                    className="rounded-2xl bg-slate-50 p-4 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                    placeholder="Örn: Sultanahmet Camii"
                  />
                </View>

                <View>
                  <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    Not / Açıklama
                  </Text>
                  <TextInput
                    value={newMosque.description}
                    onChangeText={(text) => setNewMosque({ ...newMosque, description: text })}
                    multiline
                    numberOfLines={3}
                    className="rounded-2xl bg-slate-50 p-4 font-medium text-slate-900 dark:bg-slate-800 dark:text-white"
                    placeholder="Burada namaz kılmak çok huzurluydu..."
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
                    ) : newMosque.image_url ? (
                      <Image
                        source={{ uri: newMosque.image_url }}
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

            <TouchableOpacity
              onPress={handleSaveMosque}
              disabled={isUploading}
              className="mt-6 flex-row items-center justify-center gap-3 rounded-3xl bg-teal-600 p-5 shadow-lg active:opacity-80">
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-lg font-black text-white">Kaydet ve Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});

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
