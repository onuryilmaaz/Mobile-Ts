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
} from '@/screens/user';
import ProfileNavigator from './ProfileNavigator';
import type { HomeStackParamList, UserTabParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { HEADER_CONFIG } from './header.config';
import { useThemeStore } from '@/store/theme.store';
import { useAppTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator<HomeStackParamList>();

type HomeHeaderNavigationProp = CompositeNavigationProp<
  any,
  BottomTabNavigationProp<UserTabParamList>
>;

type HomeHeaderProps = {
  navigation: HomeHeaderNavigationProp;
};

function HomeHeader({ navigation }: HomeHeaderProps) {
  const headerColor = useThemeStore((s) => s.headerColor);
  const { user, isAuthenticated } = useAuthStore();
  const avatarUrl = user?.avatarUrl;
  const insets = useSafeAreaInsets();
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const { colors, isDark } = useAppTheme();

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
      style={{
        backgroundColor: colors.headerBg,
        paddingTop: finalStatusBarHeight,
        paddingHorizontal: 16,
        height: totalHeight,
        justifyContent: 'center',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.cardBorder,
      }}>
      {/* Subtle gradient glow at top */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: totalHeight,
          backgroundColor: 'rgba(20,184,166,0.04)',
          pointerEvents: 'none',
        }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Compass Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('QiblaFinder')}
          style={{
            height: 42,
            width: 42,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(20,184,166,0.35)',
            backgroundColor: 'rgba(20,184,166,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="compass" size={20} color="#14b8a6" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '900',
              letterSpacing: 1.5,
              color: '#f6c358',
              textShadowColor: 'rgba(246,195,88,0.4)',
              textShadowRadius: 8,
            }}>
            Salah
          </Text>
        </View>

        <TouchableOpacity
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white/20"
          onPress={() => {
            if (isAuthenticated) {
              navigation.navigate('Profile' as any, { screen: 'ProfileMain' });
            } else {
              navigation.navigate('Auth' as any);
            }
          }}>
          {isAuthenticated && avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ height: '100%', width: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={20} color="#14b8a6" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeNavigator() {
  const headerColor = useThemeStore((s) => s.headerColor);

  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
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
            headerTintColor: '#fff',
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
            headerTintColor: '#fff',
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
            headerTintColor: '#fff',
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
            headerTintColor: '#fff',
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="Challenges"
          component={ChallengeScreen}
          options={{
            headerShown: true,
            header: undefined,
            title: "Challenge'lar",
            headerStyle: { backgroundColor: headerColor },
            headerTintColor: '#fff',
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
