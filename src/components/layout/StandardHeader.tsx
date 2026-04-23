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
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HEADER_CONFIG } from '@/navigation/header.config';
import { useAuthStore } from '@/modules/auth/auth.store';

type StandardHeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  showProfile?: boolean;
};

export function StandardHeader({
  title,
  showBackButton = true,
  rightComponent,
  showProfile = true,
}: StandardHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();
  const avatarUrl = user?.avatarUrl;
  const [statusBarHeight, setStatusBarHeight] = useState(0);

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
      style={{
        backgroundColor: HEADER_CONFIG.backgroundColor,
        paddingTop: finalStatusBarHeight,
        paddingBottom: 0,
        paddingHorizontal: 16,
        height: totalHeight,
        justifyContent: 'center',
        width: '100%',
      }}>
      <View className="flex-row items-center justify-between">
        <View className="w-16">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              className="-ml-1 flex-row items-center py-2 pr-3"
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={HEADER_CONFIG.tintColor} />
              <Text className="-ml-0.5 text-base font-medium text-white">Geri</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-1 items-center">
          <Text
            numberOfLines={1}
            style={{
              ...HEADER_CONFIG.titleStyle,
              color: HEADER_CONFIG.titleColor,
            }}>
            {title}
          </Text>
        </View>

        <View className="w-16 items-end">
          {rightComponent ? (
            rightComponent
          ) : showProfile ? (
            <TouchableOpacity
              onPress={handleProfilePress}
              className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white/20">
              {isAuthenticated && avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={24} color="white" />
              )}
            </TouchableOpacity>
          ) : (
            <View className="w-12" />
          )}
        </View>
      </View>
    </View>
  );
}
