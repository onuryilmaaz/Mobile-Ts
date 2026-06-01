import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { useTheme } from '@/hooks/useTheme';
import { useOzelGunStore } from '@/modules/ozel_gun/ozel_gun.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { alert } from '@/store/alert.store';
import { toast } from '@/components/feedback/Toast';
import type { HomeStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function daysSince(dateStr: string): number {
  const start = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1;
}

export default function OzelGunScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { gender, isActive, period, isLoading, loaded, fetch, start, end } = useOzelGunStore();

  useEffect(() => {
    if (isAuthenticated) fetch();
  }, [isAuthenticated]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    alert.confirm(
      'Dönemi Başlat',
      'Bugün için özel gün döneminin başlangıcını kaydetmek istiyor musun? Bu süre boyunca namaz streak\'in korunacak.',
      async () => {
        await start();
        toast.success('Başladı', 'Dönem kaydedildi.');
      },
      'Başlat',
      'İptal',
    );
  };

  const handleEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    alert.confirm(
      'Dönemi Bitir',
      'Aktif dönemi bugün itibarıyla sonlandırmak istiyor musun?',
      async () => {
        await end();
        toast.success('Bitirildi', 'Dönem sonlandırıldı.');
      },
      'Bitir',
      'İptal',
      true,
    );
  };

  const teal = isDark ? '#14b8a6' : '#0f766e';
  const rose = '#fb7185';
  const roseDark = '#f43f5e';

  // Loading state
  if (!loaded) {
    return (
      <Screen safeAreaEdges={['left', 'right']}>
        <StandardHeader title="Özel Gün Takibi" navigation={navigation} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={teal} />
        </View>
      </Screen>
    );
  }

  // Gender check
  if (gender !== 'kadin') {
    return (
      <Screen safeAreaEdges={['left', 'right']}>
        <StandardHeader title="Özel Gün Takibi" navigation={navigation} />
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
            <Ionicons name="information-circle-outline" size={36} color={isDark ? '#94a3b8' : '#64748b'} />
          </View>
          <Text className="mt-5 text-center text-lg font-black text-slate-900 dark:text-white">
            Bu Özellik Kadın Kullanıcılara Özel
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Profil ayarlarından cinsiyet bilgini güncellersen bu sayfayı kullanabilirsin.
          </Text>
        </View>
      </Screen>
    );
  }

  const dayCount = period?.start_date ? daysSince(period.start_date) : 0;

  return (
    <Screen safeAreaEdges={['left', 'right']}>
      <StandardHeader title="Özel Gün Takibi" navigation={navigation} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Status banner */}
        <View
          className={`overflow-hidden rounded-3xl p-6 ${
            isActive
              ? 'border border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10'
              : 'border border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
          }`}>
          <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{ backgroundColor: isActive ? `${roseDark}15` : `${teal}15` }} />

          <View className="flex-row items-center gap-3">
            <View
              className="h-14 w-14 items-center justify-center rounded-3xl"
              style={{ backgroundColor: isActive ? `${roseDark}25` : `${teal}25` }}>
              <Ionicons
                name={isActive ? 'pause-circle' : 'checkmark-circle'}
                size={28}
                color={isActive ? roseDark : teal}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: isActive ? roseDark : teal }}>
                {isActive ? 'Aktif Dönem' : 'Aktif Dönem Yok'}
              </Text>
              <Text className="mt-0.5 text-lg font-black text-slate-900 dark:text-white">
                {isActive ? `${dayCount}. gün` : 'Şu an namaz vakti'}
              </Text>
              {isActive && period?.start_date && (
                <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Başlangıç: {new Date(`${period.start_date}T00:00:00`).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Info card */}
        <View className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row items-center gap-2">
            <Ionicons name="shield-checkmark-outline" size={18} color={teal} />
            <Text className="text-sm font-black text-slate-900 dark:text-white">Streak Koruması</Text>
          </View>
          <Text className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Aktif dönem boyunca kaçırılan namazlar için streak'in bozulmaz, kaza listene eklenmez.
            İstatistikler bu günleri "muaf" olarak işaretler.
          </Text>
        </View>

        {/* Action button */}
        {isActive ? (
          <TouchableOpacity
            onPress={handleEnd}
            disabled={isLoading}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-4 dark:bg-rose-600">
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="stop-circle-outline" size={18} color="#fff" />
                <Text className="text-sm font-black text-white">Dönemi Bugün Sonlandır</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStart}
            disabled={isLoading}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-4 dark:bg-teal-500">
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="play-circle-outline" size={18} color="#fff" />
                <Text className="text-sm font-black text-white">Yeni Dönem Başlat</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text className="mt-1 px-2 text-center text-[11px] text-slate-400">
          Bu bilgi gizlidir, hiçbir kullanıcı ile paylaşılmaz.
        </Text>
      </ScrollView>
    </Screen>
  );
}
