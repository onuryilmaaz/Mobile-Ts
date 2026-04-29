import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@salah_theme_mode';

interface ThemeStore {
  isDark: boolean;
  headerColor: string;
  isHydrated: boolean;
  setHeaderColor: (color: string) => void;
  toggleTheme: () => Promise<void>;
  setDark: (value: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,
  headerColor: '#0f766e',
  isHydrated: false,

  setHeaderColor: (color) => set({ headerColor: color }),

  toggleTheme: async () => {
    const next = !get().isDark;
    set({ isDark: next });
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
  },

  setDark: async (value) => {
    set({ isDark: value });
    await AsyncStorage.setItem(THEME_STORAGE_KEY, value ? 'dark' : 'light');
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) {
        set({ isDark: saved === 'dark' });
      }
    } catch {}
    set({ isHydrated: true });
  },
}));
