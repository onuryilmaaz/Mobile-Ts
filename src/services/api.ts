import axios from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  setAccessToken,
  setRefreshToken,
} from './token.service';

// Logout callback - will be set by auth store to avoid circular dependency
let logoutCallback: (() => Promise<void>) | null = null;

export function setLogoutCallback(callback: () => Promise<void>) {
  logoutCallback = callback;
}

//const BASE_URL = 'http://localhost:3000';
const BASE_URL = 'https://mobileapi-vxxh.onrender.com';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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

    // Handle timeout errors
    if (isTimeout && !requestUrl.includes('/auth/refresh')) {
      console.log('Timeout detected on:', requestUrl, '- attempting token refresh...');

      // Don't retry if already retried
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

    // Handle 401 errors
    if (status === 401) {
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (originalRequest?._retry) {
        console.log('401 retry already attempted, logging out...');
        if (logoutCallback) {
          await logoutCallback();
        } else {
          await clearTokens();
        }
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
        if (logoutCallback) {
          await logoutCallback();
        } else {
          await clearTokens();
        }
      }
    }

    return Promise.reject(error);
  }
);
