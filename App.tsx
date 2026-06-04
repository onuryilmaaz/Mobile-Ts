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
import { userApi } from '@/modules/user/user.api';
import { useColorScheme } from 'nativewind';
import { rootNavigationRef } from '@/navigation/rootNavigation';
import { liveActivityService } from '@/modules/liveActivity/liveActivity.service';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { gamificationApi } from '@/modules/gamification/gamification.api';
import { useTrackerStore } from '@/modules/tracker/tracker.store';
import { trackerApi } from '@/modules/tracker/tracker.api';
import * as Notifications from 'expo-notifications';
import { adhanService } from '@/services/adhan.service';
import type { AdhanPrayerKey } from '@/services/adhan.service';
import { useAdhanStore } from '@/services/adhan.store';
import AdhanModal from '@/components/home/AdhanModal';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

function buildGoalCompleteValue(activity: string, target: number): Record<string, any> {
  switch (activity) {
    case 'quran':        return { pages: target };
    case 'dhikr':        return { subtype: 'Genel', count: target };
    case 'nafile':       return { type: 'diger', rakaat: target };
    case 'fasting':      return { type: 'nafile' };
    case 'dua':          return { type: 'Genel', minutes: target };
    case 'memorization': return { new_ayets: target, revision_ayets: 0 };
    default:             return { count: target };
  }
}

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '25385d71-03c1-4862-aeda-a8899b6d35d8',
        });
        await userApi.savePushToken(tokenData.data);
      } catch {
        // Push token kaydı başarısız olsa uygulama çalışmaya devam eder
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    (async () => {
      const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
      liveActivityService.setApiCredentials({
        apiUrl: API_BASE_URL,
        accessToken: accessToken ?? '',
        refreshToken: refreshToken ?? '',
      });
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const onForeground = async () => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;

      // Refresh credentials on every foreground (token may have been refreshed)
      const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);
      liveActivityService.setApiCredentials({
        apiUrl: API_BASE_URL,
        accessToken: accessToken ?? '',
        refreshToken: refreshToken ?? '',
      });

      // 1. Pending prayers (Live Activity widget)
      const prayerRaw = await liveActivityService.getPendingWidgetPrayers();
      if (prayerRaw) {
        for (const entry of prayerRaw.split(',').filter(Boolean)) {
          const [id, flag] = entry.split(':');
          try {
            await gamificationApi.trackPrayer(id as any, flag === 'kaza');
          } catch (e: any) {
            if (e?.response?.status !== 400) {
              console.warn('Failed to track prayer for live activity widget:', id);
            }
          }
        }
      }

      // 2. Pending goals (Goals widget) — widget'tan eklenen ama API'ye yetişemeyen kayıtlar
      const goalsRaw = await liveActivityService.getPendingGoals();
      if (goalsRaw) {
        for (const entry of goalsRaw.split(',').filter(Boolean)) {
          const [activity, targetStr] = entry.split(':');
          const target = parseInt(targetStr ?? '0');
          if (!activity || !target) continue;
          try {
            await trackerApi.logActivity({
              activity_type: activity as any,
              value: buildGoalCompleteValue(activity, target),
            });
          } catch (e: any) {
            console.warn('Failed to sync pending goal:', activity, e?.message);
          }
        }
        liveActivityService.clearPendingGoals();
      }

      // 3. Refresh tracker logs (reflects both pending sync + any widget-fast-path success)
      await useTrackerStore.getState().fetchTodayLogs();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <AppContent />
          <ToastContainer />
          <AlertDialog />
        </SafeAreaProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
