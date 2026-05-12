/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HEADER_CONFIG } from '@/navigation/header.config';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useTheme } from '@/hooks/useTheme';

type StandardHeaderProps = {
  title: string;
  navigation: any;
  showBackButton?: boolean;
  backTitle?: string;
  rightComponent?: React.ReactNode;
  showProfile?: boolean;
};

export function StandardHeader({
  title,
  navigation,
  showBackButton = true,
  backTitle = 'Geri',
  rightComponent,
  showProfile = true,
}: StandardHeaderProps) {
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (error) {
    insets = { top: 0, bottom: 0, left: 0, right: 0 };
  }
  const { user, isAuthenticated } = useAuthStore();
  const avatarUrl = user?.avatarUrl;
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const height = RNStatusBar.currentHeight || 0;
      setStatusBarHeight(height);
    }
  }, []);

  const headerHeight = HEADER_CONFIG.height;
  const finalStatusBarHeight = Platform.OS === 'android' ? statusBarHeight : insets.top;
  const totalHeight = finalStatusBarHeight + headerHeight;
  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAuthenticated) {
      navigation.navigate('Home' as any, { screen: 'Profile' });
    } else {
      navigation.navigate('Auth' as any);
    }
  };

  return (
    <View
      className="w-full justify-center border-b border-slate-200 bg-white dark:border-white/[6%] dark:bg-[#0b1220]"
      style={{
        paddingTop: finalStatusBarHeight,
        paddingBottom: 0,
        paddingHorizontal: 16,
        height: totalHeight,
      }}>
      {isDark && (
        <View
          className="pointer-events-none absolute inset-0 bg-teal-500/5"
          style={{ height: totalHeight }}
        />
      )}

      <View className="flex-row items-center justify-between">
        <View className="w-20">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              className="flex-row items-center self-start rounded-full bg-black/5 py-2 pl-1.5 pr-3 dark:bg-white/5"
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={isDark ? '#F0F4FF' : '#0f172a'} />
              <Text className="ml-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                {backTitle}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-1 items-center">
          <Text
            numberOfLines={1}
            className="text-[20px] font-black tracking-widest text-amber-500"
            style={{ textShadowColor: 'rgba(246,195,88,0.4)', textShadowRadius: 8 }}>
            {title}
          </Text>
        </View>

        <View className="w-20 items-end">
          {rightComponent ? (
            rightComponent
          ) : showProfile ? (
            <TouchableOpacity
              onPress={handleProfilePress}
              className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-teal-600 bg-teal-600/5 dark:border-white">
              {isAuthenticated && avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={20} color={isDark ? '#14b8a6' : '#0f766e'} />
              )}
            </TouchableOpacity>
          ) : (
            <View className="w-[42px]" />
          )}
        </View>
      </View>
    </View>
  );
}
