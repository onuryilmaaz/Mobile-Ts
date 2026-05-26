/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Screen } from '@/components/layout/Screen';
import { qiblaService } from '@/services/qibla.service';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const smoothAngle = (prev: number, next: number) => {
  let diff = next - prev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return prev + diff * 0.15;
};

export default function QiblaFinderScreen() {
  const headingSubRef = useRef<Location.LocationSubscription | null>(null);
  const [heading, setHeading] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Konum izni reddedildi. Kıbleyi bulmak için izne ihtiyacımız var.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const bearing = qiblaService.calculateBearing(loc.coords.latitude, loc.coords.longitude);
      setQiblaBearing(bearing);
      setLoading(false);

      // watchHeadingAsync: OS-seviyesi sensör füzyonu (ivmeölçer + manyetometre + jiroskop).
      // trueHeading coğrafi kuzeyi verir (manyetik sapma otomatik düzeltilir).
      sub = await Location.watchHeadingAsync((data) => {
        const raw = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        setHeading((prev) => smoothAngle(prev, raw));
      });
      headingSubRef.current = sub;
    })();

    return () => {
      sub?.remove();
    };
  }, []);

  const arrowRotation = qiblaBearing - heading;
  // ((x % 360) + 360) % 360 her zaman [0, 360) aralığına normalize eder;
  // min(n, 360-n) ile her iki kenardaki sarma durumunu yakalar (örn. 357° = 3° uzakta).
  const normalizedRotation = ((arrowRotation % 360) + 360) % 360;
  const isAligned = Math.min(normalizedRotation, 360 - normalizedRotation) < 5;

  if (loading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#0f766e'} />
        <Text className="mt-4 text-slate-600 dark:text-slate-400">Konum alınıyor...</Text>
      </Screen>
    );
  }

  if (errorMsg) {
    return (
      <Screen className="items-center justify-center p-6">
        <Ionicons name="warning-outline" size={48} color={isDark ? "#fca5a5" : "#ef4444"} />
        <Text className="mt-4 text-center text-slate-900 dark:text-white">{errorMsg}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-12 items-center">
          <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Kıble Açısı
          </Text>
          <Text className="text-5xl font-black text-teal-700 dark:text-teal-400">
            {qiblaBearing.toFixed(0)}°
          </Text>
        </View>

        <View className="mb-12 items-center justify-center">
          <View
            style={{
              width: width * 0.75,
              height: width * 0.75,
              borderRadius: (width * 0.75) / 2,
            }}
            className="relative items-center justify-center rounded-full border-4 border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800/70 dark:shadow-none">
            
            <View className="absolute top-4 items-center">
              <Text className="mb-1 text-xl font-bold text-red-500 dark:text-red-400">N</Text>
              <View className="h-4 w-1 rounded-full bg-red-500 dark:bg-red-400" />
            </View>

            <View className="absolute bottom-4 items-center">
              <View className="mb-1 h-4 w-1 rounded-full bg-slate-300 dark:bg-slate-800" />
              <Text className="text-xl font-bold text-slate-400 dark:text-slate-500">S</Text>
            </View>

            <View className="absolute right-6 items-center" style={{ top: '45%' }}>
              <Text className="text-xl font-bold text-slate-400 dark:text-slate-500">E</Text>
            </View>

            <View className="absolute left-6 items-center" style={{ top: '45%' }}>
              <Text className="text-xl font-bold text-slate-400 dark:text-slate-500">W</Text>
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

            <View className="h-[120px] w-[120px] items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/40">
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
            <View className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-8 py-4 dark:border-emerald-400/30 dark:bg-emerald-400/10">
              <Text className="text-lg font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
                ✓ Kıble Yönü
              </Text>
            </View>
          ) : (
            <Text className="text-sm text-slate-500 dark:text-slate-300">
              Cihazı yatay tutun ve döndürün
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}
