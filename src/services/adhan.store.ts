import { create } from 'zustand';
import type { AdhanPrayerKey } from './adhan.service';

type AdhanStore = {
  activePrayer: { key: AdhanPrayerKey; name: string } | null;
  show: (key: AdhanPrayerKey, name: string) => void;
  hide: () => void;
};

export const useAdhanStore = create<AdhanStore>((set) => ({
  activePrayer: null,
  show: (key, name) => set({ activePrayer: { key, name } }),
  hide: () => set({ activePrayer: null }),
}));
