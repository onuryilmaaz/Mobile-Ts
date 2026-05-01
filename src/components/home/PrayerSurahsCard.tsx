import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rootNavigate } from '@/navigation/rootNavigation';
import { useThemeStore } from '@/store/theme.store';

export function PrayerSurahsCard() {
  const { isDark } = useThemeStore();

  return (
    <View className="mx-4 mb-6">
      <TouchableOpacity
        onPress={() => {
          rootNavigate('UserTabs', {
            screen: 'Surahs',
            params: { screen: 'SurahsMain' },
          } as any);
        }}
        activeOpacity={0.8}
        className={`overflow-hidden rounded-3xl border shadow-xl ${
          isDark 
            ? 'border-slate-700 bg-slate-800 shadow-none' 
            : 'border-teal-100 bg-white shadow-teal-900/10'
        }`}>
        <View 
          className="px-6 py-4"
          style={{ backgroundColor: isDark ? '#0c4a3e' : '#0f766e' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="book-outline" size={22} color="#fff" />
              <Text className="text-base font-bold text-white">Namaz Sureleri</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </View>
        </View>
        <View className="p-6">
          <Text className="mb-4 text-base leading-7 text-slate-700 dark:text-slate-300">
            Namazda okunan kısa sureleri Arapça ve Türkçe çevirileriyle birlikte inceleyin.
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={16} color={isDark ? '#14b8a6' : '#0d9488'} />
              <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">10 Sure</Text>
            </View>
            <Text className="text-slate-400 dark:text-slate-600">•</Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="language" size={16} color={isDark ? '#14b8a6' : '#0d9488'} />
              <Text className="text-sm font-medium text-slate-600 dark:text-slate-400">Arapça & Türkçe</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
