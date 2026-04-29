import './global.css';
import { useEffect } from 'react';
import { Platform } from 'react-native';
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

function AppContent() {
  const isDark = useThemeStore((s) => s.isDark);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#0f172a' : '#ffffff');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, setColorScheme]);

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <AppNavigator />
      <ToastContainer />
      <AlertDialog />
    </NavigationContainer>
  );
}

function App() {
  const logout   = useAuthStore((s) => s.logout);
  const hydrate  = useThemeStore((s) => s.hydrate);

  // Hydrate saved theme from AsyncStorage
  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;
