import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const ONBOARDING_KEY = '@salah_onboarding_done';

interface OnboardingState {
  done: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  complete: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  done: false,
  hydrated: false,

  // hydrate: async () => {
  //   const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  //   set({ done: value === 'true', hydrated: true });
  // },

  hydrate: async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY); // ← test için ekle
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({ done: value === 'true', hydrated: true });
  },

  complete: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ done: true });
  },
}));
