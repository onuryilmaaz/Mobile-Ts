import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function MosqueFinderScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Haritayı kullanmak için konum izni gereklidir.');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (e) {
        console.error('Location error:', e);
        setErrorMsg('Konum bilgisi alınamadı.');
      }
    })();
  }, []);

  const centerMap = () => {
    if (location && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        1000
      );
    }
  };

  return (
    <Screen className="bg-slate-50" safeAreaEdges={['left', 'right']}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          showsMyLocationButton={false}
          initialRegion={
            location
              ? {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                }
              : {
                  latitude: 40.7128,
                  longitude: 29.9414,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }
          }
        />

        <TouchableOpacity onPress={centerMap} style={styles.locateButton} activeOpacity={0.8}>
          <Ionicons name="locate" size={28} color="#0f766e" />
        </TouchableOpacity>

        {errorMsg && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e2e8f0',
  },
  locateButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
});
