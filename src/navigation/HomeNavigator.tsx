/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Platform,
  StatusBar as RNStatusBar,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useState, useEffect } from 'react';
import {
  HomeScreen,
  QiblaFinderScreen,
  LocationSelectionScreen,
  KazaTrackerScreen,
  StatsScreen,
  ChallengeScreen,
  MosqueMapScreen,
  DuaScreen,
  HijriCalendarScreen,
  SettingsScreen,
  RamadanScreen,
} from '@/screens/user';
import ProfileNavigator from './ProfileNavigator';
import type { HomeStackParamList, UserTabParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { HEADER_CONFIG } from './header.config';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Bungee_400Regular } from '@expo-google-fonts/bungee';

const Stack = createNativeStackNavigator<HomeStackParamList>();

type HomeHeaderNavigationProp = CompositeNavigationProp<
  any,
  BottomTabNavigationProp<UserTabParamList>
>;

type HomeHeaderProps = {
  navigation: HomeHeaderNavigationProp;
};

function HomeHeader({ navigation }: HomeHeaderProps) {
  const { user, isAuthenticated } = useAuthStore();
  const avatarUrl = user?.avatarUrl;
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (error) {
    insets = { top: 0, bottom: 0, left: 0, right: 0 };
  }
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const height = RNStatusBar.currentHeight || 0;
      setStatusBarHeight(height);
    }
  }, []);

  const headerHeight = HEADER_CONFIG.height;
  const finalStatusBarHeight = Platform.OS === 'android' ? statusBarHeight : insets.top;
  const totalHeight = finalStatusBarHeight + headerHeight;

  return (
    <View
      className="w-full justify-center border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      style={{
        paddingTop: finalStatusBarHeight,
        paddingHorizontal: 16,
        height: totalHeight,
      }}>
      {isDark && (
        <View
          className="pointer-events-none absolute inset-0 bg-teal-500/5"
          style={{ height: totalHeight }}
        />
      )}

      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.navigate('QiblaFinder')}
          className="h-[42px] w-[42px] items-center justify-center rounded-full border border-teal-600/20 bg-teal-600/5 dark:border-teal-500/35 dark:bg-teal-500/10">
          <Ionicons name="compass" size={20} color={isDark ? '#14b8a6' : '#0f766e'} />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text
            className="text-4xl font-black tracking-widest text-amber-500"
            style={{
              fontFamily: 'Bungee-Regular',
              textShadowColor: 'rgba(246,195,88,0.4)',
              textShadowRadius: 8,
            }}>
            Salah
          </Text>
        </View>

        <TouchableOpacity
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-teal-600 bg-teal-600/5 dark:border-white"
          onPress={() => {
            if (isAuthenticated) {
              navigation.navigate('Profile' as any, { screen: 'ProfileMain' });
            } else {
              navigation.navigate('Auth' as any);
            }
          }}>
          {isAuthenticated && avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={20} color={isDark ? '#14b8a6' : '#0f766e'} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeNavigator() {
  const { isDark } = useTheme();
  const headerColor = isDark ? '#0f172a' : '#ffffff';
  const headerTintColor = isDark ? '#ffffff' : '#0f172a';
  useFonts({
    'Bungee-Regular': Bungee_400Regular,
  });

  return (
    <>
      <RNStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          header: ({ navigation }) => <HomeHeader navigation={navigation as any} />,
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="HomeMain"
          component={HomeScreen}
          options={{
            title: 'Ana Sayfa',
          }}
        />
        <Stack.Screen
          name="QiblaFinder"
          component={QiblaFinderScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Kıble Bulucu',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="LocationSelection"
          component={LocationSelectionScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Konum Seç',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
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
        <Stack.Screen
          name="Challenges"
          component={ChallengeScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Meydan Okumalar',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="MosqueMap"
          component={MosqueMapScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Cami Atlası',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="Dua"
          component={DuaScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Dua Koleksiyonu',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="HijriCalendar"
          component={HijriCalendarScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Hicri Takvim',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Ayarlar',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="Ramadan"
          component={RamadanScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: 'Ramazan',
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: headerTintColor,
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileNavigator}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </>
  );
}
