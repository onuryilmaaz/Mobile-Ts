import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminNavigator from './AdminNavigator';
import HomeNavigator from './HomeNavigator';
import SurahsNavigator from './SurahsNavigator';
import { DhikrScreen, GamificationScreen } from '@/screens/user';
import type { UserTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { StandardHeader } from '@/components/layout/StandardHeader';

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserNavigator() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const isAdmin =
    user?.roles?.some((role: any) => {
      const r = typeof role === 'string' ? role : role?.name;
      return r === 'admin' || r === 'superadmin';
    }) ?? false;

  console.log('UserNavigator - User Roles:', user?.roles, 'IsAdmin:', isAdmin);

  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 16);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
        options={{
          tabBarLabel: 'İlerleme',
          headerShown: true,
          header: () => <StandardHeader title="Manevi Karne" showBackButton={false} />,
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
  );
}
