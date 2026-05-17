import './global.css';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AppNavigator } from '@/navigation';
import { ToastContainer } from '@/components/feedback/Toast';
import { AlertDialog } from '@/components/feedback/AlertDialog';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { setLogoutCallback } from '@/services/api';
import { useColorScheme } from 'nativewind';
import { rootNavigationRef } from '@/navigation/rootNavigation';
import { liveActivityService } from '@/modules/liveActivity/liveActivity.service';
import { useGamificationStore } from '@/modules/gamification/gamification.store';

const linking = {
  prefixes: ['com.onur6541.salah://', 'salah://'],
  config: {
    screens: {
      UserTabs: {
        screens: {
          Home: {
            screens: {
              HomeMain: {
                path: 'home',
              },
            },
            path: 'prayer',
          },
          Tracker: {
            screens: {
              TrackerMain: {
                path: 'tracker/:type?',
                parse: { type: (t: string) => t },
              },
            },
          },
        },
      },
    },
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0f172a',
    card: '#0f172a',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.1)',
  },
};

const MyLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    border: '#f1f5f9',
  },
};

function AppContent() {
  const isDark = useThemeStore((s) => s.isDark);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const syncPending = async () => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;
      const raw = await liveActivityService.getPendingWidgetPrayers();
      if (!raw) return;
      const { trackPrayer } = useGamificationStore.getState();
      for (const entry of raw.split(',').filter(Boolean)) {
        const [id, flag] = entry.split(':');
        try { await trackPrayer(id as any, flag === 'kaza'); } catch { /* already tracked */ }
      }
    };
    syncPending();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') syncPending(); });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');

    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#0f172a' : '#ffffff');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, setColorScheme]);

  return (
    <NavigationContainer ref={rootNavigationRef} linking={linking} theme={isDark ? MyDarkTheme : MyLightTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

function App() {
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppContent />
      <ToastContainer />
      <AlertDialog />
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
