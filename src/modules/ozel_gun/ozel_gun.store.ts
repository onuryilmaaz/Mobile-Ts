import { create } from 'zustand';
import { ozelGunApi } from './ozel_gun.api';

export type Gender = 'erkek' | 'kadin' | null;

export type Period = {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
};

type OzelGunState = {
  gender: Gender;
  isActive: boolean;
  period: Period | null;
  isLoading: boolean;
  loaded: boolean;
  fetch: () => Promise<void>;
  start: () => Promise<void>;
  end: () => Promise<void>;
};

export const useOzelGunStore = create<OzelGunState>((set, get) => ({
  gender: null,
  isActive: false,
  period: null,
  isLoading: false,
  loaded: false,

  fetch: async () => {
    try {
      const { data } = await ozelGunApi.getActive();
      if (data.success) {
        set({
          gender: data.data.gender ?? null,
          isActive: !!data.data.todayIsOzelGun,
          period: data.data.period ?? null,
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  start: async () => {
    if (get().gender !== 'kadin') return;
    set({ isLoading: true });
    try {
      const { data } = await ozelGunApi.start();
      set({ isActive: true, period: data.data });
    } finally {
      set({ isLoading: false });
    }
  },

  end: async () => {
    set({ isLoading: true });
    try {
      await ozelGunApi.end();
      set({ isActive: false, period: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
