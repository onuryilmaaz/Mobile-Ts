import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '@/components/layout/Screen';
import { useFamilyStore } from '@/modules/family/family.store';
import type { FamilyStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { TASK_TYPE_META } from '@/modules/family/family.types';

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

  const { children, tasks, childStats, fetchTasks, fetchChildStats, openChildMode } = useFamilyStore();
  const child = children.find((c) => c.id === childId);

  const [activeTab, setActiveTab] = useState<'tasks' | 'stats'>('tasks');
  const [pinVisible, setPinVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    fetchTasks(childId);
    fetchChildStats(childId);
  }, [childId]);

  if (!child) return null;

  const handleOpenChildMode = async () => {
    setPinError(false);
    setPinLoading(true);
    try {
      await openChildMode(childId, pin);
      setPinVisible(false);
      setPin('');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError(true);
    } finally {
      setPinLoading(false);
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
            <View className="h-20 w-20 items-center justify-center rounded-[24px] bg-teal-50 dark:bg-teal-500/10">
              <Text style={{ fontSize: 40 }}>{child.avatar_emoji}</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-xl font-black text-slate-900 dark:text-white">{child.name}</Text>
              <View className="flex-row gap-2">
                <View className="rounded-full bg-amber-50 px-2.5 py-1 dark:bg-amber-500/10">
                  <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">⭐ {child.total_stars ?? 0}</Text>
                </View>
                <View className="rounded-full bg-orange-50 px-2.5 py-1 dark:bg-orange-500/10">
                  <Text className="text-xs font-bold text-orange-600 dark:text-orange-400">🔥 {child.current_streak ?? 0} gün</Text>
                </View>
                <View className="rounded-full bg-teal-50 px-2.5 py-1 dark:bg-teal-500/15">
                  <Text className="text-xs font-bold text-teal-700 dark:text-teal-400">Lv.{child.level ?? 1}</Text>
                </View>
              </View>
            </View>

            {/* Aksiyon butonları */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setPinVisible(true);
                }}
                className="flex-row items-center gap-1.5 rounded-2xl bg-teal-600 px-4 py-2.5 dark:bg-teal-500">
                <Ionicons name="play" size={14} color="white" />
                <Text className="text-sm font-black text-white">Çocuk Modu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ChildReport', { childId })}
                className="flex-row items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <Ionicons name="bar-chart-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">Rapor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('RewardCatalog', { childId })}
                className="flex-row items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                <Ionicons name="gift-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ödüller</Text>
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
              className={`flex-1 py-3 items-center border-b-2 ${
                activeTab === tab
                  ? 'border-teal-600 dark:border-teal-400'
                  : 'border-transparent'
              }`}>
              <Text className={`text-sm font-bold ${
                activeTab === tab
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {tab === 'tasks' ? 'Görevler' : 'İstatistik'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="p-4 gap-3">
          {activeTab === 'tasks' ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('CreateTask', { childId });
                }}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-400 py-3 dark:border-teal-600">
                <Ionicons name="add-circle-outline" size={18} color={isDark ? '#2dd4bf' : '#0f766e'} />
                <Text className="text-sm font-bold text-teal-700 dark:text-teal-400">Yeni Görev Ekle</Text>
              </TouchableOpacity>

              {activeTasks.length === 0 ? (
                <View className="items-center gap-3 py-8">
                  <Ionicons name="clipboard-outline" size={40} color={isDark ? '#334155' : '#cbd5e1'} />
                  <Text className="text-slate-400 dark:text-slate-600">Henüz görev eklenmedi</Text>
                </View>
              ) : (
                activeTasks.map((task, i) => {
                  const meta = TASK_TYPE_META[task.task_type];
                  return (
                    <Animated.View key={task.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('EditTask', { childId, taskId: task.id })}
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
                          <Text className="font-bold text-slate-900 dark:text-white">{task.title}</Text>
                          <View className="mt-1 flex-row items-center gap-2">
                            <Text className="text-xs text-slate-500 dark:text-slate-400">
                              {task.recurrence === 'daily' ? 'Her gün' : task.recurrence === 'weekly' ? 'Haftalık' : 'Bir kez'}
                            </Text>
                            <Text className="text-xs text-amber-500">{'⭐'.repeat(Math.min(task.reward_stars, 5))}</Text>
                            {task.requires_approval && (
                              <View className="rounded-full bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                                <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Onay</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#cbd5e1'} />
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
                      { label: 'Toplam Yıldız', value: childStats.total_stars, emoji: '⭐', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
                      { label: 'Güncel Seri', value: `${childStats.current_streak}g`, emoji: '🔥', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
                      { label: 'En Uzun Seri', value: `${childStats.highest_streak}g`, emoji: '🏆', bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-700 dark:text-teal-400' },
                    ].map((item) => (
                      <View key={item.label} className={`flex-1 items-center rounded-2xl border border-slate-200 py-4 gap-1 dark:border-slate-800 ${item.bg}`}>
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
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-black text-slate-900 dark:text-white">
                        Lv.{childStats.level} — {childStats.level_name}
                      </Text>
                      {childStats.next_level_stars && (
                        <Text className="text-xs font-bold text-teal-600 dark:text-teal-400">
                          {childStats.next_level_stars - childStats.total_stars} ⭐ kaldı
                        </Text>
                      )}
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <View
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${childStats.next_level_stars ? Math.min(100, (childStats.total_stars / childStats.next_level_stars) * 100) : 100}%` }}
                      />
                    </View>
                  </View>

                  {childStats.badges.length > 0 && (
                    <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                      <SectionLabel>Rozetler</SectionLabel>
                      <View className="flex-row flex-wrap gap-3">
                        {childStats.badges.map((b) => (
                          <View key={b.badge_type} className="items-center gap-1 w-14">
                            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
                              <Text style={{ fontSize: 26 }}>{b.emoji ?? '🏅'}</Text>
                            </View>
                            <Text className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400" numberOfLines={2}>
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

      {/* PIN Modal */}
      <Modal visible={pinVisible} transparent animationType="slide" onRequestClose={() => setPinVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[32px] border-t border-slate-200 bg-white p-6 pb-10 dark:border-slate-700 dark:bg-slate-800">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-xl font-black text-slate-900 dark:text-white">Çocuk Modunu Aç</Text>
              <TouchableOpacity
                onPress={() => { setPinVisible(false); setPin(''); setPinError(false); }}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900/40">
                <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#475569'} />
              </TouchableOpacity>
            </View>

            <View className="mb-2 items-center">
              <Text style={{ fontSize: 36 }} className="mb-1">{child.avatar_emoji}</Text>
              <Text className="text-sm text-slate-500 dark:text-slate-400">{child.name} için PIN girin</Text>
            </View>

            <TextInput
              value={pin}
              onChangeText={(t) => { setPin(t.replace(/\D/g, '').slice(0, 4)); setPinError(false); }}
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              autoFocus
              className={`mb-2 rounded-2xl border px-4 py-4 text-center text-2xl tracking-widest text-slate-900 dark:text-white ${
                pinError
                  ? 'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
              }`}
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
            {pinError && (
              <Text className="mb-3 text-center text-xs font-bold text-red-500 dark:text-red-400">
                Hatalı PIN, tekrar dene
              </Text>
            )}

            <TouchableOpacity
              onPress={handleOpenChildMode}
              disabled={pinLoading || pin.length !== 4}
              className={`mt-2 rounded-2xl py-4 items-center ${
                pinLoading || pin.length !== 4
                  ? 'bg-slate-200 dark:bg-slate-700'
                  : 'bg-teal-600 dark:bg-teal-500'
              }`}>
              <Text className={`font-black text-base ${
                pinLoading || pin.length !== 4 ? 'text-slate-400 dark:text-slate-500' : 'text-white'
              }`}>
                {pinLoading ? 'Açılıyor...' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
