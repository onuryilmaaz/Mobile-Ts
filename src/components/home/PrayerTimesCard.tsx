import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, Switch, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { prayerService } from '@/services/prayer.service';
import { notificationService } from '@/services/notification.service';
import { useThemeStore } from '@/store/theme.store';
import { getDistrictById, getStateById } from '@/constants/locations';
import type { PrayerTimeData } from '@/types/prayer';
import { rootNavigate } from '@/navigation/rootNavigation';

const STORAGE_STATE_ID_KEY = 'SELECTED_STATE_ID';
const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';
const DEFAULT_DISTRICT_ID = '9654';

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

type PrayerTimesCardProps = {
  focusNonce: number;
};

export function PrayerTimesCard({ focusNonce }: PrayerTimesCardProps) {
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PrayerTimeData | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(DEFAULT_DISTRICT_ID);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [currentPrayerStartTime, setCurrentPrayerStartTime] = useState<number | null>(null);
  const [isDistrictLoaded, setIsDistrictLoaded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const targetTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const setHeaderColor = useThemeStore((s) => s.setHeaderColor);

  const selectedDistrict = selectedDistrictId ? getDistrictById(selectedDistrictId) : null;
  const selectedState = selectedStateId ? getStateById(selectedStateId) : null;

  useEffect(() => {
    loadDistrict();
    initNotifications();
  }, []);

  useEffect(() => {
    loadDistrict();
  }, [focusNonce]);

  const openLocationSelection = () => {
    rootNavigate('UserTabs', {
      screen: 'Home',
      params: { screen: 'LocationSelection' },
    } as any);
  };

  const initNotifications = async () => {
    const enabled = await notificationService.isEnabled();
    setNotificationsEnabled(enabled);
  };

  const handleNotificationToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (value) {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) return;
      setNotificationsEnabled(true);
      await notificationService.enableNotifications();
      if (data) {
        await notificationService.schedulePrayerNotifications(
          data.times as unknown as Record<string, string>
        );
      }
    } else {
      setNotificationsEnabled(false);
      await notificationService.disableNotifications();
    }
  };

  const loadDistrict = async () => {
    try {
      const savedStateId = await AsyncStorage.getItem(STORAGE_STATE_ID_KEY);
      const savedDistrictId = await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY);
      if (savedStateId) setSelectedStateId(savedStateId);
      if (savedDistrictId) setSelectedDistrictId(savedDistrictId);
      else if (savedStateId) setSelectedDistrictId(DEFAULT_DISTRICT_ID);
      setIsDistrictLoaded(true);
    } catch {
      setIsDistrictLoaded(true);
    }
  };

  const updateCountdown = () => {
    if (!targetTimeRef.current) return;
    const diff = targetTimeRef.current - Date.now();
    if (diff <= 0) {
      setRemainingTime('00:00:00');
      return;
    }
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    setRemainingTime(
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    );
  };

  const calculateNextPrayer = (prayerData: PrayerTimeData) => {
    if (!prayerData?.times) return;
    const times = prayerData.times;
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
    for (let i = 0; i < checkpoints.length; i++) {
      const point = checkpoints[i];
      if (!point.val) continue;
      const [ph, pm] = point.val.split(':').map(Number);
      const pointMinutes = ph * 60 + pm;
      if (pointMinutes > currentMinutes) {
        const diffMins = pointMinutes - currentMinutes;
        targetTimeRef.current = now.getTime() + diffMins * 60_000 - currentSeconds * 1000;
        setNextPrayerName(point.key);
        const prev = checkpoints[i === 0 ? checkpoints.length - 1 : i - 1];
        if (prev.val) {
          const [sph, spm] = prev.val.split(':').map(Number);
          const start = new Date(now);
          if (i === 0) start.setDate(start.getDate() - 1);
          start.setHours(sph, spm, 0, 0);
          setCurrentPrayerStartTime(start.getTime());
        }
        foundNext = true;
        break;
      }
    }

    if (!foundNext && times.imsak) {
      const [ph, pm] = times.imsak.split(':').map(Number);
      const diffMins = 1440 - currentMinutes + ph * 60 + pm;
      targetTimeRef.current = now.getTime() + diffMins * 60_000 - currentSeconds * 1000;
      setNextPrayerName('İmsak');
      const [sph, spm] = times.yatsi.split(':').map(Number);
      const start = new Date(now);
      if (now.getHours() < ph) start.setDate(start.getDate() - 1);
      start.setHours(sph, spm, 0, 0);
      setCurrentPrayerStartTime(start.getTime());
    }
    updateCountdown();
  };

  useEffect(() => {
    if (!nextPrayerName) {
      setHeaderColor(THEME_COLORS['Default']);
      return;
    }
    const current = NEXT_TO_CURRENT[nextPrayerName];
    setHeaderColor(THEME_COLORS[current as keyof typeof THEME_COLORS] || THEME_COLORS['Default']);
  }, [nextPrayerName, setHeaderColor]);

  const fetchPrayerTimes = async (districtId: string) => {
    try {
      setLoading(true);
      const prayerData = await prayerService.getTodayPrayerTimes(districtId);
      if (prayerData) {
        setData(prayerData);
        calculateNextPrayer(prayerData);
        if (notificationsEnabled) {
          await notificationService.schedulePrayerNotifications({
            imsak: prayerData.times.imsak,
            gunes: prayerData.times.gunes,
            ogle: prayerData.times.ogle,
            ikindi: prayerData.times.ikindi,
            aksam: prayerData.times.aksam,
            yatsi: prayerData.times.yatsi,
          });
        }
      }
    } catch (e) {
      console.error('Error fetching prayer times:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDistrictLoaded && selectedDistrictId) fetchPrayerTimes(selectedDistrictId);
  }, [selectedDistrictId, isDistrictLoaded]);

  useEffect(() => {
    const t = setInterval(() => {
      if (data) calculateNextPrayer(data);
    }, 60_000);
    return () => clearInterval(t);
  }, [data]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data]);

  const prayers = data?.times
    ? [
        { label: 'İmsak', time: data.times.imsak, key: 'imsak' },
        { label: 'Güneş', time: data.times.gunes, key: 'gunes' },
        { label: 'Öğle', time: data.times.ogle, key: 'ogle' },
        { label: 'İkindi', time: data.times.ikindi, key: 'ikindi' },
        { label: 'Akşam', time: data.times.aksam, key: 'aksam' },
        { label: 'Yatsı', time: data.times.yatsi, key: 'yatsi' },
      ]
    : [];

  const progressPct =
    targetTimeRef.current && currentPrayerStartTime
      ? Math.min(
          100,
          Math.max(
            0,
            ((Date.now() - currentPrayerStartTime) /
              (targetTimeRef.current - currentPrayerStartTime)) *
              100
          )
        )
      : 0;

  return (
    <View className="mx-4 mb-4 mt-3">
      <View
        className={`mb-3 overflow-hidden rounded-[28px] border shadow-2xl ${
          isDark
            ? 'border-slate-700/50 bg-slate-800'
            : 'border-black/5 bg-teal-700 shadow-teal-700/30'
        }`}>
        <View className="absolute -right-[50px] -top-[50px] h-[180px] w-[180px] rounded-full bg-teal-700/15 dark:bg-teal-500/10" />
        <View className="absolute -bottom-[40px] -left-[40px] h-[130px] w-[130px] rounded-full bg-white/15 dark:bg-indigo-400/10" />

        <View className="items-center p-7">
          <Text className="absolute bottom-1 text-[72px] text-white opacity-15 dark:text-teal-500 dark:opacity-10">
            🕌
          </Text>

          <View className="mb-4 rounded-full border border-[#f6c358]/30 bg-[#f6c358]/15 px-4 py-1.5">
            <Text className="text-[10px] font-black uppercase tracking-[2.5px] text-[#f6c358]">
              {nextPrayerName ? `${nextPrayerName} Vaktine Kalan` : 'Bir Sonraki Namaz'}
            </Text>
          </View>

          <Text className="text-center text-[54px] font-black tracking-tight text-white">
            {targetTimeRef.current ? remainingTime : '--:--:--'}
          </Text>

          {nextPrayerName && data?.times && (
            <Text className="mt-2 text-[13px] font-semibold tracking-wide text-white/80">
              {nextPrayerName} ·{' '}
              {nextPrayerName === 'İmsak'
                ? data.times.imsak
                : nextPrayerName === 'Güneş'
                  ? data.times.gunes
                  : nextPrayerName === 'Öğle'
                    ? data.times.ogle
                    : nextPrayerName === 'İkindi'
                      ? data.times.ikindi
                      : nextPrayerName === 'Akşam'
                        ? data.times.aksam
                        : data.times.yatsi}
            </Text>
          )}

          {progressPct > 0 && (
            <View className="mt-5 h-[3px] w-[78%] overflow-hidden rounded-full bg-white/20">
              <View style={{ width: `${progressPct}%` }} className="h-full rounded-full bg-white" />
            </View>
          )}
        </View>
      </View>

      <View
        className={`mb-3 rounded-3xl border p-3.5 ${
          isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-white'
        }`}>
        {loading && !data ? (
          <View className="items-center py-7">
            <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#0f766e'} />
            <Text className="mt-2.5 text-[13px] text-slate-400 dark:text-slate-500">
              Vakitler yükleniyor...
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {prayers.map((item) => {
              const isNext = item.label === nextPrayerName;
              return (
                <View
                  key={item.key}
                  className={`w-[31%] items-center rounded-2xl border py-3 shadow-sm ${
                    isNext
                      ? isDark
                        ? 'border-teal-500/40 bg-teal-500/15'
                        : 'border-teal-600/40 bg-teal-50'
                      : isDark
                        ? 'border-slate-700 bg-slate-800/60'
                        : 'border-slate-200 bg-slate-50'
                  }`}>
                  <Ionicons
                    name={PRAYER_ICONS[item.label]}
                    size={17}
                    color={
                      isNext ? (isDark ? '#2dd4bf' : '#0f766e') : isDark ? '#94a3b8' : '#94a3b8'
                    }
                    style={{ marginBottom: 5 }}
                  />
                  <Text
                    className={`mb-1 text-[9px] font-bold uppercase tracking-widest ${
                      isNext
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}>
                    {item.label}
                  </Text>
                  <Text
                    className={`text-[15px] font-black ${
                      isNext
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-200'
                    }`}>
                    {item.time}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View
        className="overflow-hidden rounded-2xl border "
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
        }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openLocationSelection();
          }}
          className={`flex-row items-center border-b p-3.5 ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <View
            className={`mr-3 h-[34px] w-[34px] items-center justify-center rounded-xl ${isDark ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
            <Ionicons name="location-outline" size={17} color={isDark ? '#2dd4bf' : '#0f766e'} />
          </View>
          <View className="flex-1">
            <Text className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Konum
            </Text>
            <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedState && selectedDistrict
                ? `${selectedState.name} — ${selectedDistrict.name}`
                : selectedDistrict
                  ? selectedDistrict.name
                  : 'Konum seçin'}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={15}
            color={isDark ? 'rgba(240,244,255,0.30)' : '#94a3b8'}
          />
        </TouchableOpacity>

        <View className="flex-row items-center p-3.5">
          <View
            className={`mr-3 h-[34px] w-[34px] items-center justify-center rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <Ionicons
              name="notifications-outline"
              size={17}
              color={isDark ? '#fcd34d' : '#d97706'}
            />
          </View>
          <View className="flex-1">
            <Text className={`text-[13px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bildirimler
            </Text>
            <Text className={`mt-0.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Vakit girişinde ve 30dk önce bildirim al
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{
              false: isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0',
              true: isDark ? '#14b8a6' : '#0f766e',
            }}
            thumbColor={notificationsEnabled ? '#fff' : isDark ? 'rgba(240,244,255,0.30)' : '#fff'}
            ios_backgroundColor={isDark ? 'rgba(255,255,255,0.10)' : '#e2e8f0'}
          />
        </View>
      </View>
    </View>
  );
}
