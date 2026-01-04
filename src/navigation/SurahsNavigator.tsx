import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { PrayerSurahsScreen } from '@/screens/user';
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
          headerShown: true,
          headerShadowVisible: false,
        }}>
        <Stack.Screen
          name="SurahsMain"
          component={PrayerSurahsScreen}
          options={{
            header: () => <StandardHeader title="Namaz Sureleri" showBackButton={false} />,
          }}
        />
      </Stack.Navigator>
    </>
  );
}

