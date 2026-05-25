import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './types';
import { useTheme } from '@/hooks/useTheme';

import FamilyDashboardScreen from '@/screens/family/FamilyDashboardScreen';
import AddChildScreen from '@/screens/family/AddChildScreen';
import ChildDetailScreen from '@/screens/family/ChildDetailScreen';
import CreateTaskScreen from '@/screens/family/CreateTaskScreen';
import EditTaskScreen from '@/screens/family/EditTaskScreen';
import PendingApprovalsScreen from '@/screens/family/PendingApprovalsScreen';
import CompletionDetailScreen from '@/screens/family/CompletionDetailScreen';
import RewardCatalogScreen from '@/screens/family/RewardCatalogScreen';
import ChildReportScreen from '@/screens/family/ChildReportScreen';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

export default function FamilyNavigator() {
  const { isDark } = useTheme();
  const headerColor = isDark ? '#0f172a' : '#ffffff';
  const headerTintColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: headerColor },
        headerTintColor,
        headerBackTitle: '',
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} options={{ title: 'Aile' }} />
      <Stack.Screen name="AddChild" component={AddChildScreen} options={{ title: 'Çocuk Ekle' }} />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: 'Görev Oluştur' }} />
      <Stack.Screen name="EditTask" component={EditTaskScreen} options={{ title: 'Görevi Düzenle' }} />
      <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} options={{ title: 'Onay Bekleyenler' }} />
      <Stack.Screen name="CompletionDetail" component={CompletionDetailScreen} options={{ title: 'Tamamlama Detayı' }} />
      <Stack.Screen name="RewardCatalog" component={RewardCatalogScreen} options={{ title: 'Ödüller' }} />
      <Stack.Screen name="ChildReport" component={ChildReportScreen} options={{ title: 'Rapor' }} />
    </Stack.Navigator>
  );
}
