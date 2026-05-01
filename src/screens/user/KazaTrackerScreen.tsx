import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  TextInput,
  useColorScheme,
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

  const prayer = PRAYERS.find((p) => p.key === item.prayer_time);

  return (
    <View className="mb-3 flex-row items-center gap-3 overflow-hidden rounded-3xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
      <View
        style={{ backgroundColor: prayer?.color }}
        className="h-12 w-12 items-center justify-center rounded-2xl">
        <Ionicons name={prayer?.icon || 'time-outline'} size={24} color="#fff" />
      </View>

      <View className="flex-1">
        <Text className="text-base font-black text-slate-900 dark:text-white">
          {prayer?.label}
        </Text>
        <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {new Date(item.missed_date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={onComplete}
          className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20">
          <Ionicons
            name="checkmark"
            size={20}
            color={isDark ? '#34d399' : '#10b981'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          className="h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 dark:bg-rose-500/20">
          <Ionicons
            name="trash-outline"
            size={18}
            color={isDark ? '#fb7185' : '#f43f5e'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function KazaWizard({
  visible,
  onClose,
  onBatchAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onBatchAdd: (prayers: string[], count: number) => void;
}) {
  const { isDark } = useThemeStore();
  const [startAge, setStartAge] = useState('13');
  const [regularAge, setRegularAge] = useState('20');
  const [discountPercent, setDiscountPercent] = useState('0'); // Muafiyet veya kılınmış namaz oranı

  const totalYears = Math.max(0, parseInt(regularAge || '0') - parseInt(startAge || '0'));
  let totalDays = totalYears * 365;

  // İndirim (Muafiyet veya zaten kılınanlar)
  const discount = Math.round((totalDays * parseInt(discountPercent || '0')) / 100);
  totalDays = Math.max(0, totalDays - discount);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-[40px] bg-white p-6 pb-12 dark:bg-slate-900">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-black text-slate-900 dark:text-white">Hassas Kaza Hesabı</Text>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buluğ → Düzene Giriş</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="close" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>

          <View className="mb-6 space-y-4">
            <View>
              <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Borcun başladığı yaş (Buluğ):</Text>
              <TextInput
                value={startAge}
                onChangeText={setStartAge}
                keyboardType="numeric"
                className="rounded-2xl bg-slate-50 p-4 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                placeholder="Örn: 13"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Namazın düzene girdiği yaş:</Text>
              <TextInput
                value={regularAge}
                onChangeText={setRegularAge}
                keyboardType="numeric"
                className="rounded-2xl bg-slate-50 p-4 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                placeholder="Örn: 25"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Muafiyet / Kılınmış Tahmini Oran (%):</Text>
              <View className="flex-row items-center gap-4">
                <TextInput
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  keyboardType="numeric"
                  className="flex-1 rounded-2xl bg-slate-50 p-4 font-bold text-slate-900 dark:bg-slate-800 dark:text-white"
                  placeholder="Örn: 20"
                />
                <View className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <Text className="text-xs font-bold text-slate-500">Düşülecek</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mb-8 items-center rounded-3xl bg-amber-50 p-6 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
            <Text className="text-xs font-bold text-amber-600 uppercase tracking-tighter">Toplam Namaz Borcu Süresi</Text>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-4xl font-black text-amber-700 dark:text-amber-400">{totalDays}</Text>
              <Text className="text-lg font-bold text-amber-600">GÜN</Text>
            </View>
            <Text className="mt-2 text-center text-[10px] leading-4 text-amber-500 font-medium">
              Bu işlem her vakit için {totalDays} adet kaza ekleyecektir.{'\n'}
              ({totalYears} yıl üzerinden hesaplanmıştır.)
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => onBatchAdd(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'], totalDays)}
            disabled={totalDays <= 0}
            className={`flex-row items-center justify-center gap-3 rounded-3xl p-5 ${totalDays > 0 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <Ionicons name="calculator" size={20} color="white" />
            <Text className="text-lg font-black text-white">Borçları Kaydet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function KazaTrackerScreen() {
  const [showModal, setShowModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const {
    kazaList,
    kazaCompleted,
    completedLast30Days,
    kazaCounters,
    isLoading: loading,
    fetchKazaList,
    addKaza,
    batchAddKaza,
    quickCompleteKaza,
    completeKaza,
    deleteKaza,
  } = useGamificationStore();
  const { isDark } = useThemeStore();

  const load = useCallback(async () => {
    await fetchKazaList();
  }, [fetchKazaList]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (prayer: string, dateStr: string) => {
    try {
      await addKaza(prayer, dateStr);
      setShowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Hata', 'Kaza eklenirken bir hata oluştu');
    }
  };

  const handleBatchAdd = async (prayers: string[], count: number) => {
    try {
      await batchAddKaza(prayers, count);
      setShowWizard(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Başarılı', `${count} günlük kaza borcu başarıyla eklendi.`);
    } catch (e) {
      Alert.alert('Hata', 'Toplu ekleme sırasında bir hata oluştu');
    }
  };

  const handleQuickComplete = async (prayer: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const points = await quickCompleteKaza(prayer);
      if (points > 0) {
        // Opsiyonel: Puan kazandın bildirimi
      }
    } catch (e) {
      Alert.alert('Bilgi', 'Bu vakit için bekleyen kaza namazınız bulunmuyor.');
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

  const groupedKaza = useMemo(() => {
    const groups: Record<string, typeof kazaList> = {
      Bugün: [],
      Dün: [],
      'Daha Eski': [],
    };

    const sortedList = [...kazaList].sort((a, b) => b.missed_date.localeCompare(a.missed_date));

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    sortedList.forEach((item) => {
      const date = item.missed_date.split('T')[0];
      if (date === today) groups['Bugün'].push(item);
      else if (date === yesterday) groups['Dün'].push(item);
      else groups['Daha Eski'].push(item);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [kazaList]);

  const prediction = useMemo(() => {
    if (totalPending === 0) return null;
    const velocityPerDay = completedLast30Days / 30;
    if (velocityPerDay === 0) return 'Hesaplanıyor...';

    const daysRemaining = totalPending / velocityPerDay;
    if (daysRemaining > 365 * 100) return 'Çok uzun zaman...';

    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + daysRemaining);

    return finishDate.toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric',
    });
  }, [totalPending, completedLast30Days]);

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
                Toplam Borç
              </Text>
            </View>
            <View>
              <Text className="text-2xl font-black text-white">{kazaCompleted}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-teal-100 dark:text-teal-400/80">
                Eritilen
              </Text>
            </View>
            <View>
              <Text className="text-2xl font-black text-white">%{progressPercent}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-teal-100 dark:text-teal-400/80">
                İlerleme
              </Text>
            </View>
          </View>
        </View>

        {prediction && totalPending > 0 && (
          <View className="mx-4 mb-8 flex-row items-center gap-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20">
              <Ionicons name="calendar" size={24} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Tahmini Bitiş
              </Text>
              <Text className="text-lg font-black text-slate-900 dark:text-white">{prediction}</Text>
            </View>
            <View className="items-end">
              <View
                className={`rounded-full px-2 py-1 ${
                  completedLast30Days > 30 ? 'bg-emerald-100' : 'bg-slate-100'
                } dark:bg-slate-700`}>
                <Text
                  className={`text-[9px] font-black uppercase ${
                    completedLast30Days > 30 ? 'text-emerald-600' : 'text-slate-500'
                  }`}>
                  {completedLast30Days > 30 ? 'Hızlı Eritme' : 'Normal Hız'}
                </Text>
              </View>
              <Text className="mt-1 text-[10px] font-bold text-slate-400">
                {completedLast30Days} kaza / ay
              </Text>
            </View>
          </View>
        )}

        <View className="mb-8 px-4">
          <Text className="mb-4 px-1 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Hızlı Sayaç (En Eskiden Erit)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
            {PRAYERS.map((p) => {
              const count = kazaCounters[p.key] || 0;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => handleQuickComplete(p.key)}
                  disabled={count <= 0}
                  className={`items-center rounded-3xl p-4 shadow-sm ${
                    count > 0 ? 'bg-white dark:bg-slate-800/80' : 'bg-slate-50 opacity-50 dark:bg-slate-900/40'
                  }`}
                  style={{ width: 100 }}>
                  <View
                    style={{ backgroundColor: count > 0 ? p.color : '#94a3b8' }}
                    className="mb-2 h-10 w-10 items-center justify-center rounded-2xl">
                    <Ionicons name={p.icon} size={20} color="#fff" />
                  </View>
                  <Text className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                    {p.label}
                  </Text>
                  <Text className="mt-0.5 text-lg font-black text-slate-900 dark:text-white">
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View className="px-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-900 dark:text-white">Kaza Listesi</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowWizard(true);
                }}
                className="flex-row items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5">
                <Ionicons name="flash" size={18} color="#fff" />
                <Text className="text-sm font-bold text-white">Sihirbaz</Text>
              </TouchableOpacity>
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
            groupedKaza.map(([title, items]) => (
              <View key={title} className="mb-6">
                <Text className="mb-3 px-1 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {title}
                </Text>
                {items.map((item) => (
                  <KazaItem
                    key={item.id}
                    item={item}
                    onComplete={() => handleComplete(item.id, getPrayerLabel(item.prayer_time))}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AddKazaModal visible={showModal} onClose={() => setShowModal(false)} onAdd={handleAdd} />
      <KazaWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onBatchAdd={handleBatchAdd}
      />
    </Screen>
  );
}
