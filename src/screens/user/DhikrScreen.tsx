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
import { useAppTheme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.72;

// ─────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────
const STORAGE_KEY_TOTAL   = 'DHIKR_TOTAL_COUNT';
const STORAGE_KEY_CUSTOMS = 'DHIKR_CUSTOM_PRESETS';
const STORAGE_KEY_LOG     = 'DHIKR_DAILY_LOG';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Preset = { name: string; target: number; isCustom?: boolean };
type DailyLog = { date: string; count: number; presetName: string }[];

// ─────────────────────────────────────────────
// DEFAULT PRESETS
// ─────────────────────────────────────────────
const DEFAULT_PRESETS: Preset[] = [
  { name: 'Subhânallâh',       target: 33  },
  { name: 'Elhamdülillâh',     target: 33  },
  { name: 'Allâhu Ekber',      target: 33  },
  { name: 'Lâ ilâhe illallâh', target: 100 },
  { name: 'Salavât',           target: 100 },
  { name: 'İstiğfar',          target: 70  },
];

// ─────────────────────────────────────────────
// MILESTONE ANIMATION
// ─────────────────────────────────────────────
function MilestoneToast({ message, visible }: { message: string; visible: boolean }) {
  const { colors, isDark } = useAppTheme();
  if (!visible) return null;
  return (
    <Animated.View
      entering={ZoomIn.duration(300)}
      exiting={FadeOut.duration(400)}
      style={{ position: 'absolute', top: 16, left: 32, right: 32, zIndex: 50, alignItems: 'center', borderRadius: 20, backgroundColor: colors.teal, paddingHorizontal: 24, paddingVertical: 16, shadowColor: colors.teal, shadowOpacity: isDark ? 0.3 : 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>{message}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// ADD CUSTOM PRESET MODAL
// ─────────────────────────────────────────────
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
  const { colors, isDark } = useAppTheme();

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
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.card, padding: 24, paddingBottom: 40 }}>
          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Özel Zikir Ekle</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>
            Zikir Adı
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="örn. Kelime-i Tevhid"
            placeholderTextColor={colors.textMuted}
            style={{ marginBottom: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: 'bold', color: colors.textPrimary }}
          />

          <Text style={{ marginBottom: 8, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>
            Hedef Sayı
          </Text>
          <View style={{ marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[33, 99, 100, 300, 1000].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTarget(t.toString());
                }}
                style={{
                  borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8,
                  borderColor: target === t.toString() ? colors.tealDim : colors.cardBorder,
                  backgroundColor: target === t.toString() ? (isDark ? 'rgba(20,184,166,0.1)' : '#f0fdfa') : (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc')
                }}>
                <Text
                  style={{ fontSize: 14, fontWeight: 'bold', color: target === t.toString() ? colors.teal : colors.textSecondary }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleAdd}
            style={{ alignItems: 'center', borderRadius: 16, backgroundColor: colors.teal, paddingVertical: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>Ekle</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// HISTORY MODAL
// ─────────────────────────────────────────────
function HistoryModal({ visible, onClose, log }: { visible: boolean; onClose: () => void; log: DailyLog }) {
  const { colors, isDark } = useAppTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ maxHeight: '70%', backgroundColor: colors.card, padding: 24, paddingBottom: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Zikir Geçmişi</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {log.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Ionicons name="time-outline" size={40} color={colors.textMuted} />
                <Text style={{ marginTop: 12, fontSize: 14, color: colors.textSecondary }}>Henüz zikir kaydı yok.</Text>
              </View>
            ) : (
              [...log].reverse().map((entry, i) => (
                <View
                  key={i}
                  style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', paddingHorizontal: 16, paddingVertical: 12 }}>
                  <View style={{ marginRight: 12, height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim }}>
                    <Ionicons name="radio-button-on" size={16} color={colors.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>{entry.presetName}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{entry.date}</Text>
                  </View>
                  <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.teal }}>{entry.count}</Text>
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

// ─────────────────────────────────────────────
// CIRCULAR PROGRESS (SVG-free, pure RN)
// ─────────────────────────────────────────────
function CircularProgressRing({ progress, color }: { progress: number; color: string }) {
  const { isDark, colors } = useAppTheme();
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
      {/* Top half fill */}
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

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
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
  const { colors, isDark } = useAppTheme();

  const target = presets[activePreset]?.target ?? 33;

  const scale    = useSharedValue(1);
  const ringGlow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // ── Load persisted data ──
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

  // ── Save helpers ──
  const saveTotal = async (n: number) =>
    AsyncStorage.setItem(STORAGE_KEY_TOTAL, n.toString());

  const saveLog = async (newLog: DailyLog) =>
    AsyncStorage.setItem(STORAGE_KEY_LOG, JSON.stringify(newLog));

  const saveCustoms = async (customs: Preset[]) =>
    AsyncStorage.setItem(STORAGE_KEY_CUSTOMS, JSON.stringify(customs));

  // ── Show milestone toast ──
  const showMilestoneToast = (msg: string) => {
    if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
    setMilestoneMsg(msg);
    setShowMilestone(true);
    milestoneTimer.current = setTimeout(() => setShowMilestone(false), 2000);
  };

  // ── Handle tap ──
  const handlePress = useCallback(() => {
    const nextCount = count + 1;
    setCount(nextCount);

    // Total
    const nextTotal = totalSessions + 1;
    setTotalSessions(nextTotal);
    saveTotal(nextTotal);

    // Today count + log
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

    // Milestones & haptics
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
      {/* Milestone Toast */}
      <MilestoneToast message={milestoneMsg} visible={showMilestone} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Stats Row ── */}
        <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingVertical: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.teal }}>{todayCount.toLocaleString()}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>Bugün</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingVertical: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>{totalSessions.toLocaleString()}</Text>
            <Text style={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>Toplam</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowHistory(true)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingVertical: 12, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Ionicons name="time-outline" size={20} color={colors.teal} />
            <Text style={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>Geçmiş</Text>
          </TouchableOpacity>
        </View>

        {/* ── Preset Chips ── */}
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>Zikir Seç</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(20,184,166,0.3)' : '#bbf7d0', backgroundColor: isDark ? 'rgba(20,184,166,0.1)' : '#f0fdfa', paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="add" size={14} color={colors.teal} />
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.teal }}>Özel Ekle</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
            {presets.map((preset, idx) => (
              <TouchableOpacity
                key={`${preset.name}-${idx}`}
                onPress={() => selectPreset(idx)}
                onLongPress={() => preset.isCustom && deleteCustomPreset(idx)}
                style={{
                  marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10,
                  borderColor: activePreset === idx ? colors.tealDim : colors.cardBorder,
                  backgroundColor: activePreset === idx ? (isDark ? 'rgba(20,184,166,0.1)' : '#f0fdfa') : colors.card
                }}>
                {preset.isCustom && (
                  <Ionicons name="star" size={10} color={activePreset === idx ? colors.teal : colors.textMuted} />
                )}
                <Text
                  style={{ fontSize: 14, fontWeight: 'bold', color: activePreset === idx ? colors.teal : colors.textSecondary }}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Counter Circle ── */}
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          {/* Rounds indicator */}
          {completedRounds > 0 && (
            <Animated.View entering={FadeIn} style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 99, backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim, paddingHorizontal: 16, paddingVertical: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.teal} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: colors.teal }}>{completedRounds} tur tamamlandı</Text>
            </Animated.View>
          )}

          <TouchableOpacity activeOpacity={1} onPress={handlePress} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              style={[{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', backgroundColor: colors.card, shadowColor: colors.teal, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } }, animatedStyle]}>
              {/* Progress fill */}
              <CircularProgressRing progress={progressFraction} color={colors.teal} />

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 96, fontWeight: '900', color: colors.textPrimary, lineHeight: 96 }}>
                  {count % target === 0 && count > 0 ? (
                    <Text style={{ color: colors.teal }}>{target}</Text>
                  ) : (
                    count % target
                  )}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>
                  {currentPreset?.name}
                </Text>
              </View>

              {/* Target arc */}
              <View
                style={{
                  position: 'absolute',
                  width: CIRCLE_SIZE - 16,
                  height: CIRCLE_SIZE - 16,
                  borderRadius: (CIRCLE_SIZE - 16) / 2,
                  borderWidth: 2,
                  borderColor: `${colors.teal}${Math.round(progressFraction * 255).toString(16).padStart(2, '0')}`,
                  borderStyle: 'dashed',
                }}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Target pill */}
          <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 99, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}>
            <Ionicons name="flag" size={14} color={colors.teal} />
            <Text style={{ fontSize: 14, fontWeight: '900', color: colors.teal }}>Hedef: {target}</Text>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={{ marginTop: 32, flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={resetCount}
            style={{ height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Ionicons name="refresh-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={shareProgress}
            style={{ height: 56, width: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Ionicons name="share-social-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 14, fontWeight: '500', color: colors.textMuted }}>
          Zikir çekmek için dairenin içine dokunun
        </Text>
        <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: colors.textSecondary, opacity: 0.5 }}>
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
