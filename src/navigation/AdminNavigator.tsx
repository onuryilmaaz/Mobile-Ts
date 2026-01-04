import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { DashboardScreen, UsersScreen, UserDetailScreen, RolesScreen } from '@/screens/admin';
import type { AdminStackParamList } from './types';
import { StandardHeader } from '@/components/layout/StandardHeader';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            header: () => <StandardHeader title="Admin Paneli" showBackButton={false} />,
          }}
        />
        <Stack.Screen
          name="Users"
          component={UsersScreen}
          options={{
            header: () => <StandardHeader title="Kullanıcılar" />,
          }}
        />
        <Stack.Screen
          name="UserDetail"
          component={UserDetailScreen}
          options={{
            header: () => <StandardHeader title="Kullanıcı Detayı" />,
          }}
        />
        <Stack.Screen
          name="Roles"
          component={RolesScreen}
          options={{
            header: () => <StandardHeader title="Roller" />,
          }}
        />
      </Stack.Navigator>
    </>
  );
}
