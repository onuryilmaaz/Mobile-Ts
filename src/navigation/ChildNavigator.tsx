import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ChildTabParamList } from './types';
import ChildTasksScreen from '@/screens/child/ChildTasksScreen';
import ChildRewardsScreen from '@/screens/child/ChildRewardsScreen';
import { useFamilyStore } from '@/modules/family/family.store';
import { useTheme } from '@/hooks/useTheme';

const Tab = createBottomTabNavigator<ChildTabParamList>();

export default function ChildNavigator() {
  const { childSession, exitChildMode } = useFamilyStore();
  const { isDark } = useTheme();
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch {
    insets = { top: 0, bottom: 0 };
  }

  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 16);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View
        className="w-full flex-row items-center justify-between bg-teal-600 dark:bg-teal-700 px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
            <Text style={{ fontSize: 20 }}>{childSession?.avatarEmoji ?? '🌙'}</Text>
          </View>
          <View>
            <Text className="text-base font-black text-white">{childSession?.childName ?? 'Çocuk Modu'}</Text>
            <Text className="text-[11px] font-bold text-white/70">Günlük Görevler</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            exitChildMode();
          }}
          className="flex-row items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5">
          <Ionicons name="exit-outline" size={14} color="white" />
          <Text className="text-sm font-bold text-white">Çıkış</Text>
        </TouchableOpacity>
      </View>

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isDark ? '#2dd4bf' : '#0f766e',
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
    </View>
  );
}
