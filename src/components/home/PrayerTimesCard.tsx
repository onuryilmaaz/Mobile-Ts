import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, Switch, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { prayerService } from '@/services/prayer.service';
import { notificationService } from '@/services/notification.service';
import { useThemeStore } from '@/store/theme.store';
import { getDistrictById, getStateById } from '@/constants/locations';
import type { PrayerTimeData } from '@/types/prayer';
import { useAppTheme } from '@/constants/theme';

const STORAGE_STATE_ID_KEY    = 'SELECTED_STATE_ID';
const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';
const DEFAULT_DISTRICT_ID     = '9654';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const PRAYER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  İmsak:  'moon-outline',
  Güneş:  'sunny-outline',
  Öğle:   'sunny',
  İkindi: 'partly-sunny',
  Akşam:  'moon',
  Yatsı:  'star-outline',
};

const THEME_COLORS = {
  İmsak:   '#1e293b',
  Güneş:   '#fb923c',
  Öğle:    '#0ea5e9',
  İkindi:  '#f59e0b',
  Akşam:   '#4f46e5',
  Yatsı:   '#0f172a',
  Default: '#0f766e',
};

const NEXT_TO_CURRENT: Record<string, string> = {
  Güneş:  'İmsak',
  Öğle:   'Güneş',
  İkindi: 'Öğle',
  Akşam:  'İkindi',
  Yatsı:  'Akşam',
  İmsak:  'Yatsı',
};

export function PrayerTimesCard() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading]                       = useState(false);
  const [data, setData]                             = useState<PrayerTimeData | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(DEFAULT_DISTRICT_ID);
  const [selectedStateId, setSelectedStateId]       = useState<string | null>(null);
  const [remainingTime, setRemainingTime]           = useState<string>('');
  const [nextPrayerName, setNextPrayerName]         = useState<string>('');
  const [currentPrayerStartTime, setCurrentPrayerStartTime] = useState<number | null>(null);
  const [isDistrictLoaded, setIsDistrictLoaded]     = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const targetTimeRef = useRef<number | null>(null);
  const intervalRef   = useRef<NodeJS.Timeout | null>(null);
  const setHeaderColor = useThemeStore((s) => s.setHeaderColor);

  const selectedDistrict = selectedDistrictId ? getDistrictById(selectedDistrictId) : null;
  const selectedState    = selectedStateId    ? getStateById(selectedStateId)    : null;

  useEffect(() => {
    loadDistrict();
    initNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => { loadDistrict(); }, [])
  );

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
      const savedStateId    = await AsyncStorage.getItem(STORAGE_STATE_ID_KEY);
      const savedDistrictId = await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY);
      if (savedStateId)    setSelectedStateId(savedStateId);
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
    if (diff <= 0) { setRemainingTime('00:00:00'); return; }
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    setRemainingTime(
      `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    );
  };

  const calculateNextPrayer = (prayerData: PrayerTimeData) => {
    if (!prayerData?.times) return;
    const times = prayerData.times;
    const now   = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    const checkpoints = [
      { key: 'İmsak',  val: times.imsak  },
      { key: 'Güneş',  val: times.gunes  },
      { key: 'Öğle',   val: times.ogle   },
      { key: 'İkindi', val: times.ikindi },
      { key: 'Akşam',  val: times.aksam  },
      { key: 'Yatsı',  val: times.yatsi  },
    ];

    let foundNext = false;
    for (let i = 0; i < checkpoints.length; i++) {
      const point = checkpoints[i];
      if (!point.val) continue;
      const [ph, pm]    = point.val.split(':').map(Number);
      const pointMinutes = ph * 60 + pm;
      if (pointMinutes > currentMinutes) {
        const diffMins  = pointMinutes - currentMinutes;
        targetTimeRef.current = now.getTime() + diffMins * 60_000 - currentSeconds * 1000;
        setNextPrayerName(point.key);
        const prev      = checkpoints[i === 0 ? checkpoints.length - 1 : i - 1];
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
    if (!nextPrayerName) { setHeaderColor(THEME_COLORS['Default']); return; }
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
            imsak: prayerData.times.imsak, gunes: prayerData.times.gunes,
            ogle: prayerData.times.ogle,   ikindi: prayerData.times.ikindi,
            aksam: prayerData.times.aksam, yatsi: prayerData.times.yatsi,
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
    const t = setInterval(() => { if (data) calculateNextPrayer(data); }, 60_000);
    return () => clearInterval(t);
  }, [data]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateCountdown, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [data]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const prayers = data?.times
    ? [
        { label: 'İmsak',  time: data.times.imsak,  key: 'imsak'  },
        { label: 'Güneş',  time: data.times.gunes,  key: 'gunes'  },
        { label: 'Öğle',   time: data.times.ogle,   key: 'ogle'   },
        { label: 'İkindi', time: data.times.ikindi,  key: 'ikindi' },
        { label: 'Akşam',  time: data.times.aksam,  key: 'aksam'  },
        { label: 'Yatsı',  time: data.times.yatsi,  key: 'yatsi'  },
      ]
    : [];

  const progressPct =
    targetTimeRef.current && currentPrayerStartTime
      ? Math.min(100, Math.max(0,
          ((Date.now() - currentPrayerStartTime) /
           (targetTimeRef.current - currentPrayerStartTime)) * 100
        ))
      : 0;

  // ── PREMIUM DYNAMIC UI ─────────────────────────────────────────────────────────
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 16 }}>

      {/* ╔══════════════════════════════╗
          ║   COUNTDOWN GLASS CARD       ║
          ╚══════════════════════════════╝ */}
      <View style={{
        borderRadius: 28, overflow: 'hidden',
        borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.05)',
        backgroundColor: colors.countdownBg,
        shadowColor: colors.teal, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.20 : 0.35, shadowRadius: 24, elevation: 14,
        marginBottom: 12,
      }}>
        {/* Ambient glow orbs */}
        <View style={{ position:'absolute', top:-50, right:-50, width:180, height:180,
          borderRadius:90, backgroundColor: colors.countdownGlow }} />
        <View style={{ position:'absolute', bottom:-40, left:-40, width:130, height:130,
          borderRadius:65, backgroundColor: isDark ? 'rgba(129,140,248,0.11)' : 'rgba(255,255,255,0.15)' }} />

        <View style={{ padding: 28, alignItems: 'center' }}>
          {/* Mosque emoji watermark */}
          <Text style={{
            position:'absolute', bottom: 4, fontSize: 72,
            opacity: isDark ? 0.07 : 0.15, color: isDark ? '#14b8a6' : '#ffffff',
          }}>🕌</Text>

          {/* Gold label pill */}
          <View style={{
            borderRadius: 99, paddingHorizontal: 16, paddingVertical: 5,
            backgroundColor: 'rgba(246,195,88,0.14)',
            borderWidth: 1, borderColor: 'rgba(246,195,88,0.32)',
            marginBottom: 18,
          }}>
            <Text style={{
              fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
              textTransform: 'uppercase', color: '#f6c358',
            }}>
              {nextPrayerName ? `${nextPrayerName} Vaktine Kalan` : 'Bir Sonraki Namaz'}
            </Text>
          </View>

          {/* Big countdown */}
          <Text style={{
            fontSize: 54, fontWeight: '900', letterSpacing: -1,
            color: '#ffffff', textAlign: 'center',
          }}>
            {targetTimeRef.current ? remainingTime : '--:--:--'}
          </Text>

          {/* Sub label */}
          {nextPrayerName && data?.times && (
            <Text style={{
              color: 'rgba(255,255,255,0.8)', fontSize: 13,
              marginTop: 8, fontWeight: '600', letterSpacing: 0.5,
            }}>
              {nextPrayerName} ·{' '}
              {nextPrayerName === 'İmsak' ? data.times.imsak
                : nextPrayerName === 'Güneş'  ? data.times.gunes
                : nextPrayerName === 'Öğle'   ? data.times.ogle
                : nextPrayerName === 'İkindi' ? data.times.ikindi
                : nextPrayerName === 'Akşam'  ? data.times.aksam
                : data.times.yatsi}
            </Text>
          )}

          {/* Progress bar */}
          {progressPct > 0 && (
            <View style={{
              marginTop: 22, height: 3, width: '78%',
              borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%', width: `${progressPct}%`,
                backgroundColor: '#ffffff', borderRadius: 99,
              }} />
            </View>
          )}
        </View>
      </View>

      {/* ╔══════════════════════════════╗
          ║   PRAYER TIMES GRID          ║
          ╚══════════════════════════════╝ */}
      <View style={{
        borderRadius: 24, borderWidth: 1,
        borderColor: colors.gridBorder,
        backgroundColor: colors.gridBg,
        padding: 14, marginBottom: 12,
      }}>
        {loading && !data ? (
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <ActivityIndicator size="large" color={colors.teal} />
            <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 13 }}>
              Vakitler yükleniyor...
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
            {prayers.map((item) => {
              const isNext = item.label === nextPrayerName;
              return (
                <View key={item.key} style={{
                  width: '31%', alignItems: 'center',
                  borderRadius: 16, paddingVertical: 12,
                  backgroundColor: isNext ? colors.gridItemActive : colors.gridItemBg,
                  borderWidth: 1,
                  borderColor: isNext ? colors.gridActiveBorder : isDark ? 'rgba(255,255,255,0.06)' : colors.cardBorder,
                  ...(isNext && {
                    shadowColor: colors.teal, shadowOpacity: isDark ? 0.45 : 0.15,
                    shadowRadius: 12, shadowOffset: { width: 0, height: 2 },
                  }),
                }}>
                  <Ionicons
                    name={PRAYER_ICONS[item.label]}
                    size={17}
                    color={isNext ? colors.teal : colors.textMuted}
                    style={{ marginBottom: 5 }}
                  />
                  <Text style={{
                    fontSize: 9, fontWeight: '700', letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: isNext ? colors.teal : colors.textMuted,
                    marginBottom: 3,
                  }}>
                    {item.label}
                  </Text>
                  <Text style={{
                    fontSize: 15, fontWeight: '800',
                    color: isNext ? colors.textPrimary : colors.textSecondary,
                  }}>
                    {item.time}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ╔══════════════════════════════╗
          ║   LOCATION & NOTIFICATIONS   ║
          ╚══════════════════════════════╝ */}
      <View style={{
        borderRadius: 20, borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.card, overflow: 'hidden',
      }}>
        {/* Location Row */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('LocationSelection');
          }}
          style={{
            flexDirection: 'row', alignItems: 'center', padding: 14,
            borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.cardBorder,
          }}>
          <View style={{
            height: 34, width: 34, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim,
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name="location-outline" size={17} color={colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
              Konum
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
              {selectedState && selectedDistrict
                ? `${selectedState.name} — ${selectedDistrict.name}`
                : selectedDistrict ? selectedDistrict.name : 'Konum seçin'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Notifications Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
          <View style={{
            height: 34, width: 34, borderRadius: 10,
            backgroundColor: isDark ? 'rgba(246,195,88,0.14)' : colors.goldDim,
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name="notifications-outline" size={17} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
              Bildirimler
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>
              Vakit girişinde ve 30dk önce bildirim al
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: isDark ? 'rgba(255,255,255,0.10)' : colors.cardBorder, true: colors.teal }}
            thumbColor={notificationsEnabled ? '#fff' : isDark ? colors.textMuted : '#fff'}
            ios_backgroundColor={isDark ? 'rgba(255,255,255,0.10)' : colors.cardBorder}
          />
        </View>
      </View>
    </View>
  );
}
