import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { calendarService, type ReligiousDay } from '@/services/calendar.service';
import { useAppTheme } from '@/constants/theme';

export function ReligiousDaysCard() {
  const [nextDay, setNextDay] = useState<ReligiousDay | null>(null);
  const [todayHijri, setTodayHijri] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const allDays = calendarService.getReligiousDays();
  const { colors, isDark } = useAppTheme();

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
    <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
      <View style={{
        overflow: 'hidden', borderRadius: 24,
        borderWidth: 1, borderColor: colors.cardBorder,
        backgroundColor: colors.card,
        shadowColor: '#000', shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
      }}>
        <View style={{ backgroundColor: isDark ? 'rgba(20,184,166,0.12)' : colors.teal, paddingHorizontal: 24, paddingVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.2)', padding: 6 }}>
                <Ionicons name="moon" size={16} color={isDark ? colors.teal : '#fff'} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#fff' : '#fff' }}>Hicri Takvim</Text>
            </View>
            <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: '#fff' }}>
                {todayHijri}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ padding: 24 }}>
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2, color: colors.textMuted }}>
              Sıradaki Önemli Gün
            </Text>
            {daysRemaining === 0 && (
              <View style={{ borderRadius: 99, backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2', paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDark ? '#fca5a5' : '#dc2626' }}>BUGÜN</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ marginBottom: 4, fontSize: 20, fontWeight: 'bold', color: colors.textPrimary }}>{nextDay.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.teal }}>
                  {nextDay.date.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 30, fontWeight: '900', color: colors.teal }}>{daysRemaining}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: -0.5, color: colors.textMuted }}>
                GÜN KALDI
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
            style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: isDark ? 'rgba(20,184,166,0.1)' : colors.tealDim, paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.teal }}>Tüm Dini Günleri Gör</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.teal} />
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <BlurView intensity={30} tint="dark" className="flex-1 items-center justify-center px-4">
          <View className="max-h-[80%] w-full overflow-hidden rounded-[40px] bg-white shadow-2xl">
            <View className="flex-row items-center justify-between bg-primary-700 px-6 py-6">
              <View>
                <Text className="text-2xl font-bold text-white">2026 Dini Günler</Text>
                <Text className="mt-1 text-xs text-primary-100">Önemli tarihler ve kandiller</Text>
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
                    className={`mb-3 flex-row items-center rounded-2xl border p-4 ${isPast ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-primary-100 bg-white shadow-sm'}`}>
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-2xl ${isPast ? 'bg-slate-200' : 'bg-primary-100'}`}>
                      <Text
                        className={`text-base font-bold ${isPast ? 'text-slate-500' : 'text-primary-700'}`}>
                        {day.date.getDate()}
                      </Text>
                      <Text
                        className={`text-[10px] font-bold uppercase ${isPast ? 'text-slate-400' : 'text-primary-500'}`}>
                        {day.date.toLocaleDateString('tr-TR', { month: 'short' })}
                      </Text>
                    </View>

                    <View className="ml-4 flex-1">
                      <Text className={`font-bold ${isPast ? 'text-slate-500' : 'text-slate-900'}`}>
                        {day.name}
                      </Text>
                      <Text className="text-xs text-slate-400">{day.hijriDate}</Text>
                    </View>

                    {!isPast && index === allDays.indexOf(nextDay) && (
                      <View className="rounded-lg bg-primary-700 px-2 py-1">
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
