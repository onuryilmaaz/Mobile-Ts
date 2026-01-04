import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hadithService, type Hadith } from '@/services/hadith.service';

export function DailyHadithCard() {
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [bookName, setBookName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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
      <View className="mx-4 mb-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg">
        <ActivityIndicator size="large" color="#d97706" />
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
      <View className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-xl shadow-amber-900/10">
        {/* Header */}
        <View className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="book" size={20} color="#fff" />
              <Text className="text-base font-bold text-white">Saatlik Hadis</Text>
            </View>
            <TouchableOpacity onPress={loadRandomHadith} className="rounded-full bg-white/20 p-2">
              <Ionicons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="p-6">
          <Text className="mb-4 text-base leading-7 text-slate-700">{truncatedText}</Text>

          {hadith.text.length > 150 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} className="mb-4">
              <Text className="text-sm font-semibold text-amber-600">
                {expanded ? 'Daha Az Göster' : 'Devamını Oku'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Footer */}
          <View className="mt-2 flex-row items-center justify-between border-t border-slate-100 pt-4">
            <View>
              <Text className="text-xs font-medium text-slate-500">Kaynak</Text>
              <Text className="text-sm font-bold text-slate-700">{bookName}</Text>
            </View>
            <View className="rounded-full bg-amber-50 px-3 py-1.5">
              <Text className="text-xs font-semibold text-amber-700">#{hadith.hadithnumber}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
