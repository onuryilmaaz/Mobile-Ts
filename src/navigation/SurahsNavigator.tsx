import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { SurahBrowserScreen, SurahDetailScreen } from '@/screens/user';
import type { SurahsStackParamList } from './types';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useThemeStore } from '@/store/theme.store';

const Stack = createNativeStackNavigator<SurahsStackParamList>();

export default function SurahsNavigator() {
  const headerColor = useThemeStore((s) => s.headerColor);

  return (
    <>
      <RNStatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerShadowVisible: false,
          animation: 'slide_from_right'
        }}>
        <Stack.Screen
          name="SurahsMain"
          component={SurahBrowserScreen}
        />
        <Stack.Screen
          name="SurahDetail"
          component={SurahDetailScreen}
        />
      </Stack.Navigator>
    </>
  );
}

