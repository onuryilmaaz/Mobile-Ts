import { create } from 'zustand';

interface ThemeStore {
  headerColor: string;
  setHeaderColor: (color: string) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  headerColor: 'bg-teal-600', // Default color
  setHeaderColor: (color) => set({ headerColor: color }),
}));
