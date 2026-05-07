/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  setAccessToken,
  setRefreshToken,
} from './token.service';

let logoutCallback: (() => Promise<void>) | null = null;

export function setLogoutCallback(callback: () => Promise<void>) {
  logoutCallback = callback;
}

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const extraUrl = (Constants.expoConfig as any)?.extra?.apiUrl as string | undefined;

  // If explicitly provided, trust it.
  const explicit = (envUrl || extraUrl || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  // Android emulator -> host loopback
  if (Platform.OS === 'android') {
    // On Android emulator, localhost points to emulator, not host machine.
    return 'http://10.0.2.2:3000';
  }

  // iOS simulator -> localhost works
  // Physical devices -> derive LAN IP from Expo hostUri when possible.
  const hostUri = (Constants.expoConfig as any)?.hostUri as string | undefined; // e.g. "192.168.1.34:8081"
  const host = (hostUri || '').split(':')[0].trim();
  if (host && host !== 'localhost') {
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let isLoggingOut = false;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await removeAccessToken();
      return null;
    }

    try {
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      return data.accessToken as string;
    } catch {
      await clearTokens();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || '';
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');

    if (isTimeout && !requestUrl.includes('/auth/refresh')) {
      console.log('Timeout detected on:', requestUrl, '- attempting token refresh...');

      if (originalRequest?._retry) {
        console.log('Timeout retry already attempted, logging out...');
        if (logoutCallback) {
          await logoutCallback();
        } else {
          await clearTokens();
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log('Token refreshed successfully after timeout, retrying request...');
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        console.log('Token refresh failed after timeout, logging out...');
        if (logoutCallback) {
          await logoutCallback();
        } else {
          await clearTokens();
        }
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      if (
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/logout')
      ) {
        return Promise.reject(error);
      }

      if (isLoggingOut) {
        return Promise.reject(error);
      }

      if (originalRequest?._retry) {
        console.log('401 retry already attempted, logging out...');
        isLoggingOut = true;
        if (logoutCallback) {
          await logoutCallback();
        } else {
          await clearTokens();
        }
        isLoggingOut = false;
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      console.log('401 detected on:', requestUrl, '- attempting token refresh...');

      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log('Token refreshed successfully');
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        console.log('Token refresh failed, logging out...');
        if (!isLoggingOut) {
          isLoggingOut = true;
          if (logoutCallback) {
            await logoutCallback();
          } else {
            await clearTokens();
          }
          isLoggingOut = false;
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
