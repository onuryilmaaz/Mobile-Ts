import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useGamificationStore } from '@/modules/gamification/gamification.store';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/auth.store';
import { prayerService } from '@/services/prayer.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';
const DEFAULT_DISTRICT_ID = '9654';

const PRAYERS = [
  { id: 'fajr', name: 'Sabah', icon: 'sunny-outline', timeKey: 'imsak' },
  { id: 'dhuhr', name: 'Öğle', icon: 'sunny', timeKey: 'ogle' },
  { id: 'asr', name: 'İkindi', icon: 'partly-sunny', timeKey: 'ikindi' },
  { id: 'maghrib', name: 'Akşam', icon: 'moon', timeKey: 'aksam' },
  { id: 'isha', name: 'Yatsı', icon: 'star-outline', timeKey: 'yatsi' },
] as const;

export function PrayerTrackerCard() {
  const { stats, fetchStats, trackPrayer, isLoading } = useGamificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      loadPrayerTimes();
    }
  }, [isAuthenticated, fetchStats]);

  const loadPrayerTimes = async () => {
    try {
      const districtId = await AsyncStorage.getItem(STORAGE_DISTRICT_ID_KEY) || DEFAULT_DISTRICT_ID;
      const data = await prayerService.getTodayPrayerTimes(districtId);
      if (data) {
        setPrayerTimes(data.times);
      }
    } catch (e) {
      console.error('Failed to load prayer times for tracker', e);
    }
  };

  if (!isAuthenticated) return null;

  const completedCount = stats?.today_prayers?.length || 0;
  const totalCount = PRAYERS.length;
  const progress = completedCount / totalCount;

  const handleTrack = async (prayerTime: any) => {
    if (stats?.today_prayers?.includes(prayerTime) || isLoading) return;
    await trackPrayer(prayerTime);
  };

  return (
    <View className="mb-6 mx-4 overflow-hidden rounded-[32px] bg-white shadow-xl shadow-slate-200 border border-slate-100">
      {/* Header with Progress Bar */}
      <View className="bg-emerald-600 px-6 py-6">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/80 text-xs font-bold uppercase tracking-widest">Günlük İlerleme</Text>
            <Text className="text-white text-2xl font-bold">Namaz Takibi</Text>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
            <Text className="text-white font-bold text-sm">{completedCount} / {totalCount}</Text>
          </View>
        </View>
        
        {/* Progress Bar Background */}
        <View className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
          {/* Active Progress */}
          <View 
            className="h-full bg-white rounded-full" 
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>

      <View className="p-4 bg-white">
        <View className="flex-row flex-wrap justify-between">
          {PRAYERS.map((prayer) => {
            const isTracked = stats?.today_prayers?.includes(prayer.id);
            const time = prayerTimes ? prayerTimes[prayer.timeKey] : '--:--';
            
            return (
              <TouchableOpacity
                key={prayer.id}
                disabled={isTracked || isLoading}
                onPress={() => handleTrack(prayer.id)}
                activeOpacity={0.7}
                className="w-[48%] mb-3"
              >
                <View 
                  className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                    isTracked 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <View className="flex-1">
                    <Text className={`text-[10px] font-bold uppercase tracking-tighter mb-1 ${
                      isTracked ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {prayer.name}
                    </Text>
                    <Text className={`text-sm font-bold ${
                      isTracked ? 'text-emerald-900' : 'text-slate-700'
                    }`}>
                      {time}
                    </Text>
                  </View>
                  
                  <View className={`h-10 w-10 rounded-full items-center justify-center ${
                    isTracked ? 'bg-emerald-200' : 'bg-white border border-slate-200'
                  }`}>
                    {isLoading && !isTracked ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <Ionicons
                        name={isTracked ? "checkmark" : (prayer.icon as any)}
                        size={20}
                        color={isTracked ? "#059669" : "#94a3b8"}
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Summary / Points Info */}
          <View className="w-full mt-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex-row items-center">
            <View className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Ionicons name="flash" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-blue-900 font-bold text-sm">Puan Kazanın</Text>
              <Text className="text-blue-700 text-xs">Her namaz +10 puan kazandırır.</Text>
            </View>
            <View className="items-end">
              <Text className="text-blue-900 font-black text-lg">{stats?.total_points || 0}</Text>
              <Text className="text-blue-700 text-[10px] font-bold">TOPLAM</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
