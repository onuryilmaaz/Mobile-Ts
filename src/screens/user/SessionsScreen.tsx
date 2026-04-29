import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { EmptyState } from '@/components/layout/EmptyState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { InlineLoading } from '@/components/feedback/Loading';
import { authApi } from '@/modules/auth/auth.api';
import { useAlertStore } from '@/store/alert.store';
import { useThemeStore } from '@/store/theme.store';
import type { SessionInfo } from '@/modules/auth/auth.types';

export default function SessionsScreen() {
  const { isDark } = useThemeStore();
  const alert = useAlertStore();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadSessions = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setInitialLoading(true);
        else setRefreshing(true);
        const { data } = await authApi.sessions();
        const list = Array.isArray(data) ? data : ((data as any)?.sessions ?? []);
        setSessions(list);
      } catch (err) {
        console.log(err);
        alert.error('Hata', 'Oturumlar alınamadı');
      } finally {
        setRefreshing(false);
        setInitialLoading(false);
      }
    },
    [alert]
  );

  useEffect(() => {
    loadSessions(true);
  }, [loadSessions]);

  function handleRevokeSession(id: string) {
    alert.confirm(
      'Oturumu Kapat',
      'Bu oturumu kapatmak istediğinize emin misiniz?',
      async () => {
        try {
          setLoading(true);
          await authApi.revokeSession(id);
          alert.success('Başarılı', 'Oturum sonlandırıldı');
          await loadSessions();
        } catch (err) {
          console.log(err);
          alert.error('Hata', 'Oturum sonlandırılamadı');
        } finally {
          setLoading(false);
        }
      },
      'Kapat',
      'Vazgeç',
      true
    );
  }

  function handleRevokeOthers() {
    alert.confirm(
      'Diğer Oturumları Kapat',
      'Bu cihaz hariç tüm oturumları kapatmak istediğinize emin misiniz?',
      async () => {
        try {
          setLoading(true);
          await authApi.revokeOtherSessions();
          alert.success('Başarılı', 'Diğer oturumlar sonlandırıldı');
          await loadSessions();
        } catch (err) {
          console.log(err);
          alert.error('Hata', 'Diğer oturumlar kapatılamadı');
        } finally {
          setLoading(false);
        }
      },
      'Tümünü Kapat',
      'Vazgeç',
      true
    );
  }

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSessions()} />
        }>
        <Card className="mx-4 my-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">Bilgi</Text>
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400">
            Hesabınıza bağlı tüm aktif oturumları görüntüleyin ve yönetin.
          </Text>
        </Card>

        {initialLoading ? (
          <InlineLoading message="Oturumlar yükleniyor..." />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="phone-portrait-outline"
            title="Aktif oturum bulunamadı"
            message="Hesabınıza bağlı aktif oturum yok"
          />
        ) : (
          <View className="gap-3 mx-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={session.isCurrent ? 'border-teal-200 bg-teal-50 dark:border-teal-500/20 dark:bg-teal-500/5' : ''}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="mb-2 flex-row items-center gap-2">
                      <Ionicons
                        name={session.isCurrent ? 'phone-portrait' : 'phone-portrait-outline'}
                        size={20}
                        color={session.isCurrent ? (isDark ? '#14b8a6' : '#0f766e') : (isDark ? '#94a3b8' : '#64748b')}
                      />
                      <Text
                        className={`font-semibold ${session.isCurrent ? (isDark ? 'text-teal-400' : 'text-teal-800') : 'text-slate-900 dark:text-white'}`}>
                        {session.isCurrent ? 'Bu Cihaz' : 'Diğer Cihaz'}
                      </Text>
                      {session.isCurrent && (
                        <Badge variant="success" size="sm">
                          Aktif
                        </Badge>
                      )}
                    </View>

                    <Text className="mb-2 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
                      {session.userAgent?.slice(0, 60) ?? 'Bilinmeyen cihaz'}
                    </Text>

                    <View className="flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={14} color="#94a3b8" />
                      <Text className="text-xs text-slate-400 dark:text-slate-500">
                        IP: {session.ip ?? 'Bilinmiyor'}
                      </Text>
                    </View>
                  </View>

                  {!session.isCurrent && (
                    <TouchableOpacity
                      onPress={() => handleRevokeSession(session.id)}
                      className="ml-3 rounded-full bg-red-50 p-2 dark:bg-red-500/10"
                      activeOpacity={0.7}>
                      <Ionicons name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {sessions.length > 0 && (
          <Card className="mx-4 mt-4">
            <View className="gap-3">
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
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
