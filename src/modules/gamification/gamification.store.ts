import { create } from 'zustand';
import { gamificationApi } from './gamification.api';

type KazaItem = {
  id: string;
  prayer_time: string;
  missed_date: string;
  created_at: string;
};

type GamificationState = {
  stats: any | null;
  badges: any[];
  allBadges: Record<string, any>;
  levels: any[];
  leaderboard: any[];
  weeklyStats: any | null;
  monthlyStats: any | null;
  kazaList: KazaItem[];
  kazaCompleted: number;
  isLoading: boolean;

  fetchStats: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchWeeklyStats: () => Promise<void>;
  fetchMonthlyStats: () => Promise<void>;
  fetchKazaList: () => Promise<void>;

  trackPrayer: (
    prayerTime: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    isKaza?: boolean
  ) => Promise<any>;

  untrackPrayer: (prayerTime: string) => Promise<void>;
  addKaza: (prayerTime: string, missedDate: string) => Promise<void>;
  completeKaza: (id: string) => Promise<number>;
  deleteKaza: (id: string) => Promise<void>;
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  stats: null,
  badges: [],
  allBadges: {},
  levels: [],
  leaderboard: [],
  weeklyStats: null,
  monthlyStats: null,
  kazaList: [],
  kazaCompleted: 0,
  isLoading: false,

  fetchStats: async () => {
    try {
      set({ isLoading: true });
      const { data } = await gamificationApi.getStats();
      if (data.success) {
        set({
          stats: data.data.stats,
          badges: data.data.badges,
          allBadges: data.data.allBadges,
          levels: data.data.levels || [],
        });
      }
    } catch (e) {
      console.error('Failed to fetch gamification stats', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLeaderboard: async () => {
    try {
      set({ isLoading: true });
      const { data } = await gamificationApi.getLeaderboard();
      if (data.success) {
        set({ leaderboard: data.data });
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWeeklyStats: async () => {
    try {
      const { data } = await gamificationApi.getWeeklyStats();
      if (data.success) set({ weeklyStats: data.data });
    } catch (e) {
      console.error('Failed to fetch weekly stats', e);
    }
  },

  fetchMonthlyStats: async () => {
    try {
      const { data } = await gamificationApi.getMonthlyStats();
      if (data.success) set({ monthlyStats: data.data });
    } catch (e) {
      console.error('Failed to fetch monthly stats', e);
    }
  },

  fetchKazaList: async () => {
    try {
      const { data } = await gamificationApi.getKazaList();
      if (data.success) {
        set({
          kazaList: data.data.pending,
          kazaCompleted: data.data.total_completed,
        });
      }
    } catch (e) {
      console.error('Failed to fetch kaza list', e);
    }
  },

  trackPrayer: async (prayerTime, isKaza = false) => {
    try {
      set({ isLoading: true });
      const { data } = await gamificationApi.trackPrayer(prayerTime, isKaza);
      if (data.success) {
        set({ stats: data.data.stats });
        await get().fetchStats();
        return data.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to track prayer', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  untrackPrayer: async (prayerTime) => {
    try {
      await gamificationApi.untrackPrayer(prayerTime);
      await get().fetchStats();
    } catch (e) {
      console.error('Failed to untrack prayer', e);
      throw e;
    }
  },

  addKaza: async (prayerTime, missedDate) => {
    try {
      await gamificationApi.addKaza(prayerTime, missedDate);
      await get().fetchKazaList();
    } catch (e) {
      console.error('Failed to add kaza', e);
      throw e;
    }
  },

  completeKaza: async (id) => {
    try {
      const { data } = await gamificationApi.completeKaza(id);
      await get().fetchKazaList();
      await get().fetchStats();
      return data.pointsEarned || 0;
    } catch (e) {
      console.error('Failed to complete kaza', e);
      throw e;
    }
  },

  deleteKaza: async (id) => {
    try {
      await gamificationApi.deleteKaza(id);
      set(s => ({ kazaList: s.kazaList.filter(k => k.id !== id) }));
    } catch (e) {
      console.error('Failed to delete kaza', e);
      throw e;
    }
  },
}));
