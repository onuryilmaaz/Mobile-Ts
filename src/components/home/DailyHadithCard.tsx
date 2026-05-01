import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { hadithService } from '@/services/hadith.service';
import { useThemeStore } from '@/store/theme.store';

// Shape returned by hadithService (different from the raw DB Hadith type)
type HadithResult = { hadithnumber: number; text: string };

export function DailyHadithCard() {
  const [hadith, setHadith] = useState<HadithResult | null>(null);
  const [bookName, setBookName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { isDark } = useThemeStore();

  useEffect(() => {
    loadHourlyHadith();
  }, []);

  const loadHourlyHadith = async () => {
    setLoading(true);
    const result = await hadithService.getHourlyHadith();
    if (result) {
      setHadith(result.hadith);
      setBookName(result.bookName);
    }
    setLoading(false);
  };

  const loadRandomHadith = async () => {
    setLoading(true);
    const result = await hadithService.getRandomHadith('bukhari');
    if (result) {
      setHadith(result.hadith);
      setBookName(result.bookName);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View 
        className={`mx-4 mb-6 items-center justify-center rounded-3xl border p-12 ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-amber-100 bg-amber-50'
        }`}>
        <ActivityIndicator size="large" color={isDark ? '#fbbf24' : '#d97706'} />
      </View>
    );
  }

  if (!hadith) {
    return null;
  }

  const truncatedText =
    hadith.text.length > 150 && !expanded ? hadith.text.substring(0, 150) + '...' : hadith.text;

  return (
    <View className="mx-4 mb-6">
      <View 
        className={`overflow-hidden rounded-3xl border shadow-xl ${
          isDark 
            ? 'border-slate-700 bg-slate-800 shadow-none' 
            : 'border-amber-100 bg-white shadow-amber-900/10'
        }`}>
        <View 
          className="px-6 py-4"
          style={{ backgroundColor: isDark ? '#92400e' : '#d97706' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="book" size={20} color="#fff" />
              <Text className="text-base font-bold text-white">Saatlik Hadis</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                loadRandomHadith();
              }}
              className="rounded-full bg-white/20 p-2">
              <Ionicons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="p-6">
          <Text className="mb-4 text-base leading-7 text-slate-700 dark:text-slate-300">{truncatedText}</Text>
          {hadith.text.length > 150 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} className="mb-4">
              <Text className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {expanded ? 'Daha Az Göster' : 'Devamını Oku'}
              </Text>
            </TouchableOpacity>
          )}
          <View className="mt-2 flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
            <View>
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">Kaynak</Text>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">{bookName}</Text>
            </View>
            <View className="rounded-full bg-amber-50 px-3 py-1.5 dark:bg-amber-500/15">
              <Text className="text-xs font-semibold text-amber-600 dark:text-amber-400">#{hadith.hadithnumber}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
