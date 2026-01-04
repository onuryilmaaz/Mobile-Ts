import { useState, useEffect } from 'react';
import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Screen } from '@/components/layout/Screen';
import { qiblaService } from '@/services/qibla.service';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const smoothAngle = (prev: number, specific: number) => {
  let diff = specific - prev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return prev + diff * 0.15;
};

export default function QiblaFinderScreen() {
  const [subscription, setSubscription] = useState<any>(null);
  const [magHeading, setMagHeading] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Konum izni reddedildi. Kıbleyi bulmak için izne ihtiyacımız var.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      const bearing = qiblaService.calculateBearing(
        location.coords.latitude,
        location.coords.longitude
      );
      setQiblaBearing(bearing);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    _subscribe();
    return () => _unsubscribe();
  }, []);

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener((result) => {
        let { x, y } = result;
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle -= 90;

        if (angle < 0) {
          angle += 360;
        }

        setMagHeading((prev) => smoothAngle(prev, angle));
      })
    );
    Magnetometer.setUpdateInterval(50);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const arrowRotation = qiblaBearing - magHeading;
  const isAligned = Math.abs((arrowRotation + 360) % 360) < 5 || Math.abs(arrowRotation % 360) < 5;

  if (loading) {
    return (
      <Screen className="items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className="mt-4 text-slate-600">Konum alınıyor...</Text>
      </Screen>
    );
  }

  if (errorMsg) {
    return (
      <Screen className="items-center justify-center bg-slate-50 p-6">
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-center text-slate-700">{errorMsg}</Text>
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50">
      <View className="flex-1 items-center justify-center px-6">
        {/* Qibla Angle Display */}
        <View className="mb-12 items-center">
          <Text className="mb-2 text-xs uppercase tracking-widest text-slate-500">Kıble Açısı</Text>
          <Text className="text-5xl font-bold text-teal-600">{qiblaBearing.toFixed(0)}°</Text>
        </View>

        {/* Compass Container */}
        <View className="mb-12 items-center justify-center">
          {/* Outer Ring with Cardinal Directions */}
          <View
            style={{
              width: width * 0.75,
              height: width * 0.75,
              borderRadius: (width * 0.75) / 2,
            }}
            className="relative items-center justify-center border-4 border-slate-200 bg-white shadow-lg">
            {/* North Marker - Fixed at top */}
            <View className="absolute top-4 items-center">
              <Text className="mb-1 text-xl font-bold text-red-500">N</Text>
              <View className="h-4 w-1 rounded-full bg-red-500" />
            </View>

            {/* South Marker */}
            <View className="absolute bottom-4 items-center">
              <View className="mb-1 h-4 w-1 rounded-full bg-slate-300" />
              <Text className="text-xl font-bold text-slate-400">S</Text>
            </View>

            {/* East Marker */}
            <View className="absolute right-6 items-center" style={{ top: '45%' }}>
              <Text className="text-xl font-bold text-slate-400">E</Text>
            </View>

            {/* West Marker */}
            <View className="absolute left-6 items-center" style={{ top: '45%' }}>
              <Text className="text-xl font-bold text-slate-400">W</Text>
            </View>

            {/* Degree Ticks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <View
                key={deg}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 2,
                  height: deg % 90 === 0 ? 12 : 8,
                  backgroundColor: deg % 90 === 0 ? '#94a3b8' : '#cbd5e1',
                  transform: [
                    { translateX: -1 },
                    { translateY: -4 },
                    { rotate: `${deg}deg` },
                    { translateY: -((width * 0.75) / 2 - 16) },
                  ],
                }}
              />
            ))}

            {/* Center Circle with Arrow */}
            <View
              className="items-center justify-center rounded-full bg-slate-100"
              style={{ width: 120, height: 120 }}>
              <Ionicons
                name="arrow-up"
                size={70}
                color={isAligned ? '#10b981' : '#fbbf24'}
                style={{
                  transform: [{ rotate: `${arrowRotation}deg` }],
                }}
              />
            </View>
          </View>
        </View>

        {/* Status Message */}
        <View className="items-center">
          {isAligned ? (
            <View className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-8 py-4">
              <Text className="text-lg font-bold tracking-wide text-emerald-600">✓ Kıble Yönü</Text>
            </View>
          ) : (
            <Text className="text-sm text-slate-500">Cihazı yatay tutun ve döndürün</Text>
          )}
        </View>
      </View>
    </Screen>
  );
}
