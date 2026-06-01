import { create } from 'zustand';
import { hifzApi, type HifzRow, type HifzStatus } from './hifz.api';

type HifzState = {
  rows: HifzRow[];
  loaded: boolean;
  load: () => Promise<void>;
  setStatus: (surahId: number, status: HifzStatus, pagesDone?: number) => Promise<void>;
  remove: (surahId: number) => Promise<void>;
  getStatusFor: (surahId: number) => HifzStatus | null;
};

export const useHifzStore = create<HifzState>((set, get) => ({
  rows: [],
  loaded: false,

  load: async () => {
    try {
      const res = await hifzApi.list();
      set({ rows: res.data?.data ?? [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setStatus: async (surahId, status, pagesDone = 0) => {
    // Optimistic
    const existing = get().rows.find((r) => r.surah_id === surahId);
    const optimistic: HifzRow = existing
      ? { ...existing, status, pages_done: pagesDone, updated_at: new Date().toISOString() }
      : {
          id: `temp-${surahId}`,
          surah_id: surahId,
          status,
          pages_done: pagesDone,
          updated_at: new Date().toISOString(),
        };
    set({
      rows: existing
        ? get().rows.map((r) => (r.surah_id === surahId ? optimistic : r))
        : [...get().rows, optimistic],
    });

    try {
      const res = await hifzApi.upsert({ surah_id: surahId, status, pages_done: pagesDone });
      const real = res.data?.data;
      if (real) {
        set({ rows: get().rows.map((r) => (r.surah_id === surahId ? real : r)) });
      }
    } catch (e: any) {
      console.error('[hifz] upsert failed:', e?.response?.status, e?.response?.data || e?.message);
      // revert
      if (existing) {
        set({ rows: get().rows.map((r) => (r.surah_id === surahId ? existing : r)) });
      } else {
        set({ rows: get().rows.filter((r) => r.surah_id !== surahId) });
      }
    }
  },

  remove: async (surahId) => {
    const before = get().rows;
    set({ rows: get().rows.filter((r) => r.surah_id !== surahId) });
    try {
      await hifzApi.remove(surahId);
    } catch {
      set({ rows: before });
    }
  },

  getStatusFor: (surahId) => {
    const row = get().rows.find((r) => r.surah_id === surahId);
    return row?.status ?? null;
  },
}));
