import { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface UploadOverlayProps {
  visible: boolean;
  message?: string;
}

export function UploadOverlay({ visible, message = 'Yükleniyor...' }: UploadOverlayProps) {
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
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <BlurView intensity={40} tint="light" style={styles.blurView}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center rounded-3xl bg-white/90 px-10 py-8 shadow-xl">
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="absolute h-24 w-24 rounded-full bg-primary-100/30"
          />

          <Animated.View
            style={{ transform: [{ rotate: spin }] }}
            className="mb-4 h-20 w-20 items-center justify-center">
            <View className="absolute h-20 w-20 rounded-full border-4 border-slate-200/50" />
            <View className="absolute h-20 w-20 rounded-full border-4 border-transparent border-r-primary-300 border-t-primary-500" />

            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-100/80">
              <Ionicons name="cloud-upload" size={24} color="#0f766e" />
            </View>
          </Animated.View>

          <Text className="text-center text-base font-semibold text-slate-800">{message}</Text>
          <Text className="mt-1 text-center text-sm text-slate-500">Lütfen bekleyin...</Text>

          <View className="mt-4 flex-row gap-1.5">
            <AnimatedDot delay={0} />
            <AnimatedDot delay={200} />
            <AnimatedDot delay={400} />
          </View>
        </Animated.View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  blurView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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

  return <Animated.View style={{ opacity }} className="h-2 w-2 rounded-full bg-primary-500" />;
}
