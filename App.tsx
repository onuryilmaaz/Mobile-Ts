import './global.css';
import { useEffect } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AppNavigator } from '@/navigation';
import { ToastContainer } from '@/components/feedback/Toast';
import { AlertDialog } from '@/components/feedback/AlertDialog';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { setLogoutCallback, API_BASE_URL } from '@/services/api';
import { getAccessToken, getRefreshToken } from '@/services/token.service';
import { useColorScheme } from 'nativewind';
import { rootNavigationRef } from '@/navigation/rootNavigation';
import { liveActivityService } from '@/modules/liveActivity/liveActivity.service';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { gamificationApi } from '@/modules/gamification/gamification.api';

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
    // Sync API URL and any existing tokens to App Group so widget can call backend directly
    NativeModules.SalahLiveActivityModule?.updateAuthData?.({ apiUrl: API_BASE_URL });
    (async () => {
      const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
      if (accessToken || refreshToken) {
        NativeModules.SalahLiveActivityModule?.updateAuthData?.({
          accessToken: accessToken ?? '',
          refreshToken: refreshToken ?? '',
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const onForeground = async () => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;

      // Process any prayers the widget queued as fallback
      const raw = await liveActivityService.getPendingWidgetPrayers();
      if (raw) {
        for (const entry of raw.split(',').filter(Boolean)) {
          const [id, flag] = entry.split(':');
          try {
            await gamificationApi.trackPrayer(id as any, flag === 'kaza');
          } catch {
            // Silently ignore — prayer may already be tracked by widget's direct call
          }
        }
      }

      // Always refresh stats when app comes to foreground — widget may have written directly to DB
      useGamificationStore.getState().fetchStats();
    };
    onForeground();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') onForeground();
    });
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
    <NavigationContainer
      ref={rootNavigationRef}
      linking={linking}
      theme={isDark ? MyDarkTheme : MyLightTheme}>
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
