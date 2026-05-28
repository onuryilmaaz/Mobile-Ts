/* eslint-disable @typescript-eslint/no-require-imports */
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { alert } from '@/store/alert.store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/modules/auth/auth.store';
import {
  notificationService,
  DEFAULT_REMINDER_INTERVAL,
  DEFAULT_BLACKOUT_START,
  DEFAULT_BLACKOUT_END,
} from '@/services/notification.service';
import { adhanService } from '@/services/adhan.service';
import type { AdhanPrayerKey } from '@/services/adhan.service';
import { useAdhanStore } from '@/services/adhan.store';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  getDistrictById,
  getStateById,
  getStateByName,
  getDefaultDistrictForState,
} from '@/constants/locations';
import { rootNavigate } from '@/navigation/rootNavigation';

const STORAGE_STATE_ID_KEY = 'SELECTED_STATE_ID';
const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';

const PRAYERS = [
  { key: 'imsak' as const, label: 'İmsak' },
  { key: 'gunes' as const, label: 'Güneş' },
  { key: 'ogle' as const, label: 'Öğle' },
  { key: 'ikindi' as const, label: 'İkindi' },
  { key: 'aksam' as const, label: 'Akşam' },
  { key: 'yatsi' as const, label: 'Yatsı' },
];

const OFFSETS = [0, 5, 10, 15, 30];

export default function SettingsScreen() {
  const { isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const showAdhan = useAdhanStore((s) => s.show);

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [offset, setOffset] = useState(15);
  const [prayerEnabled, setPrayerEnabled] = useState({
    imsak: true,
    gunes: false,
    ogle: true,
    ikindi: true,
    aksam: true,
    yatsi: true,
  });

  const [adhanPrayers, setAdhanPrayers] = useState<Record<AdhanPrayerKey, boolean>>({
    imsak: true,
    gunes: false,
    ogle: true,
    ikindi: true,
    aksam: true,
    yatsi: true,
  });

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderInterval, setReminderInterval] = useState(DEFAULT_REMINDER_INTERVAL);
  const [blackoutStart, setBlackoutStart] = useState(DEFAULT_BLACKOUT_START);
  const [blackoutEnd, setBlackoutEnd] = useState(DEFAULT_BLACKOUT_END);

  const [districtId, setDistrictId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const district = districtId ? getDistrictById(districtId) : null;
  const state = stateId ? getStateById(stateId) : null;

  const load = useCallback(async () => {
    const [en, off, prayers, adhan, savedStateId, savedDistrictId, remEn, remInt, blackout] =
      await Promise.all([
        notificationService.isEnabled(),
        notificationService.getOffset(),
        notificationService.getPrayerEnabled(),
        adhanService.getAdhanPrayers(),
        AsyncStorage.getItem(STORAGE_STATE_ID_KEY),
        AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY),
        notificationService.getReminderEnabled(),
        notificationService.getReminderInterval(),
        notificationService.getReminderBlackout(),
      ]);
    setNotifEnabled(en);
    setOffset(off);
    setPrayerEnabled(prayers);
    setAdhanPrayers(adhan);
    if (savedStateId) setStateId(savedStateId);
    if (savedDistrictId) setDistrictId(savedDistrictId);
    setReminderEnabled(remEn);
    setReminderInterval(remInt);
    setBlackoutStart(blackout.start);
    setBlackoutEnd(blackout.end);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const autoDetect = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert.warning('İzin Gerekli', 'Konum izni verilmedi.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const regionRaw = geo[0]?.region ?? geo[0]?.city ?? '';
      const normalize = (s: string) =>
        s
          .toUpperCase()
          .replace(/İ/g, 'I')
          .replace(/Ğ/g, 'G')
          .replace(/Ş/g, 'S')
          .replace(/Ç/g, 'C')
          .replace(/Ö/g, 'O')
          .replace(/Ü/g, 'U');
      const found =
        getStateByName(regionRaw) ??
        (() => {
          const { STATES } = require('@/constants/locations');
          const normRegion = normalize(regionRaw);
          return (STATES as any[]).find(
            (s: any) => normalize(s.name) === normRegion || normalize(s.name_en) === normRegion
          );
        })();
      if (!found) {
        alert.warning('Bulunamadı', 'Konumunuz tanınamadı, lütfen elle seçin.');
        return;
      }
      const d = getDefaultDistrictForState(found._id);
      if (!d) return;
      await AsyncStorage.setItem(STORAGE_STATE_ID_KEY, found._id);
      await AsyncStorage.setItem(STORAGE_DISTRICT_ID_KEY, d._id);
      setStateId(found._id);
      setDistrictId(d._id);
    } catch {
      alert.error('Hata', 'Konum alınamadı.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const toggleMaster = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        alert.warning('İzin Gerekli', "Lütfen Ayarlar > Bildirimler'den izin verin.");
        return;
      }
      await notificationService.enableNotifications();
    } else {
      await notificationService.disableNotifications();
    }
    setNotifEnabled(val);
  };

  const toggleAdhanPrayer = async (key: AdhanPrayerKey, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await adhanService.setAdhanPrayer(key, val);
    setAdhanPrayers((p) => ({ ...p, [key]: val }));
  };

  const togglePrayer = async (key: keyof typeof prayerEnabled, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.setPrayerEnabled(key, val);
    setPrayerEnabled((p) => ({ ...p, [key]: val }));
  };

  const changeOffset = async (min: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.setOffset(min);
    setOffset(min);
  };

  const testNotif = async () => {
    const sent = await notificationService.sendTestNotification();
    if (sent) alert.success('Gönderildi', 'Test bildirimi birkaç saniye içinde gelecek.');
  };

  const toggleReminder = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.setReminderEnabled(val);
    setReminderEnabled(val);
  };

  const changeReminderInterval = async (hours: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.setReminderInterval(hours);
    setReminderInterval(hours);
  };

  const changeBlackoutHour = async (
    type: 'start' | 'end',
    delta: number,
    current: number,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = (current + delta + 24) % 24;
    if (type === 'start') {
      setBlackoutStart(next);
      await notificationService.setReminderBlackout(next, blackoutEnd);
    } else {
      setBlackoutEnd(next);
      await notificationService.setReminderBlackout(blackoutStart, next);
    }
  };

  const sub = isDark ? '#64748b' : '#94a3b8';
  const teal = isDark ? '#14b8a6' : '#0f766e';

  const Section = ({ title }: { title: string }) => (
    <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {title}
    </Text>
  );

  const Row = ({
    icon,
    iconColor,
    label,
    sublabel,
    right,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    label: string;
    sublabel?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="flex-row items-center border-b border-slate-100 px-4 py-3.5 dark:border-white/[7%]">
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${iconColor}18` }}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-bold ${danger ? 'text-red-500' : 'text-slate-950 dark:text-slate-100'}`}>
          {label}
        </Text>
        {sublabel && (
          <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sublabel}</Text>
        )}
      </View>
      {right}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      {/* Konum */}
      <Section title="Konum" />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="location-outline"
          iconColor={teal}
          label="Namaz Vakti Konumu"
          sublabel={
            state && district
              ? `${state.name} — ${district.name}`
              : (district?.name ?? 'Konum seçilmedi')
          }
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            rootNavigate('UserTabs', {
              screen: 'Home',
              params: { screen: 'LocationSelection' },
            } as any);
          }}
          right={<Ionicons name="chevron-forward" size={16} color={sub} />}
        />
        <Row
          icon="navigate-outline"
          iconColor="#3b82f6"
          label="Otomatik Algıla"
          sublabel={detectingLocation ? 'Konum alınıyor…' : 'GPS ile şehrini otomatik bul'}
          onPress={detectingLocation ? undefined : autoDetect}
          right={
            detectingLocation ? (
              <Ionicons name="sync-outline" size={16} color="#3b82f6" />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={sub} />
            )
          }
        />
      </View>

      {/* Bildirimler */}
      <Section title="Bildirimler" />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="notifications-outline"
          iconColor={teal}
          label="Namaz Vakti Bildirimleri"
          sublabel="Namaz vakitlerinde hatırlatma al"
          right={
            <Switch
              value={notifEnabled}
              onValueChange={toggleMaster}
              trackColor={{ false: '#334155', true: teal }}
              thumbColor="#fff"
            />
          }
        />

        {notifEnabled && (
          <>
            <View className="px-4 pb-1 pt-3">
              <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                Kaç dakika önce hatırlatılsın?
              </Text>
              <View className="flex-row gap-2">
                {OFFSETS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => changeOffset(min)}
                    className="rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: offset === min ? teal : isDark ? '#0f172a' : '#f1f5f9',
                    }}>
                    <Text
                      className="text-xs font-black"
                      style={{ color: offset === min ? '#fff' : sub }}>
                      {min === 0 ? 'Tam Vakit' : `${min} dk`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mt-2 px-4 pb-2">
              <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                Hangi namazlar için?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PRAYERS.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => togglePrayer(p.key, !prayerEnabled[p.key])}
                    className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: prayerEnabled[p.key]
                        ? `${teal}20`
                        : isDark
                          ? '#0f172a'
                          : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: prayerEnabled[p.key] ? teal : 'transparent',
                    }}>
                    <Ionicons
                      name={prayerEnabled[p.key] ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={prayerEnabled[p.key] ? teal : sub}
                    />
                    <Text
                      className="text-xs font-bold"
                      style={{ color: prayerEnabled[p.key] ? teal : sub }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Row
              icon="flask-outline"
              iconColor="#8b5cf6"
              label="Test Bildirimi Gönder"
              sublabel="Bildirimlerin çalışıp çalışmadığını test et"
              onPress={testNotif}
              right={<Ionicons name="chevron-forward" size={16} color={sub} />}
            />
          </>
        )}
      </View>

      {/* Ayet & Hadis Bildirimleri */}
      <Section title="Ayet & Hadis Bildirimleri" />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="book-outline"
          iconColor="#a855f7"
          label="Ayet & Hadis Bildirimleri"
          sublabel="Gün boyunca manevi hatırlatmalar al"
          right={
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ false: '#334155', true: '#a855f7' }}
              thumbColor="#fff"
            />
          }
        />

        {reminderEnabled && (
          <>
            {/* Interval */}
            <View className="border-t border-slate-100 px-4 pb-3 pt-3 dark:border-white/[7%]">
              <Text className="mb-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                Kaç saatte bir gönderilsin?
              </Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 6].map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => changeReminderInterval(h)}
                    className="rounded-xl px-3.5 py-2"
                    style={{
                      backgroundColor:
                        reminderInterval === h ? '#a855f7' : isDark ? '#0f172a' : '#f1f5f9',
                    }}>
                    <Text
                      className="text-xs font-black"
                      style={{ color: reminderInterval === h ? '#fff' : sub }}>
                      {h === 1 ? 'Her saat' : `${h} saatte`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blackout */}
            <View className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-white/[7%]">
              <Text className="mb-3 text-xs font-bold text-slate-400 dark:text-slate-500">
                Bu saatler arasında gönderme
              </Text>
              <View className="flex-row items-center gap-3">
                {/* Start */}
                <View className="flex-1 items-center gap-1.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Başlangıç
                  </Text>
                  <View
                    className="flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                    <TouchableOpacity
                      onPress={() => changeBlackoutHour('start', -1, blackoutStart)}
                      hitSlop={8}>
                      <Ionicons name="chevron-back" size={16} color={sub} />
                    </TouchableOpacity>
                    <Text className="w-12 text-center text-sm font-black text-slate-900 dark:text-white">
                      {String(blackoutStart).padStart(2, '0')}:00
                    </Text>
                    <TouchableOpacity
                      onPress={() => changeBlackoutHour('start', 1, blackoutStart)}
                      hitSlop={8}>
                      <Ionicons name="chevron-forward" size={16} color={sub} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Ionicons name="arrow-forward" size={14} color={sub} />

                {/* End */}
                <View className="flex-1 items-center gap-1.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Bitiş
                  </Text>
                  <View
                    className="flex-row items-center gap-2 rounded-2xl px-3 py-2.5"
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                    <TouchableOpacity
                      onPress={() => changeBlackoutHour('end', -1, blackoutEnd)}
                      hitSlop={8}>
                      <Ionicons name="chevron-back" size={16} color={sub} />
                    </TouchableOpacity>
                    <Text className="w-12 text-center text-sm font-black text-slate-900 dark:text-white">
                      {String(blackoutEnd).padStart(2, '0')}:00
                    </Text>
                    <TouchableOpacity
                      onPress={() => changeBlackoutHour('end', 1, blackoutEnd)}
                      hitSlop={8}>
                      <Ionicons name="chevron-forward" size={16} color={sub} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Özet */}
              <Text className="mt-2.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
                {String(blackoutStart).padStart(2, '0')}:00 –{' '}
                {String(blackoutEnd).padStart(2, '0')}:00 arası bildirim gönderilmez
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Ezan Sesi */}
      <Section title="Ezan Sesi" />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <View className="border-b border-slate-100 px-4 py-3.5 dark:border-white/[7%]">
          <View className="flex-row items-center gap-3">
            <View
              className="mr-0 h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: '#f59e0b18' }}>
              <Ionicons name="volume-high-outline" size={18} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-950 dark:text-slate-100">
                Namaz Vaktinde Ezan Sesi
              </Text>
              <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Uygulama açıkken ezan çalar, &rdquo;Ezanı Kapat&rdquo; ile durdurabilirsin
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 pb-4 pt-3">
          <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            Hangi vakitlerde ezan çalsın?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRAYERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() =>
                  toggleAdhanPrayer(p.key as AdhanPrayerKey, !adhanPrayers[p.key as AdhanPrayerKey])
                }
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: adhanPrayers[p.key as AdhanPrayerKey]
                    ? '#f59e0b20'
                    : isDark
                      ? '#0f172a'
                      : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: adhanPrayers[p.key as AdhanPrayerKey] ? '#f59e0b' : 'transparent',
                }}>
                <Ionicons
                  name={
                    adhanPrayers[p.key as AdhanPrayerKey] ? 'checkmark-circle' : 'ellipse-outline'
                  }
                  size={14}
                  color={adhanPrayers[p.key as AdhanPrayerKey] ? '#f59e0b' : sub}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: adhanPrayers[p.key as AdhanPrayerKey] ? '#f59e0b' : sub }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isAdmin && (
          <Row
            icon="flask-outline"
            iconColor="#8b5cf6"
            label="Ezan Sesini Test Et"
            sublabel="Admin — her vakit farklı ezan çalar"
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              alert.show({
                type: 'info',
                title: 'Ezan Testi',
                message: 'Hangi vaktin ezanını test etmek istiyorsun?',
                buttons: [
                  {
                    text: 'İmsak',
                    style: 'default',
                    onPress: async () => {
                      await adhanService.playAdhan('imsak');
                      showAdhan('imsak', 'İmsak');
                    },
                  },
                  {
                    text: 'Öğle',
                    style: 'default',
                    onPress: async () => {
                      await adhanService.playAdhan('ogle');
                      showAdhan('ogle', 'Öğle');
                    },
                  },
                  {
                    text: 'İkindi',
                    style: 'default',
                    onPress: async () => {
                      await adhanService.playAdhan('ikindi');
                      showAdhan('ikindi', 'İkindi');
                    },
                  },
                  {
                    text: 'Akşam',
                    style: 'default',
                    onPress: async () => {
                      await adhanService.playAdhan('aksam');
                      showAdhan('aksam', 'Akşam');
                    },
                  },
                  {
                    text: 'Yatsı',
                    style: 'default',
                    onPress: async () => {
                      await adhanService.playAdhan('yatsi');
                      showAdhan('yatsi', 'Yatsı');
                    },
                  },
                  { text: 'Durdur', style: 'destructive', onPress: () => adhanService.stop() },
                  { text: 'İptal', style: 'cancel' },
                ],
              });
            }}
            right={<Ionicons name="chevron-forward" size={16} color={sub} />}
          />
        )}
      </View>

      {/* Dil Seçimi */}
      {/* <Section title={t('settings.sections.language')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="language-outline"
          iconColor="#8b5cf6"
          label={t('settings.language.title')}
          sublabel={t('settings.language.sub')}
          right={
            <View className="mr-2 flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage('tr');
                }}
                className="rounded-xl px-3 py-1.5"
                style={{
                  backgroundColor: language === 'tr' ? teal : isDark ? '#0f172a' : '#f1f5f9',
                }}>
                <Text
                  className="text-xs font-bold"
                  style={{ color: language === 'tr' ? '#fff' : sub }}>
                  {t('settings.language.tr')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage('en');
                }}
                className="rounded-xl px-3 py-1.5"
                style={{
                  backgroundColor: language === 'en' ? teal : isDark ? '#0f172a' : '#f1f5f9',
                }}>
                <Text
                  className="text-xs font-bold"
                  style={{ color: language === 'en' ? '#fff' : sub }}>
                  {t('settings.language.en')}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View> */}

      {/* Uygulama */}
      <Section title="Uygulama" />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="information-circle-outline"
          iconColor="#3b82f6"
          label="Sürüm"
          sublabel="Salah v1.0.0"
        />
        <Row
          icon="heart-outline"
          iconColor="#ef4444"
          label="Geliştirici"
          sublabel="Hayırlı işler için yapıldı 🤲"
        />
      </View>
    </ScrollView>
  );
}
