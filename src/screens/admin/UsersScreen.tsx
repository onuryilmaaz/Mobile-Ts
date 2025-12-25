import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'Users'>;

export default function UsersScreen({ navigation }: Props) {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">Kullanıcılar 👥</Text>
      <Text className="mt-2 mb-4 text-gray-500">Kullanıcı listesi</Text>

      <Pressable
        className="rounded-xl bg-blue-500 px-6 py-3"
        onPress={() => navigation.navigate('UserDetail', { userId: '1' })}
      >
        <Text className="font-semibold text-white">Kullanıcı Detayı</Text>
      </Pressable>
    </View>
  );
}

