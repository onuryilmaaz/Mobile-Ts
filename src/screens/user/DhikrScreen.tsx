import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Share,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/theme.store';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.72;

const STORAGE_KEY_TOTAL   = 'DHIKR_TOTAL_COUNT';
const STORAGE_KEY_CUSTOMS = 'DHIKR_CUSTOM_PRESETS';
const STORAGE_KEY_LOG     = 'DHIKR_DAILY_LOG';

type Preset = { name: string; target: number; isCustom?: boolean };
type DailyLog = { date: string; count: number; presetName: string }[];

const DEFAULT_PRESETS: Preset[] = [
  { name: 'Subhânallâh',       target: 33  },
  { name: 'Elhamdülillâh',     target: 33  },
  { name: 'Allâhu Ekber',      target: 33  },
  { name: 'Lâ ilâhe illallâh', target: 100 },
  { name: 'Salavât',           target: 100 },
  { name: 'İstiğfar',          target: 70  },
];

function MilestoneToast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={ZoomIn.duration(300)}
      exiting={FadeOut.duration(400)}
      className="absolute left-8 right-8 top-4 z-50 items-center rounded-2xl bg-teal-600 px-6 py-4 shadow-xl dark:bg-teal-500">
      <Text className="text-base font-black text-white">{message}</Text>
    </Animated.View>
  );
}

function AddPresetModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (preset: Preset) => void;
}) {
  const [name, setName]     = useState('');
  const [target, setTarget] = useState('33');
  const { isDark } = useThemeStore();

  const handleAdd = () => {
    const t = parseInt(target);
    if (!name.trim() || isNaN(t) || t < 1) {
      Alert.alert('Hata', 'Geçerli bir isim ve hedef sayı girin.');
      return;
    }
    onAdd({ name: name.trim(), target: t, isCustom: true });
    setName('');
    setTarget('33');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-[32px] bg-white dark:bg-slate-900 p-6 pb-10 dark:border-t dark:border-slate-800">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-900 dark:text-white">Özel Zikir Ekle</Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
          </View>

          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Zikir Adı
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="örn. Kelime-i Tevhid"
            placeholderTextColor={isDark ? '#4b5563' : '#94a3b8'}
            className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
          />

          <Text className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Hedef Sayı
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {[33, 99, 100, 300, 1000].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTarget(t.toString());
                }}
                className={`rounded-2xl border px-4 py-2 ${
                  target === t.toString()
                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    target === t.toString() ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            className="items-center rounded-2xl bg-teal-600 py-4 dark:bg-teal-500">
            <Text className="text-base font-black text-white">Ekle</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function HistoryModal({ visible, onClose, log }: { visible: boolean; onClose: () => void; log: DailyLog }) {
  const { isDark } = useThemeStore();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[70%] rounded-t-[32px] bg-white dark:bg-slate-900 p-6 pb-10 dark:border-t dark:border-slate-800">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-black text-slate-900 dark:text-white">Zikir Geçmişi</Text>
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#475569'} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {log.length === 0 ? (
              <View className="items-center py-12">
                <Ionicons name="time-outline" size={40} color={isDark ? '#1e293b' : '#94a3b8'} />
                <Text className="mt-3 text-sm text-slate-600 dark:text-slate-400">Henüz zikir kaydı yok.</Text>
              </View>
            ) : (
              [...log].reverse().map((entry, i) => (
                <View
                  key={i}
                  className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 dark:border-slate-800">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10">
                    <Ionicons name="radio-button-on" size={16} color={isDark ? '#14b8a6' : '#0f766e'} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-black text-slate-900 dark:text-white">{entry.presetName}</Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">{entry.date}</Text>
                  </View>
                  <View className="rounded-full bg-teal-50 px-3 py-1 dark:bg-teal-500/15">
                    <Text className="text-sm font-black text-teal-700 dark:text-teal-400">{entry.count}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CircularProgressRing({ progress, color }: { progress: number; color: string }) {
  const { isDark } = useThemeStore();
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={{
        position: 'absolute',
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: 6,
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
      }}
    >
      {clamped > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${Math.min(100, clamped * 100)}%`,
            backgroundColor: `${color}14`,
            borderRadius: CIRCLE_SIZE / 2,
          }}
        />
      )}
    </View>
  );
}

export default function DhikrScreen() {
  const [count, setCount]             = useState(0);
  const [activePreset, setActivePreset] = useState(0);
  const [presets, setPresets]         = useState<Preset[]>(DEFAULT_PRESETS);
  const [totalSessions, setTotalSessions] = useState(0);
  const [todayCount, setTodayCount]   = useState(0);
  const [log, setLog]                 = useState<DailyLog>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [milestoneMsg, setMilestoneMsg] = useState('');
  const [showMilestone, setShowMilestone] = useState(false);
  const milestoneTimer = useRef<NodeJS.Timeout | null>(null);
  const { isDark } = useThemeStore();

  const target = presets[activePreset]?.target ?? 33;
  const scale    = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    (async () => {
      const [savedTotal, savedCustoms, savedLog] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_TOTAL),
        AsyncStorage.getItem(STORAGE_KEY_CUSTOMS),
        AsyncStorage.getItem(STORAGE_KEY_LOG),
      ]);
      if (savedTotal) setTotalSessions(parseInt(savedTotal));
      if (savedCustoms) {
        const customs: Preset[] = JSON.parse(savedCustoms);
        setPresets([...DEFAULT_PRESETS, ...customs]);
      }
      if (savedLog) {
        const parsed: DailyLog = JSON.parse(savedLog);
        setLog(parsed);
        const today = new Date().toLocaleDateString('tr-TR');
        const todayEntry = parsed.find((e) => e.date === today);
        setTodayCount(todayEntry?.count || 0);
      }
    })();
  }, []);

  const saveTotal = async (n: number) =>
    AsyncStorage.setItem(STORAGE_KEY_TOTAL, n.toString());

  const saveLog = async (newLog: DailyLog) =>
    AsyncStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(newLog));

  const saveCustoms = async (customs: Preset[]) =>
    AsyncStorage.setItem(STORAGE_KEY_CUSTOMS, JSON.stringify(customs));

  const showMilestoneToast = (msg: string) => {
    if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
    setMilestoneMsg(msg);
    setShowMilestone(true);
    milestoneTimer.current = setTimeout(() => setShowMilestone(false), 2000);
  };

  const handlePress = useCallback(() => {
    const nextCount = count + 1;
    setCount(nextCount);

    const nextTotal = totalSessions + 1;
    setTotalSessions(nextTotal);
    saveTotal(nextTotal);

    const nextToday = todayCount + 1;
    setTodayCount(nextToday);
    const today = new Date().toLocaleDateString('tr-TR');
    setLog((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((e) => e.date === today);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], count: updated[idx].count + 1 };
      } else {
        updated.push({ date: today, count: 1, presetName: presets[activePreset]?.name });
      }
      saveLog(updated);
      return updated;
    });

    const completed = Math.floor(nextCount / target);
    const prev = Math.floor((nextCount - 1) / target);
    if (completed > prev) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const round = Math.floor(nextCount / target);
      if (round === 1) showMilestoneToast('🎉 Tur tamamlandı!');
      else if (round === 3) showMilestoneToast('🔥 3 tur! Devam et!');
      else showMilestoneToast(`✨ ${round}. tur tamamlandı!`);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    scale.value = withSequence(
      withTiming(0.92, { duration: 50 }),
      withSpring(1, { damping: 10, stiffness: 120 })
    );
  }, [count, target, totalSessions, todayCount, activePreset, presets, scale]);

  const resetCount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCount(0);
  };

  const selectPreset = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivePreset(index);
    setCount(0);
  };

  const addCustomPreset = async (preset: Preset) => {
    const customs = presets.filter((p) => p.isCustom);
    const newCustoms = [...customs, preset];
    const newAll = [...DEFAULT_PRESETS, ...newCustoms];
    setPresets(newAll);
    setActivePreset(newAll.length - 1);
    setCount(0);
    await saveCustoms(newCustoms);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteCustomPreset = async (idx: number) => {
    if (!presets[idx].isCustom) return;
    Alert.alert('Sil', `"${presets[idx].name}" zikrini silmek istiyor musun?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const newAll = presets.filter((_, i) => i !== idx);
          const newCustoms = newAll.filter((p) => p.isCustom);
          setPresets(newAll);
          setActivePreset(0);
          setCount(0);
          await saveCustoms(newCustoms);
        },
      },
    ]);
  };

  const shareProgress = async () => {
    try {
      await Share.share({
        message: `Salah uygulaması ile bugün ${todayCount} zikir çektim! Toplam: ${totalSessions.toLocaleString()} 📿 #SalahApp`,
      });
    } catch {}
  };

  const progressFraction = target > 0 ? (count % target) / target : 0;
  const completedRounds  = Math.floor(count / target);
  const currentPreset    = presets[activePreset];

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <MilestoneToast message={milestoneMsg} visible={showMilestone} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>

        <View className="mx-4 mt-4 flex-row gap-3">
          <View 
            className={`flex-1 items-center rounded-2xl border py-3 shadow-sm ${
              isDark 
                ? 'border-slate-800 bg-slate-800' 
                : 'border-slate-200 bg-white'
            }`}>
            <Text className="text-xl font-black text-teal-700 dark:text-teal-400">{todayCount.toLocaleString()}</Text>
            <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Bugün</Text>
          </View>
          <View 
            className={`flex-1 items-center rounded-2xl border py-3 shadow-sm ${
              isDark 
                ? 'border-slate-800 bg-slate-800' 
                : 'border-slate-200 bg-white'
            }`}>
            <Text className="text-xl font-black text-slate-900 dark:text-white">{totalSessions.toLocaleString()}</Text>
            <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Toplam</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowHistory(true)}
            className={`flex-1 items-center justify-center rounded-2xl border py-3 shadow-sm ${
              isDark 
                ? 'border-slate-800 bg-slate-800' 
                : 'border-slate-200 bg-white'
            }`}>
            <Ionicons name="time-outline" size={20} color={isDark ? '#14b8a6' : '#0f766e'} />
            <Text className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Geçmiş</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-5 px-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Zikir Seç</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 dark:border-teal-500/30 dark:bg-teal-500/10">
              <Ionicons name="add" size={14} color={isDark ? '#14b8a6' : '#0f766e'} />
              <Text className="text-xs font-bold text-teal-700 dark:text-teal-400">Özel Ekle</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
            {presets.map((preset, idx) => (
              <TouchableOpacity
                key={`${preset.name}-${idx}`}
                onPress={() => selectPreset(idx)}
                onLongPress={() => preset.isCustom && deleteCustomPreset(idx)}
                className={`mr-2 flex-row items-center gap-1 rounded-2xl border px-4 py-2.5 ${
                  activePreset === idx
                    ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/10'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}>
                {preset.isCustom && (
                  <Ionicons name="star" size={10} color={activePreset === idx ? (isDark ? '#14b8a6' : '#0f766e') : (isDark ? '#4b5563' : '#94a3b8')} />
                )}
                <Text
                  className={`text-sm font-bold ${
                    activePreset === idx ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mt-8 items-center">
          {completedRounds > 0 && (
            <Animated.View entering={FadeIn} className="mb-4 flex-row items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-500/15 px-4 py-2">
              <Ionicons name="checkmark-circle" size={16} color={isDark ? '#14b8a6' : '#0f766e'} />
              <Text className="text-sm font-black text-teal-700 dark:text-teal-400">{completedRounds} tur tamamlandı</Text>
            </Animated.View>
          )}

          <TouchableOpacity activeOpacity={1} onPress={handlePress} className="items-center justify-center">
            <Animated.View
              style={[{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }, animatedStyle]}
              className={`items-center justify-center rounded-full border-[6px] shadow-2xl shadow-teal-600/20 ${
                isDark 
                  ? 'border-slate-800 bg-slate-800 shadow-none' 
                  : 'border-slate-100 bg-white'
              }`}>
              <CircularProgressRing progress={progressFraction} color={isDark ? '#14b8a6' : '#0f766e'} />

              <View className="items-center">
                <Text className="text-[96px] font-black leading-[96px] text-slate-900 dark:text-white">
                  {count % target === 0 && count > 0 ? (
                    <Text className="text-teal-700 dark:text-teal-400">{target}</Text>
                  ) : (
                    count % target
                  )}
                </Text>
                <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {currentPreset?.name}
                </Text>
              </View>

              <View
                style={{
                  position: 'absolute',
                  width: CIRCLE_SIZE - 16,
                  height: CIRCLE_SIZE - 16,
                  borderRadius: (CIRCLE_SIZE - 16) / 2,
                  borderWidth: 2,
                  borderColor: isDark ? `rgba(20,184,166, ${progressFraction})` : `rgba(15,118,110, ${progressFraction})`,
                  borderStyle: 'dashed',
                }}
              />
            </Animated.View>
          </TouchableOpacity>

          <View className={`mt-5 flex-row items-center gap-2 rounded-full border px-4 py-2 shadow-sm ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <Ionicons name="flag" size={14} color={isDark ? '#14b8a6' : '#0f766e'} />
            <Text className="text-sm font-black text-teal-700 dark:text-teal-400">Hedef: {target}</Text>
          </View>
        </View>

        <View className="mt-8 flex-row justify-center gap-4 px-4">
          <TouchableOpacity
            onPress={resetCount}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
            <Ionicons name="refresh-outline" size={22} color={isDark ? '#94a3b8' : '#475569'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={shareProgress}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none">
            <Ionicons name="share-social-outline" size={22} color={isDark ? '#94a3b8' : '#475569'} />
          </TouchableOpacity>
        </View>

        <Text className="mt-5 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Zikir çekmek için dairenin içine dokunun
        </Text>
        <Text className="mt-1 text-center text-xs text-slate-400 opacity-50 dark:text-slate-500">
          Özel zikir eklemek için uzun basın
        </Text>
      </ScrollView>

      <AddPresetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomPreset}
      />

      <HistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        log={log}
      />
    </Screen>
  );
}
