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

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const PRAYERS = [
  { key: 'fajr',    label: 'Sabah',  icon: 'moon-outline'   as const, color: '#1e293b' },
  { key: 'sunrise', label: 'Güneş',  icon: 'sunny-outline'  as const, color: '#fb923c' },
  { key: 'dhuhr',   label: 'Öğle',   icon: 'sunny'          as const, color: '#0ea5e9' },
  { key: 'asr',     label: 'İkindi', icon: 'partly-sunny'   as const, color: '#f59e0b' },
  { key: 'maghrib', label: 'Akşam',  icon: 'moon'           as const, color: '#4f46e5' },
  { key: 'isha',    label: 'Yatsı',  icon: 'star-outline'   as const, color: '#0f172a' },
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

// ─────────────────────────────────────────────
// ADD KAZA MODAL
// ─────────────────────────────────────────────
function AddKazaModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (prayer: string, date: string) => void;
}) {
  const [selectedPrayer, setSelectedPrayer] = useState('fajr');
  // Last 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i - 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-[32px] bg-white p-6 pb-10">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-800">Kaza Namaz Ekle</Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Prayer Selection */}
          <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">
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
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-slate-100 bg-slate-50'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    selectedPrayer === p.key ? 'text-primary-700' : 'text-slate-500'
                  }`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Selection */}
          <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400">
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
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-slate-100 bg-slate-50'
                  }`}>
                  <Text
                    className={`text-[10px] font-bold uppercase ${
                      selectedDate === d ? 'text-primary-500' : 'text-slate-400'
                    }`}>
                    {day}
                  </Text>
                  <Text
                    className={`text-lg font-black ${
                      selectedDate === d ? 'text-primary-700' : 'text-slate-700'
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
            className="items-center rounded-2xl bg-primary-600 py-4">
            <Text className="text-base font-black text-white">Listeye Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// KAZA ITEM
// ─────────────────────────────────────────────
function KazaItem({
  item,
  onComplete,
  onDelete,
}: {
  item: any;
  onComplete: () => void;
  onDelete: () => void;
}) {
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
        style={animStyle}
        className="mb-3 flex-row items-center rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
        {/* Color dot */}
        <View
          className="mr-4 h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${getPrayerColor(item.prayer_time)}18` }}>
          <View
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: getPrayerColor(item.prayer_time) }}
          />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black text-slate-800">
            {getPrayerLabel(item.prayer_time)} Namazı
          </Text>
          <Text className="mt-0.5 text-xs text-slate-400">
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
          className="mr-2 h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
          <Ionicons name="trash-outline" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleComplete}
          className="h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
          <Ionicons name="checkmark" size={18} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function KazaTrackerScreen() {
  const { kazaList, kazaCompleted, fetchKazaList, addKaza, completeKaza, deleteKaza } =
    useGamificationStore();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    <Screen className="bg-slate-50" safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>
        {/* Stats Banner */}
        <View className="mx-4 mb-6 overflow-hidden rounded-[28px] bg-primary-700 p-5">
          <View className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-black text-white">{totalPending}</Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary-200">
                Bekleyen Kaza
              </Text>
            </View>
            <View className="h-10 w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">{kazaCompleted}</Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary-200">
                Tamamlanan
              </Text>
            </View>
            <View className="h-10 w-[1px] bg-white/10" />
            <View>
              <Text className="text-2xl font-black text-white">%{progressPercent}</Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-primary-200">
                İlerleme
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {kazaCompleted + totalPending > 0 && (
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <View
                className="h-full rounded-full bg-white"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          )}
        </View>

        {/* List */}
        <View className="px-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-800">Kaza Listesi</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModal(true);
              }}
              className="flex-row items-center gap-2 rounded-2xl bg-primary-600 px-4 py-2.5">
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-sm font-bold text-white">Ekle</Text>
            </TouchableOpacity>
          </View>

          {kazaList.length === 0 && !loading ? (
            <View className="items-center rounded-[28px] border border-slate-100 bg-white py-16">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="checkmark-circle-outline" size={40} color="#10b981" />
              </View>
              <Text className="text-lg font-black text-slate-700">Tebrikler!</Text>
              <Text className="mt-1 text-center text-sm text-slate-400">
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

      <AddKazaModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAdd}
      />
    </Screen>
  );
}
