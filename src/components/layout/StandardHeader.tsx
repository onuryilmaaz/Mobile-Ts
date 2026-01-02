import { Platform, View, Text, TouchableOpacity, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HEADER_CONFIG } from '@/navigation/header.config';

type StandardHeaderProps = {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
};

export function StandardHeader({
  title,
  showBackButton = true,
  rightComponent,
}: StandardHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
      <View className="flex-row items-center">
        {showBackButton && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="-ml-1 flex-row items-center py-2 pr-3"
            activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={HEADER_CONFIG.tintColor} />
            <Text className="-ml-0.5 text-base font-medium text-white">Geri</Text>
          </TouchableOpacity>
        )}
        <View className="flex-1 items-center">
          <Text
            style={{
              ...HEADER_CONFIG.titleStyle,
              color: HEADER_CONFIG.titleColor,
            }}>
            {title}
          </Text>
        </View>
        {rightComponent && <View className="w-16">{rightComponent}</View>}
        {!rightComponent && showBackButton && <View className="w-16" />}
      </View>
    </View>
  );
}
