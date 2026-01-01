import { useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { userApi } from '@/modules/user/user.api';
import { Screen } from '@/components/layout/Screen';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

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

  return (
    <Screen className="bg-slate-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16 }}>
        {/* İçerik buraya gelecek */}
      </ScrollView>
    </Screen>
  );
}
