import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/theme.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { notificationService } from '@/services/notification.service';
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
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/store/language.store';

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
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { isDark } = useTheme();
  const { toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const showAdhan = useAdhanStore((s) => s.show);

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [offset, setOffset] = useState(15);
  const [prayerEnabled, setPrayerEnabled] = useState({
    imsak: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true,
  });

  const [adhanPrayers, setAdhanPrayers] = useState<Record<AdhanPrayerKey, boolean>>({
    imsak: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true,
  });

  const [districtId, setDistrictId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const district = districtId ? getDistrictById(districtId) : null;
  const state = stateId ? getStateById(stateId) : null;

  const load = useCallback(async () => {
    const [en, off, prayers, adhan, savedStateId, savedDistrictId] = await Promise.all([
      notificationService.isEnabled(),
      notificationService.getOffset(),
      notificationService.getPrayerEnabled(),
      adhanService.getAdhanPrayers(),
      AsyncStorage.getItem(STORAGE_STATE_ID_KEY),
      AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY),
    ]);
    setNotifEnabled(en);
    setOffset(off);
    setPrayerEnabled(prayers);
    setAdhanPrayers(adhan);
    if (savedStateId) setStateId(savedStateId);
    if (savedDistrictId) setDistrictId(savedDistrictId);
  }, []);

  useEffect(() => { load(); }, [load]);

  const autoDetect = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionRequired'), t('settings.location.permissionDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const regionRaw = geo[0]?.region ?? geo[0]?.city ?? '';
      const normalize = (s: string) =>
        s.toUpperCase()
          .replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ş/g, 'S')
          .replace(/Ç/g, 'C').replace(/Ö/g, 'O').replace(/Ü/g, 'U');
      const found = getStateByName(regionRaw) ?? (() => {
        const { STATES } = require('@/constants/locations');
        const normRegion = normalize(regionRaw);
        return (STATES as any[]).find(
          (s: any) => normalize(s.name) === normRegion || normalize(s.name_en) === normRegion
        );
      })();
      if (!found) { Alert.alert(t('settings.location.notFound'), t('settings.location.notFoundSub')); return; }
      const d = getDefaultDistrictForState(found._id);
      if (!d) return;
      await AsyncStorage.setItem(STORAGE_STATE_ID_KEY, found._id);
      await AsyncStorage.setItem(STORAGE_DISTRICT_ID_KEY, d._id);
      setStateId(found._id);
      setDistrictId(d._id);
    } catch {
      Alert.alert(t('common.error'), t('settings.location.errorLoading'));
    } finally {
      setDetectingLocation(false);
    }
  };

  const toggleMaster = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert(t('common.permissionRequired'), t('settings.notifications.testPermissionError'));
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
    if (sent) Alert.alert(t('common.sent'), t('settings.notifications.testSuccess'));
  };

  const sub = isDark ? '#64748b' : '#94a3b8';
  const teal = isDark ? '#14b8a6' : '#0f766e';

  const Section = ({ title }: { title: string }) => (
    <Text className="mb-2 ml-1 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {title}
    </Text>
  );

  const Row = ({
    icon, iconColor, label, sublabel, right, onPress, danger,
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
        <Text className={`text-sm font-bold ${danger ? 'text-red-500' : 'text-slate-950 dark:text-slate-100'}`}>
          {label}
        </Text>
        {sublabel && <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sublabel}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

      {/* Konum */}
      <Section title={t('settings.sections.location')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="location-outline"
          iconColor={teal}
          label={t('settings.location.title')}
          sublabel={
            state && district
              ? `${state.name} — ${district.name}`
              : district?.name ?? t('settings.location.noLocation')
          }
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            rootNavigate('UserTabs', { screen: 'Home', params: { screen: 'LocationSelection' } } as any);
          }}
          right={<Ionicons name="chevron-forward" size={16} color={sub} />}
        />
        <Row
          icon="navigate-outline"
          iconColor="#3b82f6"
          label={t('settings.location.autoDetect')}
          sublabel={detectingLocation ? t('settings.location.detecting') : t('settings.location.autoDetectSub')}
          onPress={detectingLocation ? undefined : autoDetect}
          right={
            detectingLocation
              ? <Ionicons name="sync-outline" size={16} color="#3b82f6" />
              : <Ionicons name="chevron-forward" size={16} color={sub} />
          }
        />
      </View>

      {/* Bildirimler */}
      <Section title={t('settings.sections.notifications')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="notifications-outline"
          iconColor={teal}
          label={t('settings.notifications.title')}
          sublabel={t('settings.notifications.subtitle')}
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
            <View className="px-4 pt-3 pb-1">
              <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                {t('settings.notifications.offsetTitle')}
              </Text>
              <View className="flex-row gap-2">
                {OFFSETS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => changeOffset(min)}
                    className="rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: offset === min ? teal : (isDark ? '#0f172a' : '#f1f5f9'),
                    }}>
                    <Text
                      className="text-xs font-black"
                      style={{ color: offset === min ? '#fff' : sub }}>
                      {min === 0 ? t('settings.notifications.onTime') : t('settings.notifications.minutes', { count: min })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mt-2 px-4 pb-2">
              <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
                {t('settings.notifications.prayersTitle')}
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
                        : (isDark ? '#0f172a' : '#f1f5f9'),
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
                      {t(`prayers.${p.key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Row
              icon="flask-outline"
              iconColor="#8b5cf6"
              label={t('settings.notifications.testTitle')}
              sublabel={t('settings.notifications.testSub')}
              onPress={testNotif}
              right={<Ionicons name="chevron-forward" size={16} color={sub} />}
            />
          </>
        )}
      </View>

      {/* Ezan Sesi */}
      <Section title={t('settings.sections.adhanSound')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <View className="border-b border-slate-100 px-4 py-3.5 dark:border-white/[7%]">
          <View className="flex-row items-center gap-3">
            <View className="mr-0 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: '#f59e0b18' }}>
              <Ionicons name="volume-high-outline" size={18} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-950 dark:text-slate-100">{t('settings.adhan.title')}</Text>
              <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {t('settings.adhan.subtitle')}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-3 pb-4">
          <Text className="mb-2 text-xs font-bold text-slate-400 dark:text-slate-500">
            {t('settings.adhan.prayersTitle')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRAYERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => toggleAdhanPrayer(p.key as AdhanPrayerKey, !adhanPrayers[p.key as AdhanPrayerKey])}
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                style={{
                  backgroundColor: adhanPrayers[p.key as AdhanPrayerKey]
                    ? '#f59e0b20'
                    : (isDark ? '#0f172a' : '#f1f5f9'),
                  borderWidth: 1,
                  borderColor: adhanPrayers[p.key as AdhanPrayerKey] ? '#f59e0b' : 'transparent',
                }}>
                <Ionicons
                  name={adhanPrayers[p.key as AdhanPrayerKey] ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={adhanPrayers[p.key as AdhanPrayerKey] ? '#f59e0b' : sub}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: adhanPrayers[p.key as AdhanPrayerKey] ? '#f59e0b' : sub }}>
                  {t(`prayers.${p.key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isAdmin && (
          <Row
            icon="flask-outline"
            iconColor="#8b5cf6"
            label={t('settings.adhan.testTitle')}
            sublabel={t('settings.adhan.testSub')}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(t('settings.adhan.testModalTitle'), t('settings.adhan.testModalSub'), [
                { text: t('prayers.imsak'), onPress: async () => { await adhanService.playAdhan('imsak'); showAdhan('imsak', t('prayers.imsak')); } },
                { text: t('prayers.ogle'), onPress: async () => { await adhanService.playAdhan('ogle'); showAdhan('ogle', t('prayers.ogle')); } },
                { text: t('prayers.ikindi'), onPress: async () => { await adhanService.playAdhan('ikindi'); showAdhan('ikindi', t('prayers.ikindi')); } },
                { text: t('prayers.aksam'), onPress: async () => { await adhanService.playAdhan('aksam'); showAdhan('aksam', t('prayers.aksam')); } },
                { text: t('prayers.yatsi'), onPress: async () => { await adhanService.playAdhan('yatsi'); showAdhan('yatsi', t('prayers.yatsi')); } },
                { text: t('common.stop'), style: 'destructive', onPress: () => adhanService.stop() },
                { text: t('common.cancel'), style: 'cancel' },
              ]);
            }}
            right={<Ionicons name="chevron-forward" size={16} color={sub} />}
          />
        )}
      </View>

      {/* Görünüm */}
      <Section title={t('settings.sections.appearance')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon={isDark ? 'moon' : 'sunny'}
          iconColor="#f59e0b"
          label={t('settings.appearance.theme')}
          sublabel={isDark ? t('settings.appearance.darkActive') : t('settings.appearance.lightActive')}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleTheme();
          }}
          right={
            <Switch
              value={isDark}
              onValueChange={() => toggleTheme()}
              trackColor={{ false: '#334155', true: '#475569' }}
              thumbColor={isDark ? '#f59e0b' : '#cbd5e1'}
            />
          }
        />
      </View>

      {/* Dil Seçimi */}
      <Section title={t('settings.sections.language')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="language-outline"
          iconColor="#8b5cf6"
          label={t('settings.language.title')}
          sublabel={t('settings.language.sub')}
          right={
            <View className="flex-row gap-2 mr-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLanguage('tr');
                }}
                className="rounded-xl px-3 py-1.5"
                style={{
                  backgroundColor: language === 'tr' ? teal : (isDark ? '#0f172a' : '#f1f5f9'),
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
                  backgroundColor: language === 'en' ? teal : (isDark ? '#0f172a' : '#f1f5f9'),
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
      </View>

      {/* Uygulama */}
      <Section title={t('settings.sections.application')} />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon="information-circle-outline"
          iconColor="#3b82f6"
          label={t('settings.app.version')}
          sublabel="Salah v1.0.0"
        />
        <Row
          icon="heart-outline"
          iconColor="#ef4444"
          label={t('settings.app.developer')}
          sublabel={t('settings.app.devSub')}
        />
      </View>
    </ScrollView>
  );
}
