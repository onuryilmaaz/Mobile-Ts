import { useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ChildTabParamList } from './types';
import ChildTasksScreen from '@/screens/child/ChildTasksScreen';
import ChildRewardsScreen from '@/screens/child/ChildRewardsScreen';
import { useFamilyStore } from '@/modules/family/family.store';
import { useTheme } from '@/hooks/useTheme';

const Tab = createBottomTabNavigator<ChildTabParamList>();

type Gender = 'erkek' | 'kız' | null | undefined;

function genderColors(gender: Gender, isDark: boolean) {
  if (gender === 'erkek') {
    return {
      header: isDark ? '#047857' : '#059669',
      tabActive: isDark ? '#34d399' : '#059669',
      dotFill: isDark ? '#34d399' : '#059669',
    };
  }
  if (gender === 'kız') {
    return {
      header: isDark ? '#6d28d9' : '#7c3aed',
      tabActive: isDark ? '#a78bfa' : '#7c3aed',
      dotFill: isDark ? '#a78bfa' : '#7c3aed',
    };
  }
  return {
    header: isDark ? '#0f766e' : '#0d9488',
    tabActive: isDark ? '#2dd4bf' : '#0d9488',
    dotFill: isDark ? '#2dd4bf' : '#0d9488',
  };
}

export default function ChildNavigator() {
  const { childSession, childStats, exitChildMode, verifyChildPin } = useFamilyStore();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(false);
  const pinInputRef = useRef<TextInput>(null);

  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 16);
  const gender = childSession?.gender;
  const colors = genderColors(gender, isDark);
  const streak = childStats?.current_streak ?? 0;

  const handleExitPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin('');
    setPinError(false);
    setExitModalVisible(true);
    setTimeout(() => pinInputRef.current?.focus(), 200);
  };

  const handleCloseModal = () => {
    setExitModalVisible(false);
    setPin('');
    setPinError(false);
  };

  const handleVerifyAndExit = async (enteredPin: string = pin) => {
    if (enteredPin.length !== 4 || pinLoading || !childSession) return;
    Keyboard.dismiss();
    setPinError(false);
    setPinLoading(true);
    try {
      const valid = await verifyChildPin(childSession.childId, enteredPin);
      if (valid) {
        setExitModalVisible(false);
        setPin('');
        await exitChildMode();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPinError(true);
        setPin('');
        setTimeout(() => pinInputRef.current?.focus(), 100);
      }
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View
        className="w-full flex-row items-center justify-between px-4"
        style={{
          backgroundColor: colors.header,
          paddingTop: insets.top + 10,
          paddingBottom: 14,
        }}>
        <View className="flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-[18px]"
            style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
            <Text style={{ fontSize: 26 }}>{childSession?.avatarEmoji ?? '🌙'}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-[17px] font-black leading-tight text-white">
              {childSession?.childName ?? 'Çocuk Modu'}
            </Text>
            {streak > 0 && (
              <View
                className="self-start rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
                <Text className="text-[11px] font-bold text-white">🔥 {streak} gün seri</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleExitPress}
          className="flex-row items-center gap-1.5 rounded-full px-4 py-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
          <Ionicons name="exit-outline" size={14} color="white" />
          <Text className="text-sm font-bold text-white">Çıkış</Text>
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: isDark ? '#475569' : '#94a3b8',
          tabBarStyle: {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
            height: 56 + bottomPadding,
            paddingTop: 8,
            paddingBottom: bottomPadding,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        }}>
        <Tab.Screen
          name="ChildTasks"
          component={ChildTasksScreen}
          options={{
            tabBarLabel: 'Görevlerim',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ChildRewards"
          component={ChildRewardsScreen}
          options={{
            tabBarLabel: 'Ödüllerim',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      <Modal
        visible={exitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <View className="rounded-t-[32px] border-t border-slate-200 bg-white p-6 pb-10 dark:border-slate-700 dark:bg-slate-900">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-slate-900 dark:text-white">Çıkış Yap</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>
            </View>

            <View className="mb-6 items-center gap-2">
              <Text style={{ fontSize: 40 }}>{childSession?.avatarEmoji ?? '🌙'}</Text>
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Çıkmak için PIN girin
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => pinInputRef.current?.focus()}
              className="mb-4 flex-row items-center justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor: pinError
                      ? '#f87171'
                      : i < pin.length
                        ? colors.dotFill
                        : isDark
                          ? '#334155'
                          : '#e2e8f0',
                  }}
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
                if (cleaned.length === 4) handleVerifyAndExit(cleaned);
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
    </View>
  );
}
