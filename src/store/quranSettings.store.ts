import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'QURAN_SETTINGS_V2';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type ReadingTheme = 'system' | 'sepia' | 'night';
export type LayoutMode = 'verses' | 'mushaf';

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  sm: 'Küçük',
  md: 'Orta',
  lg: 'Büyük',
  xl: 'En Büyük',
};

export const FONT_SIZE_SCALE: Record<FontSize, number> = {
  sm: 0.85,
  md: 1.0,
  lg: 1.18,
  xl: 1.38,
};

// Theme palettes for the reading surface
export type ReadingPalette = {
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textArabic: string;
  accent: string;
};

export const READING_PALETTES: Record<Exclude<ReadingTheme, 'system'>, ReadingPalette> = {
  sepia: {
    bg:            '#f8efdb', // krem
    surface:       '#fbf5e3',
    border:        '#e8dcb6',
    textPrimary:   '#3b2a17', // koyu kahve
    textSecondary: '#6b5634',
    textArabic:    '#2c1d0a',
    accent:        '#a06c2a',
  },
  night: {
    bg:            '#0b0d12', // pürüzsüz çok koyu mavi-siyah
    surface:       '#11141c',
    border:        '#1d2230',
    textPrimary:   '#e8d9b3', // amber-cream
    textSecondary: '#a6916b',
    textArabic:    '#f3e1b6',
    accent:        '#f59e0b',
  },
};

export const READING_THEME_LABELS: Record<ReadingTheme, string> = {
  system: 'Otomatik',
  sepia:  'Sepya',
  night:  'Gece',
};

type QuranSettingsStore = {
  fontSize: FontSize;
  readingTheme: ReadingTheme;
  layoutMode: LayoutMode;
  loaded: boolean;
  load: () => Promise<void>;
  setFontSize: (s: FontSize) => Promise<void>;
  setReadingTheme: (t: ReadingTheme) => Promise<void>;
  setLayoutMode: (m: LayoutMode) => Promise<void>;
};

async function persist(store: QuranSettingsStore) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      fontSize: store.fontSize,
      readingTheme: store.readingTheme,
      layoutMode: store.layoutMode,
    }),
  );
}

export const useQuranSettingsStore = create<QuranSettingsStore>((set, get) => ({
  fontSize: 'md',
  readingTheme: 'system',
  layoutMode: 'verses',
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          fontSize: parsed.fontSize in FONT_SIZE_SCALE ? parsed.fontSize : 'md',
          readingTheme:
            parsed.readingTheme === 'sepia' || parsed.readingTheme === 'night'
              ? parsed.readingTheme
              : 'system',
          layoutMode: parsed.layoutMode === 'mushaf' ? 'mushaf' : 'verses',
          loaded: true,
        });
        return;
      }
    } catch {}
    set({ loaded: true });
  },

  setFontSize: async (s) => {
    set({ fontSize: s });
    await persist(get());
  },

  setReadingTheme: async (t) => {
    set({ readingTheme: t });
    await persist(get());
  },

  setLayoutMode: async (m) => {
    set({ layoutMode: m });
    await persist(get());
  },
}));
