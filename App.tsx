import './global.css';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AppNavigator } from '@/navigation';
import { ToastContainer } from '@/components/feedback/Toast';
import { AlertDialog } from '@/components/feedback/AlertDialog';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { setLogoutCallback } from '@/services/api';
import { useColorScheme } from 'nativewind';
import { rootNavigationRef } from '@/navigation/rootNavigation';

function AppContent() {
  const isDark = useThemeStore((s) => s.isDark);
  const { setColorScheme, colorScheme } = useColorScheme();

  // Sync NativeWind, Android nav bar with theme store
  useEffect(() => {
    // Force sync NativeWind's colorScheme with our store
    if (isDark && colorScheme !== 'dark') {
      setColorScheme('dark');
    } else if (!isDark && colorScheme !== 'light') {
      setColorScheme('light');
    }

    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#0f172a' : '#ffffff');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, setColorScheme, colorScheme]);

  // Capture hidden stack traces for "missing navigation context" errors.
  useEffect(() => {
    const original = console.error;
    console.error = (...args: any[]) => {
      try {
        const first = args?.[0];
        const msg = typeof first === 'string' ? first : first instanceof Error ? first.message : '';
        if (msg?.includes("Couldn't find a navigation context")) {
          const err = first instanceof Error ? first : new Error(msg || 'missing nav context');
          original('NAV_DIAG:missing_context_stack', err.stack);
        }
      } catch {}
      return original(...args);
    };
    return () => {
      console.error = original;
    };
  }, []);

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <NavigationContainer ref={rootNavigationRef} theme={isDark ? DarkTheme : DefaultTheme}>
        <AppNavigator />
        <ToastContainer />
        <AlertDialog />
      </NavigationContainer>
    </View>
  );
}

function App() {
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useThemeStore((s) => s.hydrate);

  // Hydrate saved theme from AsyncStorage
  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
