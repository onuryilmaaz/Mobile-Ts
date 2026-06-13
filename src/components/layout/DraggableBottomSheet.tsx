/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const { height: SCREEN_H } = Dimensions.get('window');

const SPRING: WithSpringConfig = {
  damping: 24,
  stiffness: 240,
  mass: 0.9,
  overshootClamping: false,
};

/** Yüksekliğin bu oranından fazlası aşağı çekilirse sheet kapanır. */
const CLOSE_DISTANCE_RATIO = 0.3;
/** Bu hızın üstünde aşağı fırlatılırsa (px/sn) hemen kapanır. */
const CLOSE_VELOCITY = 900;
/** Klavye kapalıyken sheet en fazla ekranın bu oranı kadar olur. */
const MAX_HEIGHT_RATIO = 0.9;
/** Üstte notch altında bırakılacak minimum boşluk. */
const TOP_GAP = 8;

function resolveHeight(h?: number | string): number | undefined {
  if (h == null) return undefined;
  if (typeof h === 'number') return h;
  const pct = parseFloat(h);
  if (isNaN(pct)) return undefined;
  return (SCREEN_H * pct) / 100;
}

interface DraggableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Sabit yükseklik: "85%" gibi yüzde ya da px sayısı.
   * Verilmezse sheet içeriğin gerçek yüksekliği kadar açılır (en fazla ekranın %90'ı).
   * İçinde `flex-1` ScrollView olan formlarda mutlaka değer ver — auto yükseklikte flex çöker.
   */
  height?: number | string;
  isDark?: boolean;
  avoidKeyboard?: boolean;
  closeOnBackdropPress?: boolean;
  backdropOpacity?: number;
}

export function DraggableBottomSheet({
  visible,
  onClose,
  children,
  height,
  isDark = false,
  avoidKeyboard = true,
  closeOnBackdropPress = true,
  backdropOpacity = 0.5,
}: DraggableBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const fixedHeight = resolveHeight(height);

  // translateY: 0 = tamamen açık, sheetH = ekranın altında gizli.
  const translateY = useSharedValue(fixedHeight ?? SCREEN_H);
  const sheetH = useSharedValue(fixedHeight ?? SCREEN_H);
  const context = useSharedValue(0);
  // Klavye yüksekliği (px). withTiming ile yumuşak takip eder.
  const keyboardH = useSharedValue(0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Klavye yüksekliğini takip et. Modal içinde useAnimatedKeyboard güvenilir
  // çalışmadığı için JS listener + shared value kullanıyoruz; böylece sheet'i
  // tam klavye kadar yukarı kaldırıp maxHeight'i ona göre kısabiliriz.
  useEffect(() => {
    if (!avoidKeyboard) return;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      keyboardH.value = withTiming(e.endCoordinates.height, {
        duration: e.duration > 0 ? e.duration : 250,
      });
    });
    const hideSub = Keyboard.addListener(hideEvt, (e) => {
      keyboardH.value = withTiming(0, {
        duration: e.duration > 0 ? e.duration : 250,
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [avoidKeyboard]);

  const triggerClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      translateY.value = withSpring(0, SPRING);
    } else {
      translateY.value = withSpring(sheetH.value, SPRING, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible, mounted]);

  // Auto yükseklikte gerçek boyu ölçüp drag/kapanma mesafesini buna göre ayarla.
  const onSheetLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) sheetH.value = h;
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          context.value = translateY.value;
        })
        .onUpdate((e) => {
          // Sadece aşağı doğru sürüklemeye izin ver.
          translateY.value = Math.max(0, context.value + e.translationY);
        })
        .onEnd((e) => {
          const shouldClose =
            e.translationY > sheetH.value * CLOSE_DISTANCE_RATIO ||
            e.velocityY > CLOSE_VELOCITY;

          if (shouldClose) {
            translateY.value = withSpring(sheetH.value, SPRING, (finished) => {
              if (finished) scheduleOnRN(setMounted, false);
            });
            scheduleOnRN(triggerClose);
          } else {
            translateY.value = withSpring(0, SPRING);
          }
        }),
    [triggerClose],
  );

  const sheetStyle = useAnimatedStyle(() => {
    const kb = keyboardH.value;
    // Klavye açıkken sheet'i tam klavye kadar yukarı kaldır ve kullanılabilir
    // alana göre maxHeight'i kıs — footer hep klavyenin üstünde, içerik scroll eder.
    const available = SCREEN_H - topInset - TOP_GAP - kb;
    return {
      transform: [{ translateY: translateY.value }],
      marginBottom: kb,
      maxHeight: Math.min(SCREEN_H * MAX_HEIGHT_RATIO, available),
      paddingBottom: kb > 0.5 ? 0 : bottomInset,
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, sheetH.value],
      [backdropOpacity, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={triggerClose}
      statusBarTranslucent>
      <View className="flex-1 justify-end">
        <Animated.View className="absolute inset-0 bg-black" style={backdropStyle}>
          {closeOnBackdropPress ? (
            <Pressable className="flex-1" onPress={triggerClose} />
          ) : null}
        </Animated.View>

        <Animated.View
          onLayout={onSheetLayout}
          className={`overflow-hidden rounded-t-3xl ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}
          style={[sheetStyle, { height: fixedHeight }]}>
          <GestureDetector gesture={pan}>
            <View className="items-center py-3">
              <View
                className={`h-1 w-12 rounded-full ${
                  isDark ? 'bg-slate-600' : 'bg-slate-300'
                }`}
              />
            </View>
          </GestureDetector>
          {/*
            Sabit yükseklikte içerik flex-1 ile yerleşir.
            Auto yükseklikte çocuk doğrudan render edilir; form kökü `shrink` olmalı ki
            içerik kadar boyut alsın, alan daralınca (klavye) scroll alanı küçülüp kayar.
          */}
          {fixedHeight != null ? (
            <View style={{ flex: 1 }}>{children}</View>
          ) : (
            children
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
