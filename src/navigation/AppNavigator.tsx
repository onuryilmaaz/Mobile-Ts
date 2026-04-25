import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import type { RootStackParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { SplashScreen } from '@/components/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  if (!hydrated) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="UserTabs" component={UserNavigator} />
      {!isAuthenticated && <Stack.Screen name="Auth" component={AuthNavigator} />}
    </Stack.Navigator>
  );
}
