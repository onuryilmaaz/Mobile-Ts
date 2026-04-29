import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme.store';

interface UploadOverlayProps {
  visible: boolean;
  message?: string;
}

export function UploadOverlay({ visible, message = 'Yükleniyor...' }: UploadOverlayProps) {
  const { isDark } = useThemeStore();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        rotateAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, rotateAnim, scaleAnim, opacityAnim, pulseAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View className="absolute inset-0 z-[1000]" style={{ opacity: opacityAnim }}>
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center rounded-[40px] bg-white dark:bg-slate-900 px-12 py-10 shadow-2xl">
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="absolute h-28 w-28 rounded-full bg-teal-100/50 dark:bg-teal-500/10"
          />

          <Animated.View
            style={{ transform: [{ rotate: spin }] }}
            className="mb-6 h-20 w-20 items-center justify-center">
            <View className="absolute h-20 w-20 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <View className="absolute h-20 w-20 rounded-full border-4 border-transparent border-r-teal-400 border-t-teal-600 dark:border-r-teal-500 dark:border-t-teal-400" />

            <View className="h-12 w-12 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/20">
              <Ionicons name="cloud-upload" size={24} color={isDark ? "#2dd4bf" : "#0f766e"} />
            </View>
          </Animated.View>

          <Text className="text-center text-lg font-bold text-slate-900 dark:text-white">{message}</Text>
          <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">Lütfen bekleyin...</Text>

          <View className="mt-6 flex-row gap-2">
            <AnimatedDot delay={0} />
            <AnimatedDot delay={200} />
            <AnimatedDot delay={400} />
          </View>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
}

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay]);

  return <Animated.View style={{ opacity }} className="h-2 w-2 rounded-full bg-teal-500" />;
}
