import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar as RNStatusBar } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { StandardHeader } from '@/components/layout/StandardHeader';
import GroupListScreen from '@/screens/user/GroupListScreen';
import GroupDetailScreen from '@/screens/user/GroupDetailScreen';
import GroupCreateScreen from '@/screens/user/GroupCreateScreen';
import GroupInviteScreen from '@/screens/user/GroupInviteScreen';
import GoalCreateScreen from '@/screens/user/GoalCreateScreen';
import GoalSuggestScreen from '@/screens/user/GoalSuggestScreen';
import GroupManualLogScreen from '@/screens/user/GroupManualLogScreen';
import GroupSettingsScreen from '@/screens/user/GroupSettingsScreen';
import type { GroupStackParamList } from './types';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export default function GroupNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <RNStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <Stack.Navigator screenOptions={{ headerShown: true, headerShadowVisible: false }}>
        <Stack.Screen
          name="GroupList"
          component={GroupListScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Gruplar" showBackButton={false} />
            ),
          }}
        />
        <Stack.Screen
          name="GroupDetail"
          component={GroupDetailScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Grup" backTitle="Gruplar" />
            ),
          }}
        />
        <Stack.Screen
          name="GroupCreate"
          component={GroupCreateScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Grup Oluştur" backTitle="Geri" />
            ),
          }}
        />
        <Stack.Screen
          name="GroupInvite"
          component={GroupInviteScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Davet Et" backTitle="Geri" />
            ),
          }}
        />
        <Stack.Screen
          name="GoalCreate"
          component={GoalCreateScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Hedef Oluştur" backTitle="Geri" />
            ),
          }}
        />
        <Stack.Screen
          name="GoalSuggest"
          component={GoalSuggestScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Hedef Öner" backTitle="Geri" />
            ),
          }}
        />
        <Stack.Screen
          name="GroupManualLog"
          component={GroupManualLogScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Manuel Giriş" backTitle="Geri" />
            ),
          }}
        />
        <Stack.Screen
          name="GroupSettings"
          component={GroupSettingsScreen}
          options={{
            header: ({ navigation }) => (
              <StandardHeader navigation={navigation} title="Grup Ayarları" backTitle="Geri" />
            ),
          }}
        />
      </Stack.Navigator>
    </>
  );
}
