import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen, UsersScreen, UserDetailScreen, RolesScreen } from '@/screens/admin';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f766e',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Admin Paneli',
        }}
      />
      <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Kullanıcılar' }} />
      <Stack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{ title: 'Kullanıcı Detayı' }}
      />
      <Stack.Screen name="Roles" component={RolesScreen} options={{ title: 'Roller' }} />
    </Stack.Navigator>
  );
}
