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
import { HomeScreen, QiblaFinderScreen, LocationSelectionScreen } from '@/screens/user';
import type { HomeStackParamList, UserTabParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { HEADER_CONFIG } from './header.config';
import { useThemeStore } from '@/store/theme.store';
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
        backgroundColor: headerColor,
        paddingTop: finalStatusBarHeight,
        paddingBottom: 0,
        paddingHorizontal: 16,
        height: totalHeight,
        justifyContent: 'center',
        width: '100%',
      }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <TouchableOpacity
            onPress={() => navigation.navigate('QiblaFinder')}
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white/20">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Ionicons name="compass" size={20} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (isAuthenticated) {
              const parent = navigation.getParent();
              if (parent) {
                (parent as any).navigate('Profile', { screen: 'ProfileMain' });
              }
            }
            // isAuthenticated false ise AppNavigator zaten Auth ekranını gösterir
          }}
          className={`h-12 ${
            !isAuthenticated ? 'px-4' : 'w-12'
          } items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white/20`}>
          {!isAuthenticated ? (
            <Text className="font-semibold text-white">Giriş Yap</Text>
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={24} color="white" />
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
      </Stack.Navigator>
    </>
  );
}
