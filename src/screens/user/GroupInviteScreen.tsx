import { View, Text, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { alert } from '@/store/alert.store';
import { Screen } from '@/components/layout/Screen';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { GroupStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<GroupStackParamList, 'GroupInvite'>;
  route: RouteProp<GroupStackParamList, 'GroupInvite'>;
};

export default function GroupInviteScreen({ navigation, route }: Props) {
  const { groupId, inviteCode } = route.params;
  const { isDark } = useTheme();

  function handleCopy() {
    Clipboard.setStringAsync(inviteCode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    alert.success('Kopyalandı', 'Davet kodu panoya kopyalandı.');
  }

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Share.share({
      message: `Salah uygulamasında ibadet grubuma katıl! Davet kodum: ${inviteCode}\n\nUygulamamı indir ve "Gruba Katıl" bölümünde bu kodu gir.`,
      title: 'İbadet Grubuna Katıl',
    });
  }

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        {/* İkon */}
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20">
          <Ionicons name="people" size={48} color={isDark ? '#2dd4bf' : '#0f766e'} />
        </View>

        <Text className="mb-2 text-center text-2xl font-black text-slate-900 dark:text-white">
          Grup Oluşturuldu!
        </Text>
        <Text className="mb-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Arkadaşlarını bu kodu paylaşarak davet edebilirsin
        </Text>

        {/* Davet kodu */}
        <TouchableOpacity
          onPress={handleCopy}
          className="mb-4 w-full items-center rounded-3xl border-2 border-teal-500 bg-teal-50 py-6 dark:bg-teal-500/10">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Davet Kodu
          </Text>
          <Text className="text-4xl font-black tracking-[8px] text-teal-700 dark:text-teal-300">
            {inviteCode}
          </Text>
          <View className="mt-3 flex-row items-center gap-1">
            <Ionicons name="copy-outline" size={14} color={isDark ? '#2dd4bf' : '#0f766e'} />
            <Text className="text-xs text-teal-600 dark:text-teal-400">Kopyalamak için dokun</Text>
          </View>
        </TouchableOpacity>

        {/* Paylaş butonu */}
        <TouchableOpacity
          onPress={handleShare}
          className="mb-4 w-full flex-row items-center justify-center gap-2 rounded-2xl bg-teal-600 py-4 dark:bg-teal-500">
          <Ionicons name="share-social-outline" size={20} color="#fff" />
          <Text className="text-base font-bold text-white">Paylaş</Text>
        </TouchableOpacity>

        {/* Gruba git */}
        <TouchableOpacity
          onPress={() => navigation.replace('GroupDetail', { groupId })}
          className="w-full rounded-2xl border border-slate-200 py-4 dark:border-slate-700">
          <Text className="text-center text-base font-bold text-slate-600 dark:text-slate-300">
            Gruba Git
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
