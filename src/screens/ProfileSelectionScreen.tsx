/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/modules/family/family.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTheme } from '@/hooks/useTheme';

export default function ProfileSelectionScreen() {
  const { children, fetchChildren, openChildMode, selectParentMode } = useFamilyStore();
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [fetching, setFetching] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const pinInputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchChildren().finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!fetching && children.length === 0) {
      selectParentMode();
    }
  }, [fetching, children.length]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const handleSelectChild = (childId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChildId(childId);
    setPin('');
    setPinError(false);
    setTimeout(() => pinInputRef.current?.focus(), 200);
  };

  const handleCloseModal = () => {
    setSelectedChildId(null);
    setPin('');
    setPinError(false);
  };

  const handleEnterChildMode = async (enteredPin: string = pin) => {
    if (enteredPin.length !== 4 || pinLoading || !selectedChildId) return;
    Keyboard.dismiss();
    setPinError(false);
    setPinLoading(true);
    try {
      await openChildMode(selectedChildId, enteredPin);
      setSelectedChildId(null);
      setPin('');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError(true);
      setPin('');
      setTimeout(() => pinInputRef.current?.focus(), 100);
    } finally {
      setPinLoading(false);
    }
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : (user?.username ?? user?.email ?? 'Hesabım');

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Başlık */}
        <Animated.View entering={FadeInDown.duration(300)} className="items-center gap-2 py-6">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-500/10">
            <Text style={{ fontSize: 32 }}>🕌</Text>
          </View>
          <Text className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            Kim Kullanıyor?
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Profilini seçerek devam et
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              selectParentMode();
            }}
            className="flex-row items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-teal-50 dark:bg-teal-500/10">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 56, height: 56 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={28} color={isDark ? '#2dd4bf' : '#0f766e'} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-black text-slate-900 dark:text-white">
                {displayName}
              </Text>
              <Text className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                Ana Hesap
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#334155' : '#cbd5e1'} />
          </TouchableOpacity>
        </Animated.View>

        {children.length > 0 && (
          <>
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Çocuk Profilleri
            </Text>
            {children.map((child, i) => (
              <Animated.View key={child.id} entering={FadeInDown.delay(160 + i * 80).duration(300)}>
                <TouchableOpacity
                  onPress={() => handleSelectChild(child.id)}
                  className="flex-row items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <View className="h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                    <Text style={{ fontSize: 30 }}>{child.avatar_emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-black text-slate-900 dark:text-white">
                      {child.name}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-2">
                      <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        ⭐ {child.total_stars ?? 0}
                      </Text>
                      <Text className="text-xs text-slate-400 dark:text-slate-600">·</Text>
                      <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Lv.{child.level ?? 1}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
                    <Ionicons
                      name="keypad-outline"
                      size={12}
                      color={isDark ? '#94a3b8' : '#64748b'}
                    />
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      PIN
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        )}

        {fetching && (
          <View className="items-center py-8">
            <Text className="text-slate-400 dark:text-slate-600">Yükleniyor...</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedChildId}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={handleCloseModal} />
          <View className="rounded-t-[32px] border-t border-slate-200 bg-white p-6 pb-10 dark:border-slate-700 dark:bg-slate-900">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-slate-900 dark:text-white">
                {selectedChild?.name} için PIN
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>
            </View>

            <View className="mb-6 items-center gap-2">
              <Text style={{ fontSize: 36 }}>{selectedChild?.avatar_emoji}</Text>
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Çocuk moduna girmek için PIN girin
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => pinInputRef.current?.focus()}
              className="mb-4 flex-row items-center justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={`h-4 w-4 rounded-full ${
                    pinError
                      ? 'bg-red-400 dark:bg-red-500'
                      : i < pin.length
                        ? 'bg-teal-600 dark:bg-teal-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </TouchableOpacity>

            <TextInput
              ref={pinInputRef}
              value={pin}
              onChangeText={(t) => {
                const cleaned = t.replace(/\D/g, '').slice(0, 4);
                setPin(cleaned);
                setPinError(false);
                if (cleaned.length === 4) handleEnterChildMode(cleaned);
              }}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
            />

            <View className="mb-4 items-center" style={{ minHeight: 20 }}>
              {pinError ? (
                <Text className="text-sm font-black text-red-500 dark:text-red-400">
                  Hatalı PIN, tekrar dene
                </Text>
              ) : (
                <Text className="text-xs text-slate-400 dark:text-slate-600">
                  {pinLoading
                    ? 'Kontrol ediliyor...'
                    : pin.length < 4
                      ? `${4 - pin.length} rakam daha`
                      : ''}
                </Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}
