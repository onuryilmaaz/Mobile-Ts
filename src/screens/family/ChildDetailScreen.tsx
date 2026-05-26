/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import { familyApi } from '@/modules/family/family.api';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { TASK_TYPE_META } from '@/modules/family/family.types';

type Gender = 'erkek' | 'kız' | null | undefined;

function genderAccent(gender: Gender, isDark: boolean) {
  if (gender === 'erkek') {
    return {
      avatarBg: isDark ? '#022c22' : '#ecfdf5',
      primary: isDark ? '#10b981' : '#059669',
      primaryBorder: isDark ? '#065f46' : '#6ee7b7',
      progressBg: isDark ? '#064e3b' : '#d1fae5',
    };
  }
  if (gender === 'kız') {
    return {
      avatarBg: isDark ? '#1e1b4b' : '#f5f3ff',
      primary: isDark ? '#a78bfa' : '#7c3aed',
      primaryBorder: isDark ? '#3730a3' : '#c4b5fd',
      progressBg: isDark ? '#2e1065' : '#ede9fe',
    };
  }
  return {
    avatarBg: isDark ? '#042f2e' : '#f0fdfa',
    primary: isDark ? '#2dd4bf' : '#0d9488',
    primaryBorder: isDark ? '#134e4a' : '#99f6e4',
    progressBg: isDark ? '#042f2e' : '#ccfbf1',
  };
}

type Nav = NativeStackNavigationProp<FamilyStackParamList>;
type Route = RouteProp<FamilyStackParamList, 'ChildDetail'>;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export default function ChildDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { childId } = route.params;
  const { isDark } = useTheme();

  const { children, tasks, childStats, fetchTasks, fetchChildStats, openChildMode, deleteChild } =
    useFamilyStore();
  const child = children.find((c) => c.id === childId);
  const a = genderAccent(child?.gender, isDark);

  const [activeTab, setActiveTab] = useState<'tasks' | 'stats'>('tasks');

  // --- Çocuk modu açma PIN ---
  const [enterPinOpen, setEnterPinOpen] = useState(false);
  const [enterPin, setEnterPin] = useState('');
  const [enterPinLoading, setEnterPinLoading] = useState(false);
  const [enterPinError, setEnterPinError] = useState(false);
  const enterPinRef = useRef<TextInput>(null);

  // --- PIN ayarlama ---
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [changePinStep, setChangePinStep] = useState<1 | 2>(1); // 1: yeni PIN, 2: onayla
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinLoading, setChangePinLoading] = useState(false);
  const [changePinError, setChangePinError] = useState('');
  const newPinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchTasks(childId);
    fetchChildStats(childId);
  }, [childId]);

  if (!child) return null;

  const handleOpenChildMode = async (entered: string = enterPin) => {
    if (entered.length !== 4 || enterPinLoading) return;
    Keyboard.dismiss();
    setEnterPinError(false);
    setEnterPinLoading(true);
    try {
      await openChildMode(childId, entered);
      setEnterPinOpen(false);
      setEnterPin('');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setEnterPinError(true);
      setEnterPin('');
      setTimeout(() => enterPinRef.current?.focus(), 100);
    } finally {
      setEnterPinLoading(false);
    }
  };

  const closeChangePinModal = () => {
    setChangePinOpen(false);
    setChangePinStep(1);
    setNewPin('');
    setConfirmPin('');
    setChangePinError('');
  };

  const handleNewPinChange = (t: string) => {
    const cleaned = t.replace(/\D/g, '').slice(0, 4);
    setNewPin(cleaned);
    setChangePinError('');
    if (cleaned.length === 4) {
      Keyboard.dismiss();
      setTimeout(() => {
        setChangePinStep(2);
        setConfirmPin('');
        setTimeout(() => confirmPinRef.current?.focus(), 150);
      }, 200);
    }
  };

  const handleConfirmPinChange = async (t: string) => {
    const cleaned = t.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(cleaned);
    setChangePinError('');
    if (cleaned.length === 4) {
      if (cleaned !== newPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setChangePinError("PIN'ler eşleşmiyor, tekrar dene");
        setConfirmPin('');
        setTimeout(() => confirmPinRef.current?.focus(), 100);
        return;
      }
      Keyboard.dismiss();
      setChangePinLoading(true);
      try {
        await familyApi.setPin(childId, cleaned);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        closeChangePinModal();
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setChangePinError('PIN kaydedilemedi, tekrar dene');
        setConfirmPin('');
        setTimeout(() => confirmPinRef.current?.focus(), 100);
      } finally {
        setChangePinLoading(false);
      }
    }
  };

  const activeTasks = tasks.filter((t) => t.is_active);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Profil Header */}
        <View className="border-b border-slate-200 bg-white px-4 pb-5 pt-4 dark:border-slate-800 dark:bg-slate-900">
          <Animated.View entering={FadeInDown.duration(300)} className="items-center gap-3">
            <View
              className="h-20 w-20 items-center justify-center rounded-[24px]"
              style={{ backgroundColor: a.avatarBg, borderWidth: 1, borderColor: a.primaryBorder }}>
              <Text style={{ fontSize: 40 }}>{child.avatar_emoji}</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-xl font-black text-slate-900 dark:text-white">
                {child.name}
              </Text>
              <View className="flex-row gap-2">
                <View className="rounded-full bg-amber-50 px-2.5 py-1 dark:bg-amber-500/10">
                  <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    ⭐ {child.total_stars ?? 0}
                  </Text>
                </View>
                <View className="rounded-full bg-orange-50 px-2.5 py-1 dark:bg-orange-500/10">
                  <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    🔥 {child.current_streak ?? 0} gün
                  </Text>
                </View>
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{ backgroundColor: `${a.primary}18` }}>
                  <Text className="text-xs font-bold" style={{ color: a.primary }}>
                    Lv.{child.level ?? 1}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ana aksiyon butonları */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setEnterPinOpen(true);
                }}
                className="flex-row items-center gap-1.5 rounded-2xl px-4 py-2.5"
                style={{ backgroundColor: a.primary }}>
                <Ionicons name="play" size={14} color="white" />
                <Text className="text-sm font-black text-white">Çocuk Modu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ChildReport', { childId })}
                className="flex-row items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <Ionicons name="bar-chart-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Rapor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('RewardCatalog', { childId })}
                className="flex-row items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <Ionicons name="gift-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Ödüller
                </Text>
              </TouchableOpacity>
            </View>

            {/* İkincil butonlar: düzenle, PIN, sil */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('EditChild', { childId });
                }}
                className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                <Ionicons name="pencil-outline" size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Düzenle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setChangePinOpen(true);
                  setTimeout(() => newPinRef.current?.focus(), 300);
                }}
                className="flex-row items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                <Ionicons name="key-outline" size={13} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  PIN Ayarla
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  Alert.alert(
                    'Profili Sil',
                    `${child.name} profilini silmek istediğine emin misin? Tüm görevler ve veriler kaybolacak.`,
                    [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Sil',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteChild(childId);
                          navigation.goBack();
                        },
                      },
                    ],
                  );
                }}
                className="flex-row items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 dark:border-red-500/30">
                <Ionicons name="trash-outline" size={13} color={isDark ? '#f87171' : '#ef4444'} />
                <Text className="text-xs font-semibold text-red-500 dark:text-red-400">Sil</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Sekmeler */}
        <View className="flex-row border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {(['tasks', 'stats'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center border-b-2 py-3 border-transparent`}
              style={activeTab === tab ? { borderBottomColor: a.primary } : undefined}>
              <Text
                className={`text-sm font-bold ${activeTab !== tab ? 'text-slate-500 dark:text-slate-400' : ''}`}
                style={activeTab === tab ? { color: a.primary } : undefined}>
                {tab === 'tasks' ? 'Görevler' : 'İstatistik'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="gap-3 p-4">
          {activeTab === 'tasks' ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('CreateTask', { childId });
                }}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-400 py-3 dark:border-teal-600">
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={isDark ? '#2dd4bf' : '#0f766e'}
                />
                <Text className="text-sm font-bold text-teal-700 dark:text-teal-400">
                  Yeni Görev Ekle
                </Text>
              </TouchableOpacity>

              {activeTasks.length === 0 ? (
                <View className="items-center gap-3 py-8">
                  <Ionicons
                    name="clipboard-outline"
                    size={40}
                    color={isDark ? '#334155' : '#cbd5e1'}
                  />
                  <Text className="text-slate-400 dark:text-slate-600">Henüz görev eklenmedi</Text>
                </View>
              ) : (
                activeTasks.map((task, i) => {
                  const meta = TASK_TYPE_META[task.task_type];
                  return (
                    <Animated.View key={task.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('EditTask', { childId, taskId: task.id })
                        }
                        className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <View
                          className="h-10 w-10 items-center justify-center rounded-2xl border"
                          style={{
                            backgroundColor: isDark ? `${meta.color}20` : `${meta.color}15`,
                            borderColor: `${meta.color}35`,
                          }}>
                          <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </Text>
                          <View className="mt-1 flex-row items-center gap-2">
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                              {task.recurrence === 'daily'
                                ? 'Her gün'
                                : task.recurrence === 'weekly'
                                  ? 'Haftalık'
                                  : 'Bir kez'}
                            </Text>
                            <Text className="text-xs text-amber-500">
                              {'⭐'.repeat(Math.min(task.reward_stars, 5))}
                            </Text>
                            {task.requires_approval && (
                              <View className="rounded-full bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                                <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  Onay
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={isDark ? '#475569' : '#cbd5e1'}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })
              )}
            </>
          ) : (
            <>
              {childStats && (
                <>
                  <View className="flex-row gap-3">
                    {[
                      {
                        label: 'Toplam Yıldız',
                        value: childStats.total_stars,
                        emoji: '⭐',
                        bg: 'bg-amber-50 dark:bg-amber-500/10',
                        text: 'text-amber-600 dark:text-amber-400',
                      },
                      {
                        label: 'Güncel Seri',
                        value: `${childStats.current_streak}g`,
                        emoji: '🔥',
                        bg: 'bg-orange-50 dark:bg-orange-500/10',
                        text: 'text-orange-600 dark:text-orange-400',
                      },
                      {
                        label: 'En Uzun Seri',
                        value: `${childStats.highest_streak}g`,
                        emoji: '🏆',
                        bg: 'bg-teal-50 dark:bg-teal-500/10',
                        text: 'text-teal-700 dark:text-teal-400',
                      },
                    ].map((item) => (
                      <View
                        key={item.label}
                        className={`flex-1 items-center gap-1 rounded-2xl border border-slate-200 py-4 dark:border-slate-800 ${item.bg}`}>
                        <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                        <Text className={`text-lg font-black ${item.text}`}>{item.value}</Text>
                        <Text className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                    <SectionLabel>Seviye</SectionLabel>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="font-black text-slate-900 dark:text-white">
                        Lv.{childStats.level} — {childStats.level_name}
                      </Text>
                      {childStats.next_level_stars && (
                        <Text className="text-xs font-bold" style={{ color: a.primary }}>
                          {childStats.next_level_stars - childStats.total_stars} ⭐ kaldı
                        </Text>
                      )}
                    </View>
                    <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: a.progressBg }}>
                      <View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: a.primary,
                          width: `${childStats.next_level_stars ? Math.min(100, (childStats.total_stars / childStats.next_level_stars) * 100) : 100}%`,
                        }}
                      />
                    </View>
                  </View>

                  {childStats.badges.length > 0 && (
                    <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                      <SectionLabel>Rozetler</SectionLabel>
                      <View className="flex-row flex-wrap gap-3">
                        {childStats.badges.map((b) => (
                          <View key={b.badge_type} className="w-14 items-center gap-1">
                            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
                              <Text style={{ fontSize: 26 }}>{b.emoji ?? '🏅'}</Text>
                            </View>
                            <Text
                              className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                              numberOfLines={2}>
                              {b.name ?? b.badge_type}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Çocuk Modu Açma PIN Modal */}
      <Modal
        visible={enterPinOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEnterPinOpen(false);
          setEnterPin('');
          setEnterPinError(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() => {
              setEnterPinOpen(false);
              setEnterPin('');
              setEnterPinError(false);
            }}
          />
          <View className="rounded-t-[32px] border-t border-slate-200 bg-white p-6 pb-10 dark:border-slate-700 dark:bg-slate-900">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-slate-900 dark:text-white">
                Çocuk Modunu Aç
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEnterPinOpen(false);
                  setEnterPin('');
                  setEnterPinError(false);
                }}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>
            </View>

            <View className="mb-6 items-center gap-2">
              <Text style={{ fontSize: 36 }}>{child.avatar_emoji}</Text>
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {child.name} için PIN girin
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => enterPinRef.current?.focus()}
              className="mb-4 flex-row items-center justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={`h-4 w-4 rounded-full ${
                    enterPinError
                      ? 'bg-red-400 dark:bg-red-500'
                      : i < enterPin.length
                        ? 'bg-teal-600 dark:bg-teal-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </TouchableOpacity>

            <TextInput
              ref={enterPinRef}
              value={enterPin}
              onChangeText={(t) => {
                const cleaned = t.replace(/\D/g, '').slice(0, 4);
                setEnterPin(cleaned);
                setEnterPinError(false);
                if (cleaned.length === 4) handleOpenChildMode(cleaned);
              }}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
            />

            {enterPinError ? (
              <View className="mb-4 items-center">
                <Text className="text-sm font-black text-red-500 dark:text-red-400">
                  Hatalı PIN, tekrar dene
                </Text>
              </View>
            ) : (
              <View className="mb-4 items-center">
                <Text className="text-xs text-slate-400 dark:text-slate-600">
                  {enterPin.length < 4
                    ? `${4 - enterPin.length} rakam daha`
                    : enterPinLoading
                      ? 'Kontrol ediliyor...'
                      : ''}
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PIN Ayarlama Modal */}
      <Modal
        visible={changePinOpen}
        transparent
        animationType="slide"
        onRequestClose={closeChangePinModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={closeChangePinModal} />
          <View className="rounded-t-[32px] border-t border-slate-200 bg-white p-6 pb-10 dark:border-slate-700 dark:bg-slate-900">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-slate-900 dark:text-white">
                {changePinStep === 1 ? 'Yeni PIN Belirle' : 'PIN\'i Onayla'}
              </Text>
              <TouchableOpacity
                onPress={closeChangePinModal}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>
            </View>

            <View className="mb-6 items-center gap-2">
              <Text style={{ fontSize: 36 }}>{child.avatar_emoji}</Text>
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {changePinStep === 1
                  ? `${child.name} için 4 haneli PIN girin`
                  : 'Aynı PIN\'i tekrar girin'}
              </Text>
            </View>

            {/* Adım göstergesi */}
            <View className="mb-5 flex-row items-center justify-center gap-2">
              {[1, 2].map((s) => (
                <View
                  key={s}
                  className={`h-2 rounded-full ${
                    changePinStep >= s ? 'w-8 bg-teal-500' : 'w-4 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </View>

            {/* Adım 1 — Yeni PIN */}
            {changePinStep === 1 && (
              <>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => newPinRef.current?.focus()}
                  className="mb-4 flex-row items-center justify-center gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className={`h-4 w-4 rounded-full ${
                        i < newPin.length
                          ? 'bg-teal-600 dark:bg-teal-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </TouchableOpacity>
                <TextInput
                  ref={newPinRef}
                  value={newPin}
                  onChangeText={handleNewPinChange}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  autoFocus
                  style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
                />
              </>
            )}

            {/* Adım 2 — Onayla */}
            {changePinStep === 2 && (
              <>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => confirmPinRef.current?.focus()}
                  className="mb-4 flex-row items-center justify-center gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className={`h-4 w-4 rounded-full ${
                        changePinError
                          ? 'bg-red-400 dark:bg-red-500'
                          : i < confirmPin.length
                            ? 'bg-teal-600 dark:bg-teal-400'
                            : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </TouchableOpacity>
                <TextInput
                  ref={confirmPinRef}
                  value={confirmPin}
                  onChangeText={handleConfirmPinChange}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  autoFocus
                  style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
                />
              </>
            )}

            {changePinError ? (
              <View className="mb-4 items-center">
                <Text className="text-sm font-black text-red-500 dark:text-red-400">
                  {changePinError}
                </Text>
              </View>
            ) : (
              <View className="mb-4 items-center">
                <Text className="text-xs text-slate-400 dark:text-slate-600">
                  {changePinLoading ? 'Kaydediliyor...' : ''}
                </Text>
              </View>
            )}

            {changePinStep === 2 && (
              <TouchableOpacity
                onPress={() => {
                  setChangePinStep(1);
                  setNewPin('');
                  setConfirmPin('');
                  setChangePinError('');
                  setTimeout(() => newPinRef.current?.focus(), 150);
                }}
                className="items-center">
                <Text className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  ← Geri dön
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
