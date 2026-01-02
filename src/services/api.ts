import axios from 'axios';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  setAccessToken,
  setRefreshToken,
} from './token.service';

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

    if (status === 401) {
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (originalRequest?._retry) {
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
        console.log('Token refresh failed, user needs to re-login');
      }
    }

    return Promise.reject(error);
  }
);
