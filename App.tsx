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
import { setLogoutCallback } from '@/services/api';

function App() {
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#ffffff');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  useEffect(() => {
    // Set logout callback for API interceptor
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
