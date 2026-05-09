import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import type { RootStackParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { SplashScreen } from '@/components/SplashScreen';
import { useOnboardingStore } from '@/store/onboarding.store';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();
  const {
    done: onboardingDone,
    hydrated: onboardingHydrated,
    hydrate: hydrateOnboarding,
  } = useOnboardingStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (!onboardingHydrated) hydrateOnboarding();
  }, [onboardingHydrated, hydrateOnboarding]);

  if (!hydrated || !onboardingHydrated) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={onboardingDone ? 'UserTabs' : 'Onboarding'}
      screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="UserTabs" component={UserNavigator} />
      {!isAuthenticated && <Stack.Screen name="Auth" component={AuthNavigator} />}
    </Stack.Navigator>
  );
}
