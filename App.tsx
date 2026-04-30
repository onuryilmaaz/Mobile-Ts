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

  // Sync NativeWind, Android nav bar with theme store
  useEffect(() => {
    // Force sync NativeWind's colorScheme with our store
    setColorScheme(isDark ? 'dark' : 'light');

    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#0f172a' : '#ffffff');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark, setColorScheme]);

  return (
    <View 
      className={`flex-1 ${isDark ? 'dark' : ''}`} 
      style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      <NavigationContainer 
        ref={rootNavigationRef} 
        key={isDark ? 'dark' : 'light'}
        theme={isDark ? MyDarkTheme : MyLightTheme}>
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
