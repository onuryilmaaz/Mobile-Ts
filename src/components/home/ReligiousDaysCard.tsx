import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { calendarService, type ReligiousDay } from '@/services/calendar.service';
import { useThemeStore } from '@/store/theme.store';

export function ReligiousDaysCard() {
  const [nextDay, setNextDay] = useState<ReligiousDay | null>(null);
  const [todayHijri, setTodayHijri] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const allDays = calendarService.getReligiousDays();
  const { isDark } = useThemeStore();

  useEffect(() => {
    setNextDay(calendarService.getNextReligiousDay());
    setTodayHijri(calendarService.getTodayHijri());
  }, []);

  const getDaysRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!nextDay) return null;

  const daysRemaining = getDaysRemaining(nextDay.date);

  return (
    <View className="mx-4 mb-6">
      <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-black/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        
        <View className="bg-teal-700 px-6 py-4 dark:bg-teal-500/15">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="rounded-full bg-white/20 p-1.5 dark:bg-teal-500/20">
                <Ionicons name="moon" size={16} color={isDark ? '#14b8a6' : '#fff'} />
              </View>
              <Text className="text-base font-bold text-white">Hicri Takvim</Text>
            </View>
            <View className="rounded-full bg-white/20 px-3 py-1 dark:bg-white/10">
              <Text className="text-xs font-bold uppercase tracking-widest text-white">
                {todayHijri}
              </Text>
            </View>
          </View>
        </View>

        <View className="p-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Sıradaki Önemli Gün
            </Text>
            {daysRemaining === 0 && (
              <View className="rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-500/20">
                <Text className="text-xs font-bold text-red-600 dark:text-red-400">BUGÜN</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="mb-1 text-xl font-bold text-slate-900 dark:text-white">{nextDay.name}</Text>
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={14} color={isDark ? 'rgba(240,244,255,0.55)' : '#475569'} />
                <Text className="text-sm font-medium text-teal-700 dark:text-teal-400">
                  {nextDay.date.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-3xl font-black text-teal-700 dark:text-teal-400">{daysRemaining}</Text>
              <Text className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500">
                GÜN KALDI
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl bg-teal-50 py-3 dark:bg-teal-500/10">
            <Text className="text-sm font-bold text-teal-700 dark:text-teal-400">Tüm Dini Günleri Gör</Text>
            <Ionicons name="arrow-forward" size={16} color={isDark ? '#14b8a6' : '#0f766e'} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <BlurView intensity={30} tint="dark" className="flex-1 items-center justify-center px-4">
          <View className="max-h-[80%] w-full overflow-hidden rounded-[40px] bg-white shadow-2xl dark:bg-slate-900">
            <View className="flex-row items-center justify-between bg-teal-700 px-6 py-6 dark:bg-[#0c4a3e]">
              <View>
                <Text className="text-2xl font-bold text-white">2026 Dini Günler</Text>
                <Text className="mt-1 text-xs text-teal-100 dark:text-teal-500/80">Önemli tarihler ve kandiller</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
              {allDays.map((day, index) => {
                const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <View
                    key={day.id}
                    className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
                      isPast 
                        ? 'border-slate-100 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-800/50' 
                        : 'border-teal-100 bg-white shadow-sm dark:border-teal-500/30 dark:bg-slate-900'
                    }`}>
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-2xl ${
                        isPast ? 'bg-slate-200 dark:bg-white/10' : 'bg-teal-50 dark:bg-teal-500/15'
                      }`}>
                      <Text
                        className={`text-base font-bold ${
                          isPast ? 'text-slate-500 dark:text-slate-400' : 'text-teal-700 dark:text-teal-400'
                        }`}>
                        {day.date.getDate()}
                      </Text>
                      <Text
                        className={`text-[10px] font-bold uppercase ${
                          isPast ? 'text-slate-400 dark:text-slate-500' : 'text-teal-500 dark:text-teal-600'
                        }`}>
                        {day.date.toLocaleDateString('tr-TR', { month: 'short' })}
                      </Text>
                    </View>

                    <View className="ml-4 flex-1">
                      <Text className={`font-bold ${isPast ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {day.name}
                      </Text>
                      <Text className="text-xs text-slate-400 dark:text-slate-500">{day.hijriDate}</Text>
                    </View>

                    {!isPast && index === allDays.indexOf(nextDay) && (
                      <View className="rounded-lg bg-teal-700 px-2 py-1 dark:bg-teal-600">
                        <Text className="text-[10px] font-bold text-white">YAKLAŞAN</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              <View className="h-4" />
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}
