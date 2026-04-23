import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Share, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/layout/Screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const STORAGE_KEY = 'DHIKR_TOTAL_COUNT';

export default function DhikrScreen() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    loadTotal();
  }, []);

  const loadTotal = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) setTotalSessions(parseInt(saved));
  };

  const saveTotal = async (newTotal: number) => {
    await AsyncStorage.setItem(STORAGE_KEY, newTotal.toString());
  };

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    const nextCount = count + 1;
    setCount(nextCount);

    const nextTotal = totalSessions + 1;
    setTotalSessions(nextTotal);
    saveTotal(nextTotal);

    if (nextCount % target === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    scale.value = withSequence(
      withTiming(0.92, { duration: 50 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    progress.value = withTiming(nextCount / target, { duration: 300 });
  }, [count, target, scale, progress]);

  const resetCount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCount(0);
    progress.value = withTiming(0, { duration: 500 });
  };

  const PRESETS = [
    { name: 'Subhânallâh', target: 33 },
    { name: 'Elhamdülillâh', target: 33 },
    { name: 'Allâhu Ekber', target: 33 },
    { name: 'Lâ ilâhe illallâh', target: 100 },
  ];

  const [activePreset, setActivePreset] = useState(0);

  const selectPreset = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivePreset(index);
    setTarget(PRESETS[index].target);
    setCount(0);
    progress.value = 0;
  };

  const cycleTarget = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targets = [33, 99, 100, 500, 1000];
    const currentIndex = targets.indexOf(target);
    const nextIndex = (currentIndex + 1) % targets.length;
    setTarget(targets[nextIndex]);
    setCount(0);
    progress.value = 0;
  };

  const shareProgress = async () => {
    try {
      await Share.share({
        message: `Salah uygulaması ile bugün ${count} zikir çektim! 📿`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Screen className="bg-slate-50" safeAreaEdges={['left', 'right', 'bottom']}>
      <View className="flex-1 items-center justify-center px-6 py-8">
        <View className="mb-10 mt-4 w-full">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
            {PRESETS.map((preset, idx) => (
              <TouchableOpacity
                key={preset.name}
                onPress={() => selectPreset(idx)}
                className={`mr-3 rounded-2xl border px-5 py-3 ${
                  activePreset === idx
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-slate-100 bg-white'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    activePreset === idx ? 'text-primary-700' : 'text-slate-500'
                  }`}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mb-10 items-center gap-3">
          <View className="flex-row items-center gap-2 rounded-full bg-primary-100 px-4 py-2">
            <Ionicons name="flag" size={16} color="#0f766e" />
            <Text className="text-sm font-bold text-primary-700">Hedef: {target}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Toplam:
            </Text>
            <Text className="text-sm font-black text-slate-600">
              {totalSessions.toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          className="items-center justify-center">
          <Animated.View
            style={[
              {
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: CIRCLE_SIZE / 2,
              },
              animatedStyle,
            ]}
            className="items-center justify-center border-8 border-slate-100 bg-white shadow-2xl shadow-primary-900/10">
            <View className="items-center">
              <Text className="text-7xl font-black text-slate-800">{count}</Text>
              <Text className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Zikir
              </Text>
            </View>

            <View
              style={{
                position: 'absolute',
                width: CIRCLE_SIZE - 20,
                height: CIRCLE_SIZE - 20,
                borderRadius: (CIRCLE_SIZE - 20) / 2,
                borderWidth: 2,
                borderColor: '#f1f5f9',
                borderStyle: 'dashed',
              }}
            />
          </Animated.View>
        </TouchableOpacity>

        <View className="mt-12 w-full flex-row justify-around">
          <TouchableOpacity
            onPress={cycleTarget}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
            <Ionicons name="options-outline" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetCount}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
            <Ionicons name="refresh-outline" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={shareProgress}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
            <Ionicons name="share-social-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-center text-sm font-medium text-slate-400">
          Zikir çekmek için halkaya dokunun
        </Text>
      </View>
    </Screen>
  );
}
