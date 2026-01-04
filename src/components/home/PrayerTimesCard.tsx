/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prayerService } from '@/services/prayer.service';
import { notificationService } from '@/services/notification.service';
import { useThemeStore } from '@/store/theme.store';

const STORAGE_KEY = 'SELECTED_CITY';

const PRAYER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  İmsak: 'moon-outline',
  Güneş: 'sunny-outline',
  Öğle: 'sunny',
  İkindi: 'partly-sunny',
  Akşam: 'moon',
  Yatsı: 'star-outline',
};

const THEME_COLORS = {
  İmsak: '#1e293b',
  Güneş: '#fb923c',
  Öğle: '#0ea5e9',
  İkindi: '#f59e0b',
  Akşam: '#4f46e5',
  Yatsı: '#0f172a',
  Default: '#0f766e',
};

const NEXT_TO_CURRENT: Record<string, string> = {
  Güneş: 'İmsak',
  Öğle: 'Güneş',
  İkindi: 'Öğle',
  Akşam: 'İkindi',
  Yatsı: 'Akşam',
  İmsak: 'Yatsı',
};

export function PrayerTimesCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('İstanbul');
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [isCityLoaded, setIsCityLoaded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const targetTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setHeaderColor = useThemeStore((s) => s.setHeaderColor);

  useEffect(() => {
    loadCity();
    initNotifications();
    const interval = setInterval(() => {
      loadCity();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const initNotifications = async () => {
    const hasPermission = await notificationService.requestPermissions();
    if (hasPermission) {
      const enabled = await notificationService.isEnabled();
      setNotificationsEnabled(enabled);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await notificationService.enableNotifications();
      if (data) {
        await notificationService.schedulePrayerNotifications(data);
      }
    } else {
      await notificationService.disableNotifications();
    }
  };

  const loadCity = async () => {
    try {
      const savedCity = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedCity && savedCity !== selectedCity) {
        setSelectedCity(savedCity);
      }
      setIsCityLoaded(true);
    } catch (e) {
      console.error('Failed to load city', e);
      setIsCityLoaded(true);
    }
  };

  const normalizeCity = (city: string) => {
    return city.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
  };

  const fixTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    let newH = h - 3;
    if (newH < 0) newH += 24;
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const calculateNextPrayer = (times: Record<string, string>) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    const checkpoints = [
      { key: 'İmsak', val: times.imsak },
      { key: 'Güneş', val: times.gunes },
      { key: 'Öğle', val: times.ogle },
      { key: 'İkindi', val: times.ikindi },
      { key: 'Akşam', val: times.aksam },
      { key: 'Yatsı', val: times.yatsi },
    ];

    let foundNext = false;

    for (const point of checkpoints) {
      if (!point.val) continue;
      const [ph, pm] = point.val.split(':').map(Number);
      const pointMinutes = ph * 60 + pm;

      if (pointMinutes > currentMinutes) {
        const diffMinutes = pointMinutes - currentMinutes;
        const targetTime = now.getTime() + diffMinutes * 60 * 1000 - currentSeconds * 1000;
        targetTimeRef.current = targetTime;
        setNextPrayerName(point.key);
        foundNext = true;
        break;
      }
    }

    if (!foundNext && times.imsak) {
      const [ph, pm] = times.imsak.split(':').map(Number);
      const pointMinutes = ph * 60 + pm;
      const diffMinutes = 1440 - currentMinutes + pointMinutes;
      const targetTime = now.getTime() + diffMinutes * 60 * 1000 - currentSeconds * 1000;
      targetTimeRef.current = targetTime;
      setNextPrayerName('İmsak');
    }
    updateCountdown();
  };

  useEffect(() => {
    if (!nextPrayerName) {
      setHeaderColor(THEME_COLORS['Default']);
      return;
    }
    const current = NEXT_TO_CURRENT[nextPrayerName];
    const color = THEME_COLORS[current as keyof typeof THEME_COLORS] || THEME_COLORS['Default'];
    setHeaderColor(color);
  }, [nextPrayerName, setHeaderColor]);

  const fetchPrayerTimes = async (city: string) => {
    try {
      setLoading(true);
      const normalizedCity = normalizeCity(city);
      const res = await prayerService.getPrayerTimes(normalizedCity);

      if (res && res.success && res.data && res.data.prayers) {
        const raw = res.data.prayers;
        const corrected = {
          imsak: fixTime(raw.sabah),
          gunes: fixTime(raw.imsak),
          ogle: fixTime(raw.öğle),
          ikindi: fixTime(raw.ikindi),
          aksam: fixTime(raw.akşam),
          yatsi: fixTime(raw.yatsı),
        };
        setData(corrected);
        calculateNextPrayer(corrected);

        if (notificationsEnabled) {
          await notificationService.schedulePrayerNotifications(corrected);
        }
      }
    } catch (error: any) {
      console.error('Error fetching prayer times:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCityLoaded) {
      fetchPrayerTimes(selectedCity);
    }
  }, [selectedCity, isCityLoaded]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (data) calculateNextPrayer(data);
    }, 60000);
    return () => clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      updateCountdown();
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data]);

  const updateCountdown = () => {
    if (!targetTimeRef.current) return;
    const now = Date.now();
    const diff = targetTimeRef.current - now;
    if (diff < 0) {
      if (data) calculateNextPrayer(data);
    }
    if (diff <= 0) {
      setRemainingTime('00:00:00');
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    setRemainingTime(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  };

  const getThemeColor = () => {
    if (!nextPrayerName) return THEME_COLORS['Default'];
    const current = NEXT_TO_CURRENT[nextPrayerName];
    return THEME_COLORS[current as keyof typeof THEME_COLORS] || THEME_COLORS['Default'];
  };

  const themeColor = getThemeColor();

  const prayers = data
    ? [
        { label: 'İmsak', time: data.imsak, key: 'imsak' },
        { label: 'Güneş', time: data.gunes, key: 'gunes' },
        { label: 'Öğle', time: data.ogle, key: 'ogle' },
        { label: 'İkindi', time: data.ikindi, key: 'ikindi' },
        { label: 'Akşam', time: data.aksam, key: 'aksam' },
        { label: 'Yatsı', time: data.yatsi, key: 'yatsi' },
      ]
    : [];

  return (
    <View className="mx-4 my-8">
      <View className="overflow-hidden rounded-[32px] border border-slate-100/50 bg-white shadow-xl shadow-teal-900/10">
        <View
          style={{ backgroundColor: themeColor }}
          className="relative overflow-hidden px-6 pb-8 pt-6">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />

          <View className="z-10 items-center">
            <Text className="mb-2 text-sm font-medium uppercase tracking-widest text-white/80">
              {nextPrayerName ? `${nextPrayerName} Vaktine Kalan` : 'Vaktin Çıkmasına'}
            </Text>
            <Text className="font-mono text-5xl font-bold tracking-tight text-white">
              {targetTimeRef.current ? remainingTime : '--:--:--'}
            </Text>
            <View className="mt-3 rounded-full border border-white/20 bg-white/20 px-4 py-1.5">
              <Text className="text-xs font-medium text-white">Gününüz bereketli geçsin</Text>
            </View>
          </View>
        </View>

        <View className="bg-white p-4">
          {loading && !data ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={themeColor} />
              <Text className="mt-3 text-sm text-slate-400">Vakitler yükleniyor...</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {prayers.map((item) => {
                const isNext = item.label === nextPrayerName;
                return (
                  <View key={item.key} className="w-[31%]">
                    <View
                      className={`
                        items-center justify-center rounded-2xl border px-1 py-3
                        ${isNext ? 'border-teal-200 bg-teal-50 shadow-sm' : 'border-slate-100 bg-slate-50'}
                      `}>
                      <Ionicons
                        name={PRAYER_ICONS[item.label]}
                        size={20}
                        color={isNext ? themeColor : '#64748b'}
                        style={{ marginBottom: 6 }}
                      />
                      <Text
                        style={{ color: isNext ? themeColor : '#64748b' }}
                        className="mb-1 text-xs font-medium">
                        {item.label}
                      </Text>
                      <Text
                        className={`text-lg font-bold tracking-tight ${isNext ? 'text-slate-900' : 'text-slate-800'}`}>
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View className="mt-4 border-t border-slate-100 pt-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-900">Bildirimler</Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  Vakit girişinde ve 30dk önce bildirim al
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f1f5f9'}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
