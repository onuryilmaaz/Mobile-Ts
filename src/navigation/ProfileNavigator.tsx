import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { 
  ProfileScreen, 
  ChangePasswordScreen, 
  ChangeEmailScreen, 
  SessionsScreen, 
  AccountScreen 
} from '@/screens/user';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Geri',
        headerTintColor: '#0f766e',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ 
          title: 'Profil',
          headerShown: false,
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
      <Stack.Screen 
        name="Sessions" 
        component={SessionsScreen}
        options={{ title: 'Oturumlar' }}
      />
      <Stack.Screen 
        name="Account" 
        component={AccountScreen}
        options={{ title: 'Hesap' }}
      />
    </Stack.Navigator>
  );
}

