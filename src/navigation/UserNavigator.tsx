import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminNavigator from './AdminNavigator';
import HomeNavigator from './HomeNavigator';
import SurahsNavigator from './SurahsNavigator';
import { DhikrScreen } from '@/screens/user';
import { GamificationScreen } from '@/screens/user';
import type { RootStackParamList, UserTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { AuthWallModal } from '@/components/layout/AuthWallModal';
import { useState } from 'react';
import { useThemeStore } from '@/store/theme.store';

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserNavigator() {
  const { user, isAuthenticated } = useAuthStore();
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (error) {
    insets = { top: 0, bottom: 0, left: 0, right: 0 };
  }
  const { isDark } = useThemeStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', description: '' });

  const isAdmin =
    user?.roles?.some((role: any) => {
      const r = typeof role === 'string' ? role : role?.name;
      return r === 'admin' || r === 'superadmin';
    }) ?? false;

  const handleTabPress = (e: any, title: string, description: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setModalConfig({ title, description });
      setShowAuthModal(true);
    }
  };

  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 16);
  const tabBarHeight = 56 + bottomPadding;

  const tabBarBg = isDark ? '#0f172a' : '#ffffff';
  const tabBarBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
  const tabActive = isDark ? '#14b8a6' : '#0f766e';
  const tabInactive = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={{ flex: 1 }}>
      <AuthWallModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={modalConfig.title}
        description={modalConfig.description}
      />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: tabActive,
          tabBarInactiveTintColor: tabInactive,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopWidth: 1,
            borderTopColor: tabBarBorder,
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.4 : 0.08,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.3,
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeNavigator}
          options={{
            tabBarLabel: 'Ana Sayfa',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Surahs"
          component={SurahsNavigator}
          listeners={{
            tabPress: (e) =>
              handleTabPress(
                e,
                "Kur'an-ı Kerim İçin Giriş Yapın",
                'Sureleri okumak, mealleri incelemek ve kaldığınız yeri kaydetmek için lütfen oturum açın.'
              ),
          }}
          options={{
            tabBarLabel: 'Sureler',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Dhikr"
          component={DhikrScreen}
          options={{
            tabBarLabel: 'Zikir',
            headerShown: true,
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Zikir" showBackButton={false} />
            ),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="apps-outline" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Gamification"
          component={GamificationScreen}
          listeners={{
            tabPress: (e) =>
              handleTabPress(
                e,
                'Başarılar İçin Giriş Yapın',
                'Puan, rozet ve sıralama özelliklerini kullanmak için lütfen oturum açın.'
              ),
          }}
          options={{
            tabBarLabel: 'Başarılar',
            headerShown: true,
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Başarılar" showBackButton={false} />
            ),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy-outline" size={size} color={color} />
            ),
          }}
        />

        {isAdmin && (
          <Tab.Screen
            name="AdminStack"
            component={AdminNavigator}
            options={{
              tabBarLabel: 'Admin',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="shield-checkmark-outline" size={size} color={color} />
              ),
            }}
          />
        )}
      </Tab.Navigator>
    </View>
  );
}
