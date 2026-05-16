import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

const DEFAULT_SNAP_PARTIAL = SCREEN_H * 0.56;
const DEFAULT_SNAP_FULL = SCREEN_H * 0.9;

interface DraggableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: (panHandlers: ReturnType<typeof PanResponder.create>['panHandlers']) => React.ReactNode;
  snapPartial?: number;
  snapFull?: number;
  isDark?: boolean;
  avoidKeyboard?: boolean;
}

export function DraggableBottomSheet({
  visible,
  onClose,
  children,
  snapPartial = DEFAULT_SNAP_PARTIAL,
  snapFull = DEFAULT_SNAP_FULL,
  isDark = false,
  avoidKeyboard = true,
}: DraggableBottomSheetProps) {
  const sheetHeight = useRef(new Animated.Value(snapPartial)).current;
  const currentH = useRef(snapPartial);
  const snapRef = useRef<'partial' | 'full'>('partial');
  const gestureStartH = useRef(snapPartial);

  useEffect(() => {
    const id = sheetHeight.addListener(({ value }) => {
      currentH.current = value;
    });
    return () => sheetHeight.removeListener(id);
  }, []);

  useEffect(() => {
    if (visible) {
      sheetHeight.setValue(snapPartial);
      snapRef.current = 'partial';
    }
  }, [visible]);

  const snapTo = (h: number) => {
    snapRef.current = h >= snapFull ? 'full' : 'partial';
    Animated.spring(sheetHeight, {
      toValue: h,
      useNativeDriver: false,
      tension: 60,
      friction: 12,
    }).start();
  };

  const close = () => {
    sheetHeight.setValue(snapPartial);
    snapRef.current = 'partial';
    onClose();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 5 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation();
        gestureStartH.current = currentH.current;
      },
      onPanResponderMove: (_, g) => {
        const next = gestureStartH.current - g.dy;
        sheetHeight.setValue(Math.max(snapPartial * 0.4, Math.min(snapFull, next)));
      },
      onPanResponderRelease: (_, g) => {
        const finalH = gestureStartH.current - g.dy;
        if (g.vy > 0.8 && snapRef.current === 'partial') {
          close();
          return;
        }
        if (g.vy < -0.5) {
          snapTo(snapFull);
          return;
        }
        if (finalH < snapPartial * 0.6) {
          close();
        } else if (finalH > (snapPartial + snapFull) / 2) {
          snapTo(snapFull);
        } else {
          snapTo(snapRef.current === 'full' ? snapFull : snapPartial);
        }
      },
    })
  ).current;

  const content = (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <TouchableOpacity
        className="absolute inset-0 bg-black/50"
        activeOpacity={1}
        onPress={close}
      />
      <Animated.View
        className={`overflow-hidden rounded-t-3xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}
        style={{ height: sheetHeight }}>
        {children(panResponder.panHandlers)}
      </Animated.View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}
