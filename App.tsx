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

function App() {
  useEffect(() => {
    // Android'de sistem navigasyon bar'ının rengini tabbar ile aynı yap (beyaz)
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#ffffff');
      NavigationBar.setButtonStyleAsync('dark'); // Butonları koyu renk yap (beyaz arka plan için)
    }
  }, []);

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

