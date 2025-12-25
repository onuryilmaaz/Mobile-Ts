import { View, Text } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { UserTabParamList } from '@/navigation/types';

type Props = BottomTabScreenProps<UserTabParamList, 'Profile'>;

export default function ProfileScreen({}: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Profil 👤</Text>
      <Text className="mt-2 text-gray-500">Kullanıcı bilgileriniz</Text>
    </View>
  );
}

