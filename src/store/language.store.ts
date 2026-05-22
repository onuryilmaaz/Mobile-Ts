import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

const LANGUAGE_STORAGE_KEY = '@salah_app_language';

interface LanguageStore {
  language: 'tr' | 'en';
  isHydrated: boolean;
  setLanguage: (lang: 'tr' | 'en') => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'en', // Yüklenmeden önceki varsayılan dil
  isHydrated: false,

  setLanguage: async (lang) => {
    set({ language: lang });
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'tr' || saved === 'en') {
        set({ language: saved });
        await i18n.changeLanguage(saved);
      } else {
        // Eğer kayıtlı dil yoksa i18n index.ts'de expo-localization'ın algıladığı aktif dili al
        const currentLang = i18n.language as 'tr' | 'en';
        set({ language: currentLang === 'tr' ? 'tr' : 'en' });
      }
    } catch {
      // Hata durumunda varsayılan en (İngilizce) kalır
    } finally {
      set({ isHydrated: true });
    }
  },
}));
