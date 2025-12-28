import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { UserTabParamList } from '@/navigation/types';
import { userApi } from '@/modules/user/user.api';
import { Screen } from '@/components/layout/Screen';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useFocusEffect } from '@react-navigation/native';

type Props = BottomTabScreenProps<UserTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await userApi.profile();

      const userData = (data as any).user ? (data as any).user : data;
      setUser(userData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.firstName) {
        fetchData();
      }
    }, [user?.firstName, fetchData])
  );

  const avatarUrl = user?.avatarUrl;

  return (
    <Screen className="bg-slate-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        showsVerticalScrollIndicator={false}>
        <View className="mb-6 flex-row items-center justify-between pt-4">
          <View>
            <Text className="text-sm font-medium text-slate-500">Hoş geldin, 👋</Text>
            <Text className="text-2xl font-bold text-slate-900">
              {user?.firstName || 'Kullanıcı'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { screen: 'ProfileMain' })}
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-primary-200 bg-primary-100">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-xl">👤</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
