import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminNavigator from './AdminNavigator';
import HomeNavigator from './HomeNavigator';
import SurahsNavigator from './SurahsNavigator';
import { DhikrScreen } from '@/screens/user';
import { GamificationScreen } from '@/screens/user';
import type { UserTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { AuthWallModal } from '@/components/layout/AuthWallModal';
import { useState } from 'react';
import { useAppTheme } from '@/constants/theme';

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserNavigator() {
  const { user, isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
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

  return (
    <View className="flex-1">
      <AuthWallModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={modalConfig.title}
        description={modalConfig.description}
      />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor:   colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.tabBarBorder,
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.40 : 0.08,
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
            header: () => <StandardHeader title="Zikir" showBackButton={false} />,
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
            header: () => <StandardHeader title="Başarılar" showBackButton={false} />,
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
