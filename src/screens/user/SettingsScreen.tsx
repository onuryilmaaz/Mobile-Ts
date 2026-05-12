import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/theme.store';
import { notificationService } from '@/services/notification.service';
import * as Haptics from 'expo-haptics';

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
  const { toggleTheme } = useThemeStore();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [offset, setOffset] = useState(15);
  const [prayerEnabled, setPrayerEnabled] = useState({
    imsak: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true,
  });

  const load = useCallback(async () => {
    const [en, off, prayers] = await Promise.all([
      notificationService.isEnabled(),
      notificationService.getOffset(),
      notificationService.getPrayerEnabled(),
    ]);
    setNotifEnabled(en);
    setOffset(off);
    setPrayerEnabled(prayers);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleMaster = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert('İzin Gerekli', 'Lütfen Ayarlar > Bildirimler\'den izin verin.');
        return;
      }
      await notificationService.enableNotifications();
    } else {
      await notificationService.disableNotifications();
    }
    setNotifEnabled(val);
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
    if (sent) Alert.alert('Gönderildi', 'Test bildirimi birkaç saniye içinde gelecek.');
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
            <View className="px-4 pt-3 pb-1">
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
                      backgroundColor: offset === min ? teal : (isDark ? '#0f172a' : '#f1f5f9'),
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

      {/* Görünüm */}
      <Section title="Görünüm" />
      <View className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white dark:border-white/[7%] dark:bg-slate-800">
        <Row
          icon={isDark ? 'moon' : 'sunny'}
          iconColor="#f59e0b"
          label="Tema"
          sublabel={isDark ? 'Karanlık mod aktif' : 'Aydınlık mod aktif'}
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
