import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'Roles'>;

export default function RolesScreen({}: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Roller 🔐</Text>
      <Text className="mt-2 text-gray-500">Rol yönetimi</Text>
    </View>
  );
}

