import { create } from 'zustand';
import { ozelGunApi } from './ozel_gun.api';

type OzelGunState = {
  isActive: boolean;
  isLoading: boolean;
  fetch: () => Promise<void>;
  start: () => Promise<void>;
  end: () => Promise<void>;
};

export const useOzelGunStore = create<OzelGunState>((set) => ({
  isActive: false,
  isLoading: false,

  fetch: async () => {
    try {
      const { data } = await ozelGunApi.getActive();
      if (data.success) set({ isActive: data.data.todayIsOzelGun });
    } catch {}
  },

  start: async () => {
    set({ isLoading: true });
    try {
      await ozelGunApi.start();
      set({ isActive: true });
    } finally {
      set({ isLoading: false });
    }
  },

  end: async () => {
    set({ isLoading: true });
    try {
      await ozelGunApi.end();
      set({ isActive: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
