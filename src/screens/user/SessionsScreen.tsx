import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { InlineLoading } from '@/components/feedback/Loading';
import { authApi } from '@/modules/auth/auth.api';
import type { SessionInfo } from '@/modules/auth/auth.types';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  async function loadSessions(isInitial = false) {
    try {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      const { data } = await authApi.sessions();
      const list = Array.isArray(data) ? data : (data as any)?.sessions ?? [];
      setSessions(list);
    } catch (err) {
      console.log(err);
      Alert.alert('Hata', 'Oturumlar alınamadı');
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadSessions(true);
  }, []);

  async function handleRevokeSession(id: string) {
    Alert.alert(
      'Oturumu Kapat',
      'Bu oturumu kapatmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await authApi.revokeSession(id);
              Alert.alert('Başarılı', 'Oturum sonlandırıldı');
              await loadSessions();
            } catch (err) {
              console.log(err);
              Alert.alert('Hata', 'Oturum sonlandırılamadı');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleRevokeOthers() {
    Alert.alert(
      'Diğer Oturumları Kapat',
      'Bu cihaz hariç tüm oturumları kapatmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Tümünü Kapat',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await authApi.revokeOtherSessions();
              Alert.alert('Başarılı', 'Diğer oturumlar sonlandırıldı');
              await loadSessions();
            } catch (err) {
              console.log(err);
              Alert.alert('Hata', 'Diğer oturumlar kapatılamadı');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Screen>
      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSessions()} />
        }>
        <Text className="mb-4 text-base text-slate-600">
          Hesabınıza bağlı tüm aktif oturumları görüntüleyin ve yönetin.
        </Text>

        {initialLoading ? (
          <InlineLoading message="Oturumlar yükleniyor..." />
        ) : sessions.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="phone-portrait-outline" size={48} color="#94a3b8" />
            <Text className="mt-4 text-slate-500">Aktif oturum bulunamadı</Text>
          </View>
        ) : (
          <View className="gap-3">
            {sessions.map((session) => (
              <View 
                key={session.id} 
                className={`rounded-2xl border p-4 ${
                  session.isCurrent 
                    ? 'border-primary-200 bg-primary-50' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Ionicons 
                        name={session.isCurrent ? 'phone-portrait' : 'phone-portrait-outline'} 
                        size={20} 
                        color={session.isCurrent ? '#0f766e' : '#64748b'} 
                      />
                      <Text className={`font-semibold ${session.isCurrent ? 'text-primary-700' : 'text-slate-900'}`}>
                        {session.isCurrent ? 'Bu Cihaz' : 'Diğer Cihaz'}
                      </Text>
                    </View>
                    
                    <Text className="mt-2 text-xs text-slate-500" numberOfLines={2}>
                      {session.userAgent?.slice(0, 60) ?? 'Bilinmeyen cihaz'}
                    </Text>
                    
                    <View className="mt-2 flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={14} color="#94a3b8" />
                      <Text className="text-xs text-slate-400">
                        IP: {session.ip ?? 'Bilinmiyor'}
                      </Text>
                    </View>
                  </View>
                  
                  {!session.isCurrent && (
                    <TouchableOpacity
                      onPress={() => handleRevokeSession(session.id)}
                      className="ml-3 rounded-full bg-red-50 p-2"
                    >
                      <Ionicons name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="mt-6 gap-3 pb-8">
          <Button 
            title="Oturumları Yenile" 
            onPress={() => loadSessions()} 
            loading={refreshing}
            variant="outline"
          />
          {sessions.length > 1 && (
            <Button 
              title="Diğer Oturumları Kapat" 
              onPress={handleRevokeOthers} 
              loading={loading}
              variant="danger"
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

