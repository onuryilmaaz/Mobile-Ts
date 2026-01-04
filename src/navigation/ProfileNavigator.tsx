import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import type { ProfileStackParamList } from './types';
import {
  ProfileScreen,
  ChangePasswordScreen,
  ChangeEmailScreen,
  SessionsScreen,
  AccountScreen,
} from '@/screens/user';
import { HEADER_CONFIG } from './header.config';
import { StandardHeader } from '@/components/layout/StandardHeader';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="ProfileMain"
          component={ProfileScreen}
          options={{
            header: () => <StandardHeader title="Profil" showBackButton={false} />,
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{
            header: () => <StandardHeader title="Şifre Değiştir" />,
          }}
        />
        <Stack.Screen
          name="ChangeEmail"
          component={ChangeEmailScreen}
          options={{
            header: () => <StandardHeader title="E-posta Değiştir" />,
          }}
        />
        <Stack.Screen
          name="Sessions"
          component={SessionsScreen}
          options={{
            header: () => <StandardHeader title="Oturumlar" />,
          }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            header: () => <StandardHeader title="Hesap" />,
          }}
        />
      </Stack.Navigator>
    </>
  );
}
