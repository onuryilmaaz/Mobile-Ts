/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Screen } from '@/components/layout/Screen';
import { qiblaService } from '@/services/qibla.service';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/theme';

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
  const { colors, isDark } = useAppTheme();

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
      <Screen  className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Konum alınıyor...</Text>
      </Screen>
    );
  }

  if (errorMsg) {
    return (
      <Screen  className="items-center justify-center p-6">
        <Ionicons name="warning-outline" size={48} color={isDark ? "#fca5a5" : "#ef4444"} />
        <Text style={{ color: colors.textPrimary, marginTop: 16, textAlign: 'center' }}>{errorMsg}</Text>
      </Screen>
    );
  }

  return (
    <Screen >
      <View className="flex-1 items-center justify-center px-6">
        {/* Qibla Angle Display */}
        <View className="mb-12 items-center">
          <Text style={{ color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Kıble Açısı</Text>
          <Text style={{ color: colors.teal, fontSize: 48, fontWeight: 'bold' }}>{qiblaBearing.toFixed(0)}°</Text>
        </View>

        <View className="mb-12 items-center justify-center">
          <View
            style={{
              width: width * 0.75,
              height: width * 0.75,
              borderRadius: (width * 0.75) / 2,
              backgroundColor: colors.card,
              borderWidth: 4,
              borderColor: colors.cardBorder,
              shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 16, elevation: 10,
            }}
            className="relative items-center justify-center">
            <View className="absolute top-4 items-center">
              <Text style={{ color: isDark ? '#fca5a5' : '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>N</Text>
              <View style={{ height: 16, width: 4, borderRadius: 99, backgroundColor: isDark ? '#fca5a5' : '#ef4444' }} />
            </View>

            <View className="absolute bottom-4 items-center">
              <View style={{ height: 16, width: 4, borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1', marginBottom: 4 }} />
              <Text style={{ color: colors.textMuted, fontSize: 20, fontWeight: 'bold' }}>S</Text>
            </View>

            <View className="absolute right-6 items-center" style={{ top: '45%' }}>
              <Text style={{ color: colors.textMuted, fontSize: 20, fontWeight: 'bold' }}>E</Text>
            </View>

            <View className="absolute left-6 items-center" style={{ top: '45%' }}>
              <Text style={{ color: colors.textMuted, fontSize: 20, fontWeight: 'bold' }}>W</Text>
            </View>

            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <View
                key={deg}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 2,
                  height: deg % 90 === 0 ? 12 : 8,
                  backgroundColor: isDark ? (deg % 90 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)') : (deg % 90 === 0 ? '#94a3b8' : '#cbd5e1'),
                  transform: [
                    { translateX: -1 },
                    { translateY: -4 },
                    { rotate: `${deg}deg` },
                    { translateY: -((width * 0.75) / 2 - 16) },
                  ],
                }}
              />
            ))}

            <View
              style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center', borderRadius: 60, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <Ionicons
                name="arrow-up"
                size={70}
                color={isAligned ? (isDark ? '#34d399' : '#10b981') : (isDark ? '#fcd34d' : '#fbbf24')}
                style={{
                  transform: [{ rotate: `${arrowRotation}deg` }],
                }}
              />
            </View>
          </View>
        </View>

        <View className="items-center">
          {isAligned ? (
            <View style={{ borderRadius: 16, borderWidth: 2, borderColor: isDark ? 'rgba(52,211,153,0.3)' : '#a7f3d0', backgroundColor: isDark ? 'rgba(52,211,153,0.1)' : '#ecfdf5', paddingHorizontal: 32, paddingVertical: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 1, color: isDark ? '#34d399' : '#059669' }}>✓ Kıble Yönü</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Cihazı yatay tutun ve döndürün</Text>
          )}
        </View>
      </View>
    </Screen>
  );
}
