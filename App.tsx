/* eslint-disable react-hooks/exhaustive-deps */
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
import * as Notifications from 'expo-notifications';
import { adhanService } from '@/services/adhan.service';
import type { AdhanPrayerKey } from '@/services/adhan.service';
import { useAdhanStore } from '@/services/adhan.store';
import AdhanModal from '@/components/home/AdhanModal';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const _warn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Clerk has been loaded with development keys')
  )
    return;
  _warn(...args);
};

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('SecureStore save item error: ', err);
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

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
  const adhanPrayer = useAdhanStore((s) => s.activePrayer);
  const showAdhan = useAdhanStore((s) => s.show);
  const hideAdhan = useAdhanStore((s) => s.hide);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
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

      const raw = await liveActivityService.getPendingWidgetPrayers();
      if (raw) {
        for (const entry of raw.split(',').filter(Boolean)) {
          const [id, flag] = entry.split(':');
          try {
            await gamificationApi.trackPrayer(id as any, flag === 'kaza');
          } catch {
            console.warn('Failed to track prayer for live activity widget:', id);
          }
        }
      }

      useGamificationStore.getState().fetchStats();
    };
    onForeground();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') onForeground();
      if (s === 'background' || s === 'inactive') {
        adhanService.stop();
        hideAdhan();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const playIfEnabled = async (data: any) => {
      if (data?.type === 'prayer_time' && data?.prayerKey) {
        const enabled = await adhanService.isAdhanEnabled(data.prayerKey as AdhanPrayerKey);
        if (enabled) {
          await adhanService.playAdhan(data.prayerKey as AdhanPrayerKey);
          showAdhan(data.prayerKey as AdhanPrayerKey, data.prayerName ?? data.prayerKey);
        }
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      playIfEnabled(notification.request.content.data);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      playIfEnabled(response.notification.request.content.data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [showAdhan]);

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
      <AdhanModal
        visible={adhanPrayer !== null}
        prayerName={adhanPrayer?.name ?? ''}
        onDismiss={hideAdhan}
      />
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
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppContent />
        <ToastContainer />
        <AlertDialog />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

registerRootComponent(App);
