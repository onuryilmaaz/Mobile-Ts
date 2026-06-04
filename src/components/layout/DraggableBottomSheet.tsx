/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const { height: SCREEN_H } = Dimensions.get('window');

const SPRING: WithSpringConfig = {
  damping: 50,
  stiffness: 320,
  mass: 1,
  overshootClamping: false,
};

const VELOCITY_FACTOR = 0.15;
const DEFAULT_SNAP_PARTIAL = SCREEN_H * 0.56;
const DEFAULT_SNAP_FULL = SCREEN_H * 0.9;

interface DraggableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** "50%" gibi yüzde stringi ya da px sayısı. Verilmezse snapPartial/snapFull kullanılır. */
  snapPoints?: (number | string)[];
  snapPartial?: number;
  snapFull?: number;
  isDark?: boolean;
  avoidKeyboard?: boolean;
  enablePanDownToClose?: boolean;
  closeOnBackdropPress?: boolean;
  backdropOpacity?: number;
}

export function DraggableBottomSheet({
  visible,
  onClose,
  children,
  snapPoints,
  snapPartial = DEFAULT_SNAP_PARTIAL,
  snapFull = DEFAULT_SNAP_FULL,
  isDark = false,
  avoidKeyboard = true,
  enablePanDownToClose = true,
  closeOnBackdropPress = true,
  backdropOpacity = 0.5,
}: DraggableBottomSheetProps) {
  const sortedHeights = useMemo(() => {
    const raw =
      snapPoints && snapPoints.length > 0
        ? snapPoints.map((p) => {
            if (typeof p === 'number') return p;
            const pct = parseFloat(p);
            if (isNaN(pct)) throw new Error(`Geçersiz snapPoint: "${p}"`);
            return (SCREEN_H * pct) / 100;
          })
        : [snapPartial, snapFull];
    return [...raw].sort((a, b) => a - b);
  }, [snapPoints, snapPartial, snapFull]);

  const maxHeight = sortedHeights[sortedHeights.length - 1];

  const sheetHeight = useSharedValue(0);
  const context = useSharedValue(0);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      sheetHeight.value = withSpring(sortedHeights[0], SPRING);
    } else {
      sheetHeight.value = withSpring(0, SPRING, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible, mounted, sortedHeights]);

  const triggerClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          context.value = sheetHeight.value;
        })
        .onUpdate((e) => {
          const next = context.value - e.translationY;
          sheetHeight.value = Math.max(0, Math.min(next, maxHeight));
        })
        .onEnd((e) => {
          const projected = sheetHeight.value - e.velocityY * VELOCITY_FACTOR;
          const candidates = enablePanDownToClose
            ? [0, ...sortedHeights]
            : sortedHeights;

          let closest = candidates[0];
          let closestIdx = 0;
          for (let i = 1; i < candidates.length; i++) {
            if (
              Math.abs(candidates[i] - projected) <
              Math.abs(closest - projected)
            ) {
              closest = candidates[i];
              closestIdx = i;
            }
          }

          const isClosingGesture = enablePanDownToClose && closestIdx === 0;

          if (isClosingGesture) {
            sheetHeight.value = withSpring(0, SPRING, (finished) => {
              if (finished) scheduleOnRN(setMounted, false);
            });
            scheduleOnRN(triggerClose);
          } else {
            sheetHeight.value = withSpring(closest, SPRING);
          }
        }),
    [sortedHeights, maxHeight, enablePanDownToClose, triggerClose],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      sheetHeight.value,
      [0, sortedHeights[0]],
      [0, backdropOpacity],
      Extrapolation.CLAMP,
    ),
  }));

  const content = (
    <View className="flex-1 justify-end">
      <Animated.View className="absolute inset-0 bg-black" style={backdropStyle}>
        {closeOnBackdropPress ? (
          <Pressable className="flex-1" onPress={triggerClose} />
        ) : null}
      </Animated.View>

      <Animated.View
        className={`overflow-hidden rounded-t-3xl ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}
        style={sheetStyle}>
        <GestureDetector gesture={pan}>
          <View className="items-center py-3">
            <View
              className={`h-1 w-12 rounded-full ${
                isDark ? 'bg-slate-600' : 'bg-slate-300'
              }`}
            />
          </View>
        </GestureDetector>
        <View className="flex-1">{children}</View>
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={triggerClose}
      statusBarTranslucent>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}
