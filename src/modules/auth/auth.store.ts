import { create } from 'zustand';
import { authApi } from './auth.api';
import { userApi } from '@/modules/user/user.api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  setAccessToken,
  setRefreshToken,
} from '@/services/token.service';
import type { AuthUser } from './auth.types';

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  refreshTokens: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const [storedAccess, storedRefresh] = await Promise.all([
        getAccessToken(),
        getRefreshToken(),
      ]);

      console.log(
        'Hydrate: storedAccess exists:',
        !!storedAccess,
        'storedRefresh exists:',
        !!storedRefresh
      );

      if (!storedAccess && !storedRefresh) {
        console.log('Hydrate: No tokens found, setting hydrated');
        set({ hydrated: true });
        return;
      }

      let nextAccess = storedAccess;
      let nextRefresh = storedRefresh;

      if (storedRefresh && !storedAccess) {
        console.log('Hydrate: Only refresh token exists, attempting refresh...');
        try {
          const { data } = await authApi.refresh(storedRefresh);
          nextAccess = data.accessToken;
          nextRefresh = data.refreshToken;
          await setAccessToken(nextAccess);
          await setRefreshToken(nextRefresh);
          console.log('Hydrate: Refresh successful');
        } catch {
          console.log('Hydrate: Refresh failed, clearing tokens');
          await clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            hydrated: true,
          });
          return;
        }
      }

      if (nextAccess) {
        try {
          const { data } = await userApi.profile();
          console.log('Hydrate Profile Response:', JSON.stringify(data, null, 2));

          const userData = (data as any).user ? (data as any).user : data;

          set({
            user: userData as AuthUser,
            isAuthenticated: true,
            accessToken: nextAccess,
            refreshToken: nextRefresh ?? null,
            hydrated: true,
          });
        } catch (profileError: any) {
          console.log(
            'Hydrate Profile Error:',
            profileError?.response?.status,
            profileError?.message
          );

          if (profileError?.response?.status === 401) {
            console.log('Hydrate: 401 on profile, clearing tokens');
            await clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              accessToken: null,
              refreshToken: null,
              hydrated: true,
            });
            return;
          }
          throw profileError;
        }
        return;
      }

      set({ hydrated: true });
    } catch (e) {
      console.log('Hydration failed:', e);
      await clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        hydrated: true,
      });
    }
  },

  login: async (user, accessToken, refreshToken) => {
    console.log('Auth Store - login called with user:', user);
    await setAccessToken(accessToken);
    await setRefreshToken(refreshToken);
    console.log('Auth Store - tokens saved');

    try {
      const { data } = await userApi.profile();
      console.log('Auth Store - profile fetched:', data);
      const userData = (data as any).user ? (data as any).user : data;
      set({
        user: userData as AuthUser,
        isAuthenticated: true,
        accessToken,
        refreshToken,
      });
      console.log('Auth Store - state set with profile data, isAuthenticated: true');
    } catch (err) {
      console.log('Auth Store - profile fetch failed, using login user data:', err);
      set({
        user,
        isAuthenticated: true,
        accessToken,
        refreshToken,
      });
      console.log('Auth Store - state set with login user data, isAuthenticated: true');
    }
  },

  logout: async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
    } finally {
      await clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        hydrated: true,
      });
    }
  },

  setUser: (user) => set({ user }),

  refreshUser: async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.log('refreshUser: No access token, skipping refresh');
      return;
    }

    try {
      const { data } = await userApi.profile();
      const userData = (data as any).user ? (data as any).user : data;
      set({ user: userData as AuthUser });
      console.log('User refreshed:', userData);
    } catch (err) {
      console.log('Failed to refresh user:', err);
    }
  },

  refreshTokens: async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await removeAccessToken();
      return null;
    }

    try {
      const { data } = await authApi.refresh(refreshToken);
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);

      set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data.accessToken;
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      return null;
    }
  },
}));
