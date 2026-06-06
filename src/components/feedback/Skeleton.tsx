import React, { useEffect } from 'react';
import { View, type ViewStyle, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  className?: string;
  style?: ViewStyle;
};

/**
 * Pulsing shimmer placeholder. Cheap on the JS thread — animation runs on UI thread.
 * Place wherever a small block of content (text line, avatar, button) is loading.
 */
export function Skeleton({
  width,
  height = 14,
  radius = 6,
  className,
  style,
}: SkeletonProps) {
  const { isDark } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.55, 1]),
  }));

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
        },
        animated,
        style,
      ]}
    />
  );
}

// ─── Composite shapes ────────────────────────────────────────────────────────

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} radius={size / 2} className={className} />;
}

export function SkeletonLine({ width = '100%', className }: { width?: DimensionValue; className?: string }) {
  return <Skeleton width={width} height={12} radius={4} className={className} />;
}

/**
 * Card-shaped block with rounded corners. Same dimensions as common cards.
 */
export function SkeletonCard({
  height = 120,
  className,
  style,
}: {
  height?: DimensionValue;
  className?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      className={`mx-4 mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className ?? ''}`}
      style={style}>
      <Skeleton width="100%" height={height} radius={16} />
    </View>
  );
}

/**
 * List item layout: avatar/icon + 2 lines of text.
 */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <View className={`flex-row items-center gap-3 ${className ?? ''}`}>
      <SkeletonCircle size={44} />
      <View className="flex-1 gap-2">
        <SkeletonLine width="70%" />
        <SkeletonLine width="40%" />
      </View>
    </View>
  );
}
