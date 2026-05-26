import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import ChildNavigator from './ChildNavigator';
import type { RootStackParamList } from './types';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useFamilyStore } from '@/modules/family/family.store';
import { SplashScreen } from '@/components/SplashScreen';
import { useOnboardingStore } from '@/store/onboarding.store';
import OnboardingScreen from '@/screens/onboarding/OnboardingScreen';
import ProfileSelectionScreen from '@/screens/ProfileSelectionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();
  const {
    childSession,
    parentModeActive,
    hydrated: familyHydrated,
    hydrate: hydrateFamily,
    resetParentMode,
  } = useFamilyStore();
  const { done: onboardingDone, hydrated: onboardingHydrated, hydrate: hydrateOnboarding } = useOnboardingStore();

  useEffect(() => { if (!hydrated) hydrate(); }, [hydrate, hydrated]);
  useEffect(() => { if (!onboardingHydrated) hydrateOnboarding(); }, [onboardingHydrated, hydrateOnboarding]);
  useEffect(() => { if (!familyHydrated) hydrateFamily(); }, [familyHydrated, hydrateFamily]);

  // Oturum kapanınca aile durumunu temizle
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      const store = useFamilyStore.getState();
      if (store.childSession) store.exitChildMode();
      if (store.parentModeActive) resetParentMode();
    }
  }, [isAuthenticated, hydrated]);

  if (!hydrated || !onboardingHydrated || !familyHydrated) {
    return <SplashScreen />;
  }

  // 1. Çocuk oturumu aktif
  if (childSession) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="ChildMode" component={ChildNavigator} />
      </Stack.Navigator>
    );
  }

  // 2. İlk açılış — onboarding (sadece bir kez)
  if (!onboardingDone) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  // 3. Giriş yapılmamış → auth
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // 4. Giriş yapılmış + profil henüz seçilmemiş → profil seçimi
  //    (ProfileSelectionScreen çocuk yoksa otomatik parent mode'a geçer)
  if (!parentModeActive) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} />
      </Stack.Navigator>
    );
  }

  // 5. Ebeveyn modu — ana uygulama
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="UserTabs" component={UserNavigator} />
    </Stack.Navigator>
  );
}
