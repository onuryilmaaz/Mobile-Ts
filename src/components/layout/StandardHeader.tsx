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
import { useAppTheme } from '@/constants/theme';

type StandardHeaderProps = {
  title: string;
  navigation: any;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  showProfile?: boolean;
};

export function StandardHeader({
  title,
  navigation,
  showBackButton = true,
  rightComponent,
  showProfile = true,
}: StandardHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const avatarUrl = user?.avatarUrl;
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const { colors, isDark } = useAppTheme();

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
        backgroundColor: colors.headerBg,
        paddingTop: finalStatusBarHeight,
        paddingBottom: 0,
        paddingHorizontal: 16,
        height: totalHeight,
        justifyContent: 'center',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.cardBorder,
      }}>
      {/* Subtle glow for dark mode */}
      {isDark && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: totalHeight, backgroundColor: 'rgba(20,184,166,0.04)', pointerEvents: 'none',
        }} />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 80 }}>
          {showBackButton && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 12,
                borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                paddingLeft: 6, alignSelf: 'flex-start'
              }}
              activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={isDark ? '#F0F4FF' : '#0f172a'} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#F0F4FF' : '#0f172a', marginLeft: 2 }}>Ana Sayfa</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16, fontWeight: '700', letterSpacing: 0.5,
              color: isDark ? '#F0F4FF' : '#0f172a',
            }}>
            {title}
          </Text>
        </View>

        <View style={{ width: 80, alignItems: 'flex-end' }}>
          {rightComponent ? (
            rightComponent
          ) : showProfile ? (
            <TouchableOpacity
              onPress={handleProfilePress}
              style={{
                height: 42, width: 42, alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', borderRadius: 14,
                borderWidth: 1, borderColor: isDark ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.2)',
                backgroundColor: isDark ? 'rgba(20,184,166,0.12)' : 'rgba(20,184,166,0.05)',
              }}>
              {isAuthenticated && avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ height: '100%', width: '100%' }} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={20} color={colors.teal} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 42 }} />
          )}
        </View>
      </View>
    </View>
  );
}
