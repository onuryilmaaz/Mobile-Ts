import './global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AppNavigator } from '@/navigation';
import { ToastContainer } from '@/components/feedback/Toast';
import { AlertDialog } from '@/components/feedback/AlertDialog';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { setLogoutCallback } from '@/services/api';

function App() {
  const logout   = useAuthStore((s) => s.logout);
  const hydrate  = useThemeStore((s) => s.hydrate);
  const isDark   = useThemeStore((s) => s.isDark);

  // Hydrate saved theme from AsyncStorage
  useEffect(() => { hydrate(); }, []);

  // Sync Android nav bar with theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#0d1320' : '#ffffff');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark]);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <ToastContainer />
        <AlertDialog />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
