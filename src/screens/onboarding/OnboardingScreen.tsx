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
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useOnboardingStore } from '@/store/onboarding.store';
import { notificationService } from '@/services/notification.service';
import {
  getStateByName,
  getDefaultDistrictForState,
  STATES,
} from '@/constants/locations';

const STORAGE_STATE_ID_KEY = 'SELECTED_STATE_ID';
const STORAGE_DISTRICT_ID_KEY = 'SELECTED_DISTRICT_ID';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

type SlideKind = 'info' | 'permission_location' | 'permission_notifications';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  accentDim: string;
  kind?: SlideKind;
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
    icon: 'bar-chart-outline',
    title: 'İbadet Takibi',
    description:
      "Namaz, Kur'an, nafile, oruç, sadaka, dua ve ezber ibadetlerinizi kaydedin. Günlük ve haftalık istatistiklerinizi takip edin.",
    accent: '#0ea5e9',
    accentDim: 'rgba(14,165,233,0.12)',
  },
  {
    id: '6',
    icon: 'people-outline',
    title: 'Topluluk & Gruplar',
    description:
      'Arkadaşlarınızla gruplar kurun, birlikte hedefler belirleyin ve liderlik tablosunda yarışın. Manevi yolculuğunuzda yalnız değilsiniz.',
    accent: '#8b5cf6',
    accentDim: 'rgba(139,92,246,0.12)',
  },
  {
    id: '7',
    icon: 'home-outline',
    title: 'Aile Modu',
    description:
      'Çocuklarınız için profil oluşturun, ibadet görevleri atayın. Görevleri tamamlayan çocuklarınız yıldız kazanarak ödüllerini seçebilir.',
    accent: '#f97316',
    accentDim: 'rgba(249,115,22,0.12)',
  },
  {
    id: '8',
    icon: 'trophy-outline',
    title: 'Hedefler & Başarılar',
    description:
      'Kaza namazlarınızı takip edin, zikir sayacı ile tesbih çekin. Puan ve rozetler kazanarak manevi ilerlemenizi görün.',
    accent: '#ec4899',
    accentDim: 'rgba(236,72,153,0.12)',
  },
  {
    id: '9',
    icon: 'location-outline',
    title: 'Konumunuzu Ayarlayın',
    description:
      'Doğru namaz vakitleri için konumunuza ihtiyacımız var. İzin verirseniz şehrinizi otomatik buluruz; istemezseniz daha sonra elle seçebilirsiniz.',
    accent: '#0ea5e9',
    accentDim: 'rgba(14,165,233,0.12)',
    kind: 'permission_location',
  },
  {
    id: '10',
    icon: 'notifications-outline',
    title: 'Bildirimleri Aç',
    description:
      'Her namaz vaktinde nazikçe hatırlatma alın. Ezan sesi ve ayet/hadis bildirimleri opsiyoneldir, her zaman ayarlardan kapatabilirsiniz.',
    accent: '#a855f7',
    accentDim: 'rgba(168,85,247,0.12)',
    kind: 'permission_notifications',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const complete = useOnboardingStore((s) => s.complete);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const descColor = isDark ? 'rgba(241,245,249,0.55)' : '#64748b';
  const skipBorderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const skipBgColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const skipTextColor = isDark ? 'rgba(255,255,255,0.60)' : '#94a3b8';
  const orb1Color = isDark ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.10)';
  const orb2Color = isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.08)';

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<Record<string, boolean>>({});

  async function handleFinish() {
    await complete();
    navigation.replace('UserTabs', undefined as any);
  }

  function goNextSlide() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  }

  async function requestLocation() {
    setPermissionBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const geo = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          const region = geo[0]?.region ?? geo[0]?.city ?? '';
          const normalize = (s: string) =>
            s.toUpperCase().replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ş/g, 'S').replace(/Ç/g, 'C').replace(/Ö/g, 'O').replace(/Ü/g, 'U');
          const state =
            getStateByName(region) ??
            (STATES as any[]).find(
              (s) => normalize(s.name) === normalize(region) || normalize(s.name_en) === normalize(region),
            );
          if (state) {
            const district = getDefaultDistrictForState(state._id);
            if (district) {
              await AsyncStorage.setItem(STORAGE_STATE_ID_KEY, state._id);
              await AsyncStorage.setItem(STORAGE_DISTRICT_ID_KEY, district._id);
            }
          }
        } catch {
          // Geocoding hatası — kullanıcı sonradan elle seçebilir
        }
        setPermissionGranted((p) => ({ ...p, location: true }));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPermissionBusy(false);
      goNextSlide();
    }
  }

  async function requestNotifications() {
    setPermissionBusy(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await notificationService.enableNotifications();
        setPermissionGranted((p) => ({ ...p, notifications: true }));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPermissionBusy(false);
      goNextSlide();
    }
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const slide = SLIDES[currentIndex];
    if (slide?.kind === 'permission_location' && !permissionGranted.location) {
      requestLocation();
      return;
    }
    if (slide?.kind === 'permission_notifications' && !permissionGranted.notifications) {
      requestNotifications();
      return;
    }
    goNextSlide();
  }

  function handleSkipPermission() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goNextSlide();
  }

  const isLast = currentIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[currentIndex]!;
  const isPermissionSlide =
    activeSlide.kind === 'permission_location' || activeSlide.kind === 'permission_notifications';
  const alreadyGranted =
    (activeSlide.kind === 'permission_location' && permissionGranted.location) ||
    (activeSlide.kind === 'permission_notifications' && permissionGranted.notifications);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: orb1Color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: orb2Color,
        }}
      />

      {!isLast && !isPermissionSlide && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 24,
            top: insets.top + 16,
            zIndex: 10,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: skipBorderColor,
            backgroundColor: skipBgColor,
          }}
          onPress={handleFinish}
          activeOpacity={0.7}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: skipTextColor }}>Geç</Text>
        </TouchableOpacity>
      )}

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

          const iconBg = isDark ? item.accentDim : item.accentDim.replace('0.12', '0.10');

          return (
            <View
              style={{
                width,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 32,
              }}>
              <Animated.View
                style={{
                  width: '100%',
                  alignItems: 'center',
                  opacity,
                  transform: [{ translateY }],
                }}>
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    backgroundColor: iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 40,
                    shadowColor: item.accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark ? 0.2 : 0.15,
                    shadowRadius: 20,
                  }}>
                  <View
                    style={{
                      width: 116,
                      height: 116,
                      borderRadius: 58,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: item.accent + '40',
                    }}>
                    <Ionicons name={item.icon} size={52} color={item.accent} />
                  </View>
                </View>

                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '800',
                    color: titleColor,
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                  {item.title}
                </Text>

                <Text
                  style={{
                    fontSize: 15,
                    lineHeight: 24,
                    color: descColor,
                    textAlign: 'center',
                    maxWidth: 300,
                  }}>
                  {item.description}
                </Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View style={{ paddingHorizontal: 28, paddingTop: 8, paddingBottom: insets.bottom + 24 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 28,
          }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}>
              <View
                style={{
                  height: 8,
                  width: i === currentIndex ? 24 : 8,
                  borderRadius: 4,
                  opacity: i === currentIndex ? 1 : 0.3,
                  backgroundColor: activeSlide.accent,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          disabled={permissionBusy}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            paddingVertical: 16,
            backgroundColor: activeSlide.accent,
            opacity: permissionBusy ? 0.7 : 1,
            shadowColor: activeSlide.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          }}
          onPress={handleNext}
          activeOpacity={0.85}>
          <Text style={{ fontSize: 16, fontWeight: '800', letterSpacing: 0.5, color: '#fff' }}>
            {alreadyGranted
              ? 'Devam Et'
              : activeSlide.kind === 'permission_location'
                ? 'Konum İznini Ver'
                : activeSlide.kind === 'permission_notifications'
                  ? 'Bildirimleri Aç'
                  : isLast
                    ? 'Başla'
                    : 'İleri'}
          </Text>
          <Ionicons
            name={
              alreadyGranted
                ? 'checkmark-circle'
                : isPermissionSlide
                  ? 'shield-checkmark'
                  : isLast
                    ? 'checkmark'
                    : 'arrow-forward'
            }
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {/* Skip permission link — only on permission slides */}
        {isPermissionSlide && !alreadyGranted && (
          <TouchableOpacity
            onPress={handleSkipPermission}
            activeOpacity={0.6}
            style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 6, paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: skipTextColor }}>
              Şimdilik atla
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
