/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';

type Nav = NativeStackNavigationProp<FamilyStackParamList>;

export default function FamilyDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { children, pendingApprovals, fetchChildren, fetchPendingApprovals, isLoading } =
    useFamilyStore();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchChildren();
    fetchPendingApprovals();
  }, []);

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              fetchChildren();
              fetchPendingApprovals();
            }}
            tintColor={isDark ? '#14b8a6' : '#0f766e'}
          />
        }
        showsVerticalScrollIndicator={false}>
        {pendingApprovals.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('PendingApprovals');
              }}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20">
                  <Ionicons name="time" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-black text-amber-800 dark:text-amber-300">
                    Onay Bekleyen Görevler
                  </Text>
                  <Text className="text-xs text-amber-600 dark:text-amber-400">
                    {pendingApprovals.length} tamamlama onay bekliyor
                  </Text>
                </View>
                <View className="h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5">
                  <Text className="text-[11px] font-black text-white">
                    {pendingApprovals.length}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-black text-slate-900 dark:text-white">Çocuklarım</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('AddChild');
            }}
            className="flex-row items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 dark:bg-teal-500/15">
            <Ionicons name="add" size={16} color={isDark ? '#2dd4bf' : '#0f766e'} />
            <Text className="text-xs font-bold text-teal-700 dark:text-teal-400">Ekle</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 dark:bg-teal-500/10">
              <Ionicons name="people-outline" size={36} color={isDark ? '#2dd4bf' : '#0f766e'} />
            </View>
            <View className="items-center gap-1">
              <Text className="text-base font-black text-slate-900 dark:text-white">
                Aile Moduna Hoş Geldin
              </Text>
              <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
                Çocuklarına dini görevler ata,{'\n'}ilerlemelerini takip et.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('AddChild');
              }}
              className="rounded-2xl bg-teal-600 px-6 py-3 dark:bg-teal-500">
              <Text className="font-black text-white">İlk Çocuğu Ekle</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          children.map((child, i) => {
            const avatarBg =
              child.gender === 'erkek'
                ? isDark
                  ? '#022c22'
                  : '#ecfdf5'
                : child.gender === 'kız'
                  ? isDark
                    ? '#1e1b4b'
                    : '#f5f3ff'
                  : isDark
                    ? '#042f2e'
                    : '#f0fdfa';
            const avatarBorder =
              child.gender === 'erkek'
                ? isDark
                  ? '#065f46'
                  : '#6ee7b7'
                : child.gender === 'kız'
                  ? isDark
                    ? '#3730a3'
                    : '#c4b5fd'
                  : isDark
                    ? '#134e4a'
                    : '#99f6e4';
            const levelColor =
              child.gender === 'erkek'
                ? isDark
                  ? '#10b981'
                  : '#059669'
                : child.gender === 'kız'
                  ? isDark
                    ? '#a78bfa'
                    : '#7c3aed'
                  : isDark
                    ? '#2dd4bf'
                    : '#0d9488';

            return (
              <Animated.View key={child.id} entering={FadeInDown.delay(i * 80).duration(350)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('ChildDetail', { childId: child.id });
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-14 w-14 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: avatarBg,
                        borderWidth: 1,
                        borderColor: avatarBorder,
                      }}>
                      <Text style={{ fontSize: 28 }}>{child.avatar_emoji}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-black text-slate-900 dark:text-white">
                          {child.name}
                        </Text>
                        {(child.pending_approvals ?? 0) > 0 && (
                          <View className="h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1">
                            <Text className="text-[10px] font-black text-white">
                              {child.pending_approvals}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="mt-1.5 flex-row gap-2">
                        <View className="rounded-full bg-amber-50 px-2 py-0.5 dark:bg-amber-500/10">
                          <Text className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            ⭐ {child.total_stars ?? 0}
                          </Text>
                        </View>
                        <View className="rounded-full bg-orange-50 px-2 py-0.5 dark:bg-orange-500/10">
                          <Text className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                            🔥 {child.current_streak ?? 0} gün
                          </Text>
                        </View>
                        <View
                          className="rounded-full px-2 py-0.5"
                          style={{ backgroundColor: `${levelColor}18` }}>
                          <Text className="text-[11px] font-bold" style={{ color: levelColor }}>
                            Lv.{child.level ?? 1}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? '#475569' : '#cbd5e1'}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
