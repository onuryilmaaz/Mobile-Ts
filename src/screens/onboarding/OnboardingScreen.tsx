import { useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useOnboardingStore } from '@/store/onboarding.store';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  accentDim: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'moon',
    title: "Salah'a Hoş Geldiniz",
    description:
      'Günlük ibadetlerinizi kolaylaştırmak, manevi hayatınızı zenginleştirmek için tasarlandı.',
    accent: '#14b8a6',
    accentDim: 'rgba(20,184,166,0.12)',
  },
  {
    id: '2',
    icon: 'time-outline',
    title: 'Namaz Vakitleri',
    description:
      'Bulunduğunuz konuma göre hassas namaz vakitleri. Ezan bildirimleri ile hiçbir vakti kaçırmayın.',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.12)',
  },
  {
    id: '3',
    icon: 'compass-outline',
    title: 'Kıble Bulucu',
    description: "Dünyanın her yerinden Kabe'ye doğru kıble yönünü hassas pusula ile anında bulun.",
    accent: '#6366f1',
    accentDim: 'rgba(99,102,241,0.12)',
  },
  {
    id: '4',
    icon: 'book-outline',
    title: "Kur'an-ı Kerim",
    description:
      'Tüm sureler, Türkçe mealler ve sesli okuma. Kaldığınız sayfayı kaydedin, her an devam edin.',
    accent: '#10b981',
    accentDim: 'rgba(16,185,129,0.12)',
  },
  {
    id: '5',
    icon: 'trophy-outline',
    title: 'Hedefler & Başarılar',
    description:
      'Kaza namazlarınızı takip edin, zikir sayacı ile tesbih çekin. Puan ve rozetler kazanın.',
    accent: '#ec4899',
    accentDim: 'rgba(236,72,153,0.12)',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const complete = useOnboardingStore((s) => s.complete);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  async function handleFinish() {
    await complete();
    navigation.replace('UserTabs', undefined as any);
  }

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  }

  const isLast = currentIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[currentIndex];

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View className="absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-teal-500/[0.08]" />
      <View className="absolute -bottom-[60px] -left-[60px] h-[220px] w-[220px] rounded-full bg-indigo-500/[0.07]" />

      {!isLast && (
        <TouchableOpacity
          className="absolute right-6 z-10 rounded-full border border-white/[0.12] bg-white/[0.07] px-3.5 py-1.5"
          style={{ top: insets.top + 16 }}
          onPress={handleFinish}
          activeOpacity={0.7}>
          <Text className="text-[13px] font-semibold text-white/60">Geç</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0] });
          const translateY = scrollX.interpolate({ inputRange, outputRange: [40, 0, 40] });

          return (
            <View className="flex-1 items-center justify-center px-8" style={{ width }}>
              <Animated.View
                className="w-full items-center"
                style={{ opacity, transform: [{ translateY }] }}>
                <View
                  className="mb-10 h-[140px] w-[140px] items-center justify-center rounded-full"
                  style={{ backgroundColor: item.accentDim }}>
                  <View
                    className="h-[116px] w-[116px] items-center justify-center rounded-full border-[1.5px]"
                    style={{ borderColor: item.accent + '40' }}>
                    <Ionicons name={item.icon} size={52} color={item.accent} />
                  </View>
                </View>

                <Text className="mb-4 text-center text-[28px] font-extrabold text-white">
                  {item.title}
                </Text>

                <Text className="max-w-[300px] text-center text-[15px] leading-6 text-white/55">
                  {item.description}
                </Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View className="px-7 pt-2" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="mb-7 flex-row items-center justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <View
                className="h-2 rounded"
                style={{
                  width: i === currentIndex ? 24 : 8,
                  opacity: i === currentIndex ? 1 : 0.3,
                  backgroundColor: activeSlide.accent,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center rounded-[20px] py-4 shadow-lg"
          style={{ backgroundColor: activeSlide.accent }}
          onPress={handleNext}
          activeOpacity={0.85}>
          <Text className="text-base font-extrabold tracking-[0.5px] text-white">
            {isLast ? 'Başla' : 'İleri'}
          </Text>
          <Ionicons
            name={isLast ? 'checkmark' : 'arrow-forward'}
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
