import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { HomeScreen } from '@/screens/user';
import AdminNavigator from './AdminNavigator';
import ProfileNavigator from './ProfileNavigator';
import type { UserTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserNavigator() {
  const user = useAuthStore((s) => s.user);

  const isAdmin =
    user?.roles?.some((role: any) => {
      const r = typeof role === 'string' ? role : role?.name;
      return r === 'admin' || r === 'superadmin';
    }) ?? false;

  console.log('UserNavigator - User Roles:', user?.roles, 'IsAdmin:', isAdmin);

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
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
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

      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
