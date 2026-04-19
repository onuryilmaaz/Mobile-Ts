import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export function SplashScreen() {
  // Logo animasyonları
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(40)).current;

  // Başlık animasyonları
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;

  // Alt yazı animasyonu
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  // Yükleme çubuğu
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Parlama efekti
  const shimmerX = useRef(new Animated.Value(-width)).current;

  // Dekoratif halkalar
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sıralı animasyonlar
    Animated.sequence([
      // 1. Halkalar belir
      Animated.parallel([
        Animated.timing(ring1Opacity, {
          toValue: 0.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 2. Logo fırlama animasyonu
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      // 3. Başlık kayma
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // 4. Alt yazı
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // 5. Kısa bekleme
      Animated.delay(100),
    ]).start();

    // İlerleme çubuğu (bağımsız - ayrı timing)
    Animated.timing(progressWidth, {
      toValue: width - 80,
      duration: 2200,
      delay: 600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Parlama loop'u
    const shimmerLoop = () => {
      shimmerX.setValue(-width);
      Animated.timing(shimmerX, {
        toValue: width * 2,
        duration: 1800,
        delay: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => shimmerLoop());
    };
    shimmerLoop();

    // Halka nefes animasyonu (loop)
    const ringBreath = () => {
      Animated.sequence([
        Animated.timing(ring1Scale, {
          toValue: 1.05,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ring1Scale, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => ringBreath());
    };
    setTimeout(ringBreath, 1000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Gradient benzeri arka plan katmanları */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Dekoratif büyük halkalar */}
      <Animated.View
        style={[
          styles.ring,
          styles.ring1,
          { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          styles.ring2,
          { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
        ]}
      />

      {/* Merkez içerik */}
      <View style={styles.content}>
        {/* Logo kartı */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoY }],
            },
          ]}>
          {/* Parlama efekti */}
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerX }, { rotate: '20deg' }],
              },
            ]}
          />
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Uygulama adı */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          }}>
          <Text style={styles.appName}>Salah</Text>
          <Text style={styles.arabicName}>الصلاة</Text>
        </Animated.View>

        {/* Alt slogan */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Namaz vakitleri & dini rehber
        </Animated.Text>
      </View>

      {/* Alt yükleme çubuğu */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Animated.Text style={[styles.loadingText, { opacity: subtitleOpacity }]}>
          Yükleniyor...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#0d9488',
    borderBottomLeftRadius: height * 0.5,
    borderBottomRightRadius: height * 0.5,
    opacity: 0.4,
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: '#134e4a',
    borderTopLeftRadius: height * 0.4,
    borderTopRightRadius: height * 0.4,
    opacity: 0.35,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  ring1: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    top: height / 2 - (width * 0.85) / 2 - 60,
  },
  ring2: {
    width: width * 1.15,
    height: width * 1.15,
    borderRadius: (width * 1.15) / 2,
    top: height / 2 - (width * 1.15) / 2 - 60,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  shimmer: {
    position: 'absolute',
    top: -20,
    width: 60,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 10,
  },
  logo: {
    width: 115,
    height: 115,
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  arabicName: {
    fontSize: 26,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: width,
    paddingHorizontal: 40,
  },
  progressTrack: {
    width: width - 80,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
