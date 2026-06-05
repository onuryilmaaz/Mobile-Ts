import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './types';
import FamilyDashboardScreen from '@/screens/family/FamilyDashboardScreen';
import AddChildScreen from '@/screens/family/AddChildScreen';
import EditChildScreen from '@/screens/family/EditChildScreen';
import ChildDetailScreen from '@/screens/family/ChildDetailScreen';
import CreateTaskScreen from '@/screens/family/CreateTaskScreen';
import EditTaskScreen from '@/screens/family/EditTaskScreen';
import PendingApprovalsScreen from '@/screens/family/PendingApprovalsScreen';
import CompletionDetailScreen from '@/screens/family/CompletionDetailScreen';
import RewardCatalogScreen from '@/screens/family/RewardCatalogScreen';
import ChildReportScreen from '@/screens/family/ChildReportScreen';
import { StandardHeader } from '@/components/layout/StandardHeader';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

const familyHeader = (title: string) => (props: { navigation: any }) =>
  <StandardHeader title={title} navigation={props.navigation} />;

export default function FamilyNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FamilyDashboard"
        component={FamilyDashboardScreen}
        options={{ header: familyHeader('Aile') }}
      />
      <Stack.Screen
        name="AddChild"
        component={AddChildScreen}
        options={{ header: familyHeader('Çocuk Ekle') }}
      />
      <Stack.Screen
        name="EditChild"
        component={EditChildScreen}
        options={{ header: familyHeader('Profili Düzenle') }}
      />
      <Stack.Screen
        name="ChildDetail"
        component={ChildDetailScreen}
        options={{ header: familyHeader('Çocuk Detayı') }}
      />
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ header: familyHeader('Görev Oluştur') }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ header: familyHeader('Görevi Düzenle') }}
      />
      <Stack.Screen
        name="PendingApprovals"
        component={PendingApprovalsScreen}
        options={{ header: familyHeader('Onay Bekleyenler') }}
      />
      <Stack.Screen
        name="CompletionDetail"
        component={CompletionDetailScreen}
        options={{ header: familyHeader('Tamamlama Detayı') }}
      />
      <Stack.Screen
        name="RewardCatalog"
        component={RewardCatalogScreen}
        options={{ header: familyHeader('Ödüller') }}
      />
      <Stack.Screen
        name="ChildReport"
        component={ChildReportScreen}
        options={{ header: familyHeader('Rapor') }}
      />
    </Stack.Navigator>
  );
}
