import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ForgotPasswordScreen,
  LoginScreen,
  OtpScreen,
  RegisterScreen,
  ResetPasswordScreen,
} from '@/screens/auth';
import type { AuthStackParamList } from './types';
import { StatusBar as RNStatusBar } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <RNStatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent={true} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </>
  );
}
