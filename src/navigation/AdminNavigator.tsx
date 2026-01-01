import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen, UsersScreen, UserDetailScreen, RolesScreen } from '@/screens/admin';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor="#0f766e" translucent={false} />
      <Stack.Navigator
        screenOptions={({ navigation, route }) => ({
          headerStyle: {
            backgroundColor: '#0f766e',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          ...(Platform.OS === 'android' && { headerStatusBarHeight: 0 }),
          headerLeft:
            route.name !== 'Dashboard'
              ? () => (
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="-ml-1 flex-row items-center py-2 pr-3"
                    activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color="#ffffff" />
                    <Text className="-ml-0.5 text-base font-medium text-white">Geri</Text>
                  </TouchableOpacity>
                )
              : undefined,
        })}>
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Admin Paneli' }}
        />
        <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Kullanıcılar' }} />
        <Stack.Screen
          name="UserDetail"
          component={UserDetailScreen}
          options={{ title: 'Kullanıcı Detayı' }}
        />
        <Stack.Screen name="Roles" component={RolesScreen} options={{ title: 'Roller' }} />
      </Stack.Navigator>
    </>
  );
}
