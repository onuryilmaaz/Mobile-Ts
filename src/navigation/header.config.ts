import { Platform } from 'react-native';

export const HEADER_CONFIG = {
  backgroundColor: '#0f766e',
  height: 56,
  statusBarHeight: Platform.OS === 'android' ? 0 : undefined,
  tintColor: '#ffffff',
  titleColor: '#ffffff',
  titleStyle: {
    fontWeight: '600' as const,
    fontSize: 17,
    color: '#ffffff',
  },

  headerStyle: {
    backgroundColor: '#0f766e',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },

  headerTitleAlign: 'center' as const,
  headerShadowVisible: false,
  headerTintColor: '#ffffff',
};

export const getHeaderScreenOptions = () => ({
  headerStyle: HEADER_CONFIG.headerStyle,
  headerTintColor: HEADER_CONFIG.headerTintColor,
  headerTitleStyle: HEADER_CONFIG.titleStyle,
  headerTitleAlign: HEADER_CONFIG.headerTitleAlign,
  headerShadowVisible: HEADER_CONFIG.headerShadowVisible,
  ...(Platform.OS === 'android' && { headerStatusBarHeight: 0 }),
});
