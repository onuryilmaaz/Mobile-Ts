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
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/screens/user';
import type { HomeStackParamList, UserTabParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { HEADER_CONFIG } from './header.config';

const Stack = createNativeStackNavigator<HomeStackParamList>();

type HomeHeaderNavigationProp = CompositeNavigationProp<
  any,
  BottomTabNavigationProp<UserTabParamList>
>;

function HomeHeader() {
  const user = useAuthStore((s) => s.user);
  const avatarUrl = user?.avatarUrl;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeHeaderNavigationProp>();

  // Tüm cihazlarda aynı header yüksekliği: 56px
  const headerHeight = HEADER_CONFIG.height;
  // Status bar yüksekliği: Android'de 0 (status bar ayrı), iOS'ta safe area top
  const statusBarHeight = Platform.OS === 'android' ? 0 : insets.top;
  // Toplam yükseklik: status bar + header
  const totalHeight = statusBarHeight + headerHeight;

  return (
    <View
      style={{
        backgroundColor: HEADER_CONFIG.backgroundColor,
        paddingTop: statusBarHeight,
        paddingBottom: 0,
        paddingHorizontal: 16,
        height: totalHeight,
        justifyContent: 'center',
        width: '100%',
      }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-white">Hoş geldin, 👋</Text>
          <Text className="text-xl font-bold text-white">{user?.firstName || 'Kullanıcı'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              (parent as any).navigate('Profile', { screen: 'ProfileMain' });
            }
          }}
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-teal-300 bg-teal-100">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <Text className="text-xl">👤</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeNavigator() {
  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor={HEADER_CONFIG.backgroundColor} translucent={false} />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          header: () => <HomeHeader />,
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
      </Stack.Navigator>
    </>
  );
}
