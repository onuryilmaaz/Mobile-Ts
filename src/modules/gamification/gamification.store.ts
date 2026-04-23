import { create } from 'zustand';
import { gamificationApi } from './gamification.api';

type GamificationState = {
  stats: any | null;
  badges: any[];
  allBadges: Record<string, any>;
  leaderboard: any[];
  isLoading: boolean;
  fetchStats: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  trackPrayer: (
    prayerTime: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    isKaza?: boolean
  ) => Promise<any>;
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  stats: null,
  badges: [],
  allBadges: {},
  leaderboard: [],
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
}));
