import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useThemeStore } from '@/store/theme.store';

const PRAYERS = [
  { key: 'fajr', label: 'Sabah', icon: 'moon-outline' as const, color: '#1e293b' },
  { key: 'dhuhr', label: 'Öğle', icon: 'sunny' as const, color: '#0ea5e9' },
  { key: 'asr', label: 'İkindi', icon: 'partly-sunny' as const, color: '#f59e0b' },
  { key: 'maghrib', label: 'Akşam', icon: 'moon' as const, color: '#4f46e5' },
  { key: 'isha', label: 'Yatsı', icon: 'star-outline' as const, color: '#0f172a' },
];

function formatMissedDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getPrayerLabel(key: string) {
  return PRAYERS.find((p) => p.key === key)?.label || key;
}

function getPrayerColor(key: string) {
  return PRAYERS.find((p) => p.key === key)?.color || '#0f766e';
}

function AddKazaModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (prayer: string, date: string) => void;
}) {
  const { isDark } = useThemeStore();
  const [selectedPrayer, setSelectedPrayer] = useState('fajr');
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i - 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-[32px] border-t border-slate-200 bg-white p-6 pb-10 dark:border-slate-700 dark:bg-slate-800/70">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-900 dark:text-white">
              Kaza Namaz Ekle
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/40">
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
          </View>

          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">
            Namaz Vakti
          </Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {PRAYERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPrayer(p.key);
                }}
                className={`rounded-2xl border px-4 py-2.5 ${
                  selectedPrayer === p.key
                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    selectedPrayer === p.key
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-slate-500 dark:text-slate-300'
                  }`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">
            Hangi Gün?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 mb-6">
            {dates.map((d) => {
              const dateObj = new Date(d);
              const day = dateObj.toLocaleDateString('tr-TR', { weekday: 'short' });
              const num = dateObj.getDate();
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDate(d);
                  }}
                  className={`mx-1 w-14 items-center rounded-2xl border py-3 ${
                    selectedDate === d
                      ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/15'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40'
                  }`}>
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      selectedDate === d
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-500 dark:text-slate-300'
                    }`}>
                    {day}
                  </Text>
                  <Text
                    className={`text-lg font-black ${
                      selectedDate === d
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onAdd(selectedPrayer, selectedDate);
              onClose();
            }}
            className="items-center rounded-2xl bg-teal-600 py-4 dark:bg-teal-500">
            <Text className="text-base font-black text-white">Listeye Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function KazaItem({
  item,
  onComplete,
  onDelete,
}: {
  item: any;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const { isDark } = useThemeStore();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleComplete = () => {
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    onComplete();
  };

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutUp} layout={Layout.springify()}>
      <Animated.View
        style={[animStyle]}
        className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-700 dark:bg-slate-800/70 dark:shadow-none">
        <View
          className="mr-4 h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${getPrayerColor(item.prayer_time)}18` }}>
          <View
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: getPrayerColor(item.prayer_time) }}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black text-slate-900 dark:text-white">
            {getPrayerLabel(item.prayer_time)} Namazı
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
            {formatMissedDate(item.missed_date)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert('Sil', 'Bu kaza namazı listeden kaldırılsın mı?', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Sil', style: 'destructive', onPress: onDelete },
            ]);
          }}
          className="mr-2 h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
          <Ionicons name="trash-outline" size={16} color={isDark ? '#4b5563' : '#94a3b8'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleComplete}
          className="h-9 w-9 items-center justify-center rounded-xl bg-teal-600 dark:bg-teal-500">
          <Ionicons name="checkmark" size={18} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function KazaTrackerScreen() {
  const { kazaList, kazaCompleted, fetchKazaList, addKaza, completeKaza, deleteKaza } =
    useGamificationStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { isDark } = useThemeStore();

  const load = useCallback(async () => {
    setLoading(true);
    await fetchKazaList();
    setLoading(false);
  }, [fetchKazaList]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (prayer: string, date: string) => {
    try {
      await addKaza(prayer, date);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Hata', 'Bu kaza namazı zaten listede olabilir.');
    }
  };

  const handleComplete = async (id: string, prayerLabel: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const pts = await completeKaza(id);
      Alert.alert('MaşAllah! 🎉', `${prayerLabel} kazası kılındı. +${pts} puan kazandın!`);
    } catch {
      Alert.alert('Hata', 'Kaza tamamlanamadı.');
    }
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteKaza(id);
  };

  const totalPending = kazaList.length;
  const progressPercent =
    kazaCompleted + totalPending > 0
      ? Math.round((kazaCompleted / (kazaCompleted + totalPending)) * 100)
      : 0;

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
            colors={[isDark ? '#14b8a6' : '#0f766e']}
          />
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>
        <View className="mx-4 mb-6 overflow-hidden rounded-[28px] bg-teal-700 p-5 dark:bg-teal-900">
          <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-teal-500/20" />
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-white">{totalPending}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-teal-100 dark:text-teal-400/80">
                Bekleyen Kaza
              </Text>
            </View>
            <View className="h-10 w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">{kazaCompleted}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-teal-100 dark:text-teal-400/80">
                Tamamlanan
              </Text>
            </View>
            <View className="h-10 w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">%{progressPercent}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-teal-100 dark:text-teal-400/80">
                İlerleme
              </Text>
            </View>
          </View>

          {kazaCompleted + totalPending > 0 && (
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <View
                className="h-full rounded-full bg-white"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          )}
        </View>

        <View className="px-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-900 dark:text-white">Kaza Listesi</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModal(true);
              }}
              className="flex-row items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 dark:bg-teal-500">
              <Ionicons name="add" size={18} color="#fff" />
              <Text className="text-sm font-bold text-white">Ekle</Text>
            </TouchableOpacity>
          </View>

          {kazaList.length === 0 && !loading ? (
            <View className="items-center rounded-[28px] border border-slate-200 bg-white py-16 dark:border-slate-700 dark:bg-slate-800/70">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={40}
                  color={isDark ? '#34d399' : '#10b981'}
                />
              </View>
              <Text className="text-lg font-black text-slate-900 dark:text-white">Tebrikler!</Text>
              <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-300">
                Hiç bekleyen kaza namazın yok.{'\n'}Elhamdülillah!
              </Text>
            </View>
          ) : (
            kazaList.map((item) => (
              <KazaItem
                key={item.id}
                item={item}
                onComplete={() => handleComplete(item.id, getPrayerLabel(item.prayer_time))}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddKazaModal visible={showModal} onClose={() => setShowModal(false)} onAdd={handleAdd} />
    </Screen>
  );
}
