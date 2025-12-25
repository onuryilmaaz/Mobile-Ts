import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'Dashboard'>;

export default function DashboardScreen({}: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Admin Dashboard 📊</Text>
      <Text className="mt-2 text-gray-500">Yönetim paneli</Text>
    </View>
  );
}

