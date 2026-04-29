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
            header: ({ navigation }) => (
              <StandardHeader
                navigation={navigation}
                title="Profil"
                showBackButton={false}
                showProfile={false}
              />
            ),
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Şifre Değiştir" />
            ),
          }}
        />
        <Stack.Screen
          name="ChangeEmail"
          component={ChangeEmailScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="E-posta Değiştir" />
            ),
          }}
        />
        <Stack.Screen
          name="Sessions"
          component={SessionsScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Oturumlar" />
            ),
          }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Hesap" />
            ),
          }}
        />
      </Stack.Navigator>
    </>
  );
}
