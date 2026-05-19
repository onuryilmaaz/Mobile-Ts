import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function syncToWidget(key: 'accessToken' | 'refreshToken', value: string) {
  if (Platform.OS !== 'ios') return;
  NativeModules.SalahLiveActivityModule?.updateAuthData?.({ [key]: value });
}

export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  syncToWidget('accessToken', token);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function removeAccessToken() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  syncToWidget('accessToken', '');
}

export async function setRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  syncToWidget('refreshToken', token);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  if (Platform.OS === 'ios') {
    NativeModules.SalahLiveActivityModule?.updateAuthData?.({ accessToken: '', refreshToken: '' });
  }
}
