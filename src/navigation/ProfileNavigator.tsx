import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProfileStackParamList } from './types';
import {
  ProfileScreen,
  ChangePasswordScreen,
  ChangeEmailScreen,
  SessionsScreen,
  AccountScreen,
} from '@/screens/user';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor="#0f766e" translucent={false} />
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#0f766e',
            elevation: 0,
            shadowOpacity: 0,
          },
          ...(Platform.OS === 'android' && { headerStatusBarHeight: 0 }),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="-ml-1 flex-row items-center py-2 pr-3"
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
              <Text className="-ml-0.5 text-base font-medium text-white">Geri</Text>
            </TouchableOpacity>
          ),
        })}>
        <Stack.Screen
          name="ProfileMain"
          component={ProfileScreen}
          options={{
            title: 'Profil',
            headerShown: true,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: 'Şifre Değiştir' }}
        />
        <Stack.Screen
          name="ChangeEmail"
          component={ChangeEmailScreen}
          options={{ title: 'E-posta Değiştir' }}
        />
        <Stack.Screen name="Sessions" component={SessionsScreen} options={{ title: 'Oturumlar' }} />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'Hesap' }} />
      </Stack.Navigator>
    </>
  );
}
