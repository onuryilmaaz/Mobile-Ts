import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { adhanService } from '@/services/adhan.service';

type Props = {
  visible: boolean;
  prayerName: string;
  onDismiss: () => void;
};

export default function AdhanModal({ visible, prayerName, onDismiss }: Props) {
  useEffect(() => {
    if (!visible) return;
    const cleanup = adhanService.addFinishedListener(onDismiss);
    return () => {
      cleanup?.();
    };
  }, [visible, onDismiss]);

  const handleStop = () => {
    adhanService.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleStop}>
      <Pressable className="flex-1 items-center justify-center" onPress={handleStop}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint="dark" className="absolute inset-0" pointerEvents="none" />
        ) : (
          <View className="absolute inset-0 bg-black/70" pointerEvents="none" />
        )}

        <Pressable
          className="mx-6 w-full max-w-xs items-center rounded-3xl border border-white/10 bg-slate-900/95 px-8 py-10"
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full border-2 border-teal-400/30 bg-teal-500/10">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-teal-500/20">
              <Ionicons name="moon" size={32} color="#14b8a6" />
            </View>
          </View>

          <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-400">
            Ezan Vakti
          </Text>
          <Text className="mb-2 text-2xl font-black text-white">{prayerName} Ezanı</Text>
          <Text className="mb-8 text-center text-sm text-white/50">Allah-u Ekber</Text>

          <TouchableOpacity
            onPress={handleStop}
            activeOpacity={0.7}
            className="w-full items-center rounded-2xl bg-white/10 py-4"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="stop-circle-outline" size={20} color="rgba(255,255,255,0.9)" />
              <Text className="text-base font-bold text-white/90">Ezanı Kapat</Text>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
