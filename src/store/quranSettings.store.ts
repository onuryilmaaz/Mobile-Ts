import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'QURAN_SETTINGS_V1';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  sm: 'Küçük',
  md: 'Orta',
  lg: 'Büyük',
  xl: 'En Büyük',
};

// Multiplier for base sizes
export const FONT_SIZE_SCALE: Record<FontSize, number> = {
  sm: 0.85,
  md: 1.0,
  lg: 1.18,
  xl: 1.38,
};

type QuranSettingsStore = {
  fontSize: FontSize;
  loaded: boolean;
  load: () => Promise<void>;
  setFontSize: (s: FontSize) => Promise<void>;
};

export const useQuranSettingsStore = create<QuranSettingsStore>((set, get) => ({
  fontSize: 'md',
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.fontSize && parsed.fontSize in FONT_SIZE_SCALE) {
          set({ fontSize: parsed.fontSize, loaded: true });
          return;
        }
      }
    } catch {}
    set({ loaded: true });
  },

  setFontSize: async (s) => {
    set({ fontSize: s });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize: s }));
  },
}));
