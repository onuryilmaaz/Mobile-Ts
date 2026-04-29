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
import { useAppTheme } from '@/constants/theme';

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
  const { colors, isDark } = useAppTheme();
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
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.card, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: colors.cardBorder }}>
          <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>Kaza Namaz Ekle</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.settingsBg }}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={{ marginBottom: 12, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>
            Namaz Vakti
          </Text>
          <View style={{ marginBottom: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRAYERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPrayer(p.key);
                }}
                style={{
                  borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10,
                  backgroundColor: selectedPrayer === p.key ? (isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim) : (isDark ? 'rgba(255,255,255,0.03)' : colors.settingsBg),
                  borderColor: selectedPrayer === p.key ? colors.teal : colors.cardBorder,
                }}>
                <Text
                  style={{
                    fontSize: 14, fontWeight: 'bold',
                    color: selectedPrayer === p.key ? colors.teal : colors.textSecondary,
                  }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ marginBottom: 12, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted }}>
            Hangi Gün?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4, marginBottom: 24 }}>
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
                  style={{
                    marginHorizontal: 4, width: 56, alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 12,
                    backgroundColor: selectedDate === d ? (isDark ? 'rgba(20,184,166,0.15)' : colors.tealDim) : (isDark ? 'rgba(255,255,255,0.03)' : colors.settingsBg),
                    borderColor: selectedDate === d ? colors.teal : colors.cardBorder,
                  }}>
                  <Text
                    style={{
                      fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase',
                      color: selectedDate === d ? colors.teal : colors.textMuted,
                    }}>
                    {day}
                  </Text>
                  <Text
                    style={{
                      fontSize: 18, fontWeight: '900',
                      color: selectedDate === d ? colors.teal : colors.textPrimary,
                    }}>
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
            style={{ alignItems: 'center', borderRadius: 16, backgroundColor: colors.teal, paddingVertical: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>Listeye Ekle</Text>
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
  const { colors, isDark } = useAppTheme();
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
        style={[animStyle, {
          marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 20,
          borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card,
          padding: 16, shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
        }]}>
        {/* Color dot */}
        <View
          style={{
            marginRight: 16, height: 44, width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16,
            backgroundColor: `${getPrayerColor(item.prayer_time)}18`
          }}>
          <View
            style={{ height: 16, width: 16, borderRadius: 8, backgroundColor: getPrayerColor(item.prayer_time) }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: colors.textPrimary }}>
            {getPrayerLabel(item.prayer_time)} Namazı
          </Text>
          <Text style={{ marginTop: 2, fontSize: 12, color: colors.textSecondary }}>
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
          style={{
            marginRight: 8, height: 36, width: 36, alignItems: 'center', justifyContent: 'center',
            borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.settingsBg
          }}>
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleComplete}
          style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.teal }}>
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
  const { colors, isDark } = useAppTheme();

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
    <Screen  safeAreaEdges={['left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}>
        {/* Stats Banner */}
        <View style={{ marginHorizontal: 16, marginBottom: 24, overflow: 'hidden', borderRadius: 28, backgroundColor: colors.trackerHeader, padding: 20 }}>
          <View style={{ position: 'absolute', right: -32, top: -32, height: 144, width: 144, borderRadius: 72, backgroundColor: 'rgba(20,184,166,0.2)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{totalPending}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? 'rgba(20,184,166,0.80)' : '#f0fdf4' }}>
                Bekleyen Kaza
              </Text>
            </View>
            <View style={{ height: 40, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>{kazaCompleted}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? 'rgba(20,184,166,0.80)' : '#f0fdf4' }}>
                Tamamlanan
              </Text>
            </View>
            <View style={{ height: 40, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff' }}>%{progressPercent}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: isDark ? 'rgba(20,184,166,0.80)' : '#f0fdf4' }}>
                İlerleme
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {kazaCompleted + totalPending > 0 && (
            <View style={{ marginTop: 16, height: 8, overflow: 'hidden', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <View
                style={{ height: '100%', borderRadius: 99, backgroundColor: '#fff', width: `${progressPercent}%` }}
              />
            </View>
          )}
        </View>

        {/* List */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Kaza Listesi</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowModal(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, backgroundColor: colors.teal, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {kazaList.length === 0 && !loading ? (
            <View style={{ alignItems: 'center', borderRadius: 28, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, paddingVertical: 64 }}>
              <View style={{ marginBottom: 16, height: 80, width: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 40, backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5' }}>
                <Ionicons name="checkmark-circle-outline" size={40} color={isDark ? '#34d399' : '#10b981'} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Tebrikler!</Text>
              <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 14, color: colors.textSecondary }}>
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
