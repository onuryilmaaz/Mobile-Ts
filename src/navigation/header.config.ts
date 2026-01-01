import { Platform } from 'react-native';

/**
 * Tüm sayfalarda tutarlı header yapılandırması
 * iOS ve Android için aynı yükseklik, genişlik ve renk
 */
export const HEADER_CONFIG = {
  // Header rengi - tüm cihazlarda aynı
  backgroundColor: '#0f766e',
  
  // Header yüksekliği - iOS ve Android için aynı
  // React Navigation default: iOS 44px, Android 56px
  // Biz her ikisinde de 56px kullanıyoruz
  height: 56,
  
  // Status bar yüksekliği - platform'a göre hesaplanır
  // Android'de status bar header içinde değil, ayrı
  // iOS'ta status bar header'ın üstünde
  statusBarHeight: Platform.OS === 'android' ? 0 : undefined,
  
  // Text renkleri
  tintColor: '#ffffff',
  titleColor: '#ffffff',
  
  // Text stilleri
  titleStyle: {
    fontWeight: '600' as const,
    fontSize: 17,
    color: '#ffffff',
  },
  
  // Header stilleri
  // Not: React Navigation header yüksekliği platform'a göre otomatik ayarlanır
  // iOS: 44px, Android: 56px. Görsel tutarlılık için aynı renk ve stil kullanıyoruz
  headerStyle: {
    backgroundColor: '#0f766e',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  
  // Diğer ayarlar
  headerTitleAlign: 'center' as const,
  headerShadowVisible: false,
  headerTintColor: '#ffffff',
};

/**
 * React Navigation screenOptions için hazır yapılandırma
 * Tüm platformlarda aynı renk, genişlik ve stil
 * Not: React Navigation header yüksekliği platform'a göre otomatik ayarlanır
 * (iOS: 44px, Android: 56px). Görsel tutarlılık için aynı renk ve stil kullanılıyor.
 */
export const getHeaderScreenOptions = () => ({
  headerStyle: HEADER_CONFIG.headerStyle,
  headerTintColor: HEADER_CONFIG.headerTintColor,
  headerTitleStyle: HEADER_CONFIG.titleStyle,
  headerTitleAlign: HEADER_CONFIG.headerTitleAlign,
  headerShadowVisible: HEADER_CONFIG.headerShadowVisible,
  // Android'de status bar height'ı 0 yapıyoruz çünkü status bar ayrı
  ...(Platform.OS === 'android' && { headerStatusBarHeight: 0 }),
});

