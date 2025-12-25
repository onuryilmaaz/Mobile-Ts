import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'UserDetail'>;

export default function UserDetailScreen({ route }: Props) {
  const { userId } = route.params;

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Kullanıcı Detayı</Text>
      <Text className="mt-2 text-gray-500">Kullanıcı ID: {userId}</Text>
    </View>
  );
}

