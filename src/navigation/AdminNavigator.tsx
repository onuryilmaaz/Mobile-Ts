import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { DashboardScreen, UsersScreen, UserDetailScreen, RolesScreen } from '@/screens/admin';
import type { AdminStackParamList } from './types';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  const { isDark } = useTheme();

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
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Admin Paneli" showBackButton={false} />
            ),
          }}
        />
        <Stack.Screen
          name="Users"
          component={UsersScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Kullanıcılar" />
            ),
          }}
        />
        <Stack.Screen
          name="UserDetail"
          component={UserDetailScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Kullanıcı Detayı" />
            ),
          }}
        />
        <Stack.Screen
          name="Roles"
          component={RolesScreen}
          options={{
            header: ({ navigation }) => <StandardHeader navigation={navigation} title="Roller" />,
          }}
        />
      </Stack.Navigator>
    </>
  );
}
