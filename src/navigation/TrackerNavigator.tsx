import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar, TouchableOpacity } from 'react-native';
import { TrackerScreen, GamificationScreen, KazaTrackerScreen, StatsScreen } from '@/screens/user';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import type { TrackerStackParamList } from './types';

const Stack = createNativeStackNavigator<TrackerStackParamList>();

export default function TrackerNavigator() {
  const { isDark } = useTheme();
  const headerColor = isDark ? '#0f172a' : '#ffffff';
  const headerTintColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <>
      <RNStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator screenOptions={{ headerShown: true, headerShadowVisible: false }}>
        <Stack.Screen
          name="TrackerMain"
          component={TrackerScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader
                navigation={navigation}
                title="İbadet Defteri"
                showBackButton={false}
                rightComponent={
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('Gamification')}
                    className="h-11 w-11 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                    <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
                  </TouchableOpacity>
                }
              />
            ),
          }}
        />
        <Stack.Screen
          name="Gamification"
          component={GamificationScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Başarılar" backTitle="Defterim" />
            ),
          }}
        />
        <Stack.Screen
          name="KazaTracker"
          component={KazaTrackerScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Kaza Namazlar',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'İstatistikler',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
      </Stack.Navigator>
    </>
  );
}
