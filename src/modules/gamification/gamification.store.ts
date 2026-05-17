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
  completedLast30Days: number;
  kazaCounters: Record<string, number>;
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
  batchAddKaza: (prayers: string[], count: number) => Promise<void>;
  quickCompleteKaza: (prayerTime: string) => Promise<number>;
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
  completedLast30Days: 0,
  kazaCounters: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
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
          completedLast30Days: data.data.completed_last_30_days || 0,
          kazaCounters: data.data.counters || { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
        });
      }
    } catch (e) {
      console.error('Failed to fetch kaza list', e);
    }
  },

  trackPrayer: async (prayerTime, isKaza = false) => {
    const prevStats = get().stats;

    // Optimistic update: immediately mark as tracked to prevent duplicate taps
    set((state) => ({
      isLoading: true,
      stats: state.stats
        ? {
            ...state.stats,
            today_prayers: [...(state.stats.today_prayers ?? []), prayerTime],
            ...(isKaza
              ? { kaza_prayers: [...(state.stats.kaza_prayers ?? []), prayerTime] }
              : {}),
          }
        : state.stats,
    }));

    try {
      const { data } = await gamificationApi.trackPrayer(prayerTime, isKaza);
      if (data.success) {
        set({ stats: data.data.stats });
        await Promise.all([get().fetchStats(), get().fetchWeeklyStats()]);
        return data.data;
      }
      return null;
    } catch (e) {
      // Revert optimistic update on failure
      set({ stats: prevStats });
      console.error('Failed to track prayer', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  untrackPrayer: async (prayerTime) => {
    try {
      await gamificationApi.untrackPrayer(prayerTime);
      await Promise.all([get().fetchStats(), get().fetchWeeklyStats()]);
    } catch (e) {
      console.error('Failed to untrack prayer', e);
      throw e;
    }
  },

  addKaza: async (prayerTime, missedDate) => {
    try {
      await gamificationApi.addKaza(prayerTime, missedDate);
      await Promise.all([get().fetchKazaList(), get().fetchStats()]);
    } catch (e) {
      console.error('Failed to add kaza', e);
      throw e;
    }
  },

  batchAddKaza: async (prayers, count) => {
    try {
      set({ isLoading: true });
      await gamificationApi.batchAddKaza(prayers, count);
      await Promise.all([get().fetchKazaList(), get().fetchStats()]);
    } catch (e) {
      console.error('Failed to batch add kaza', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  quickCompleteKaza: async (prayerTime) => {
    const previousKazaList = get().kazaList;
    const previousCompleted = get().kazaCompleted;
    const previousCounters = get().kazaCounters;

    // Optimistic Update
    set((state) => ({
      kazaCompleted: state.kazaCompleted + 1,
      kazaCounters: {
        ...state.kazaCounters,
        [prayerTime]: Math.max(0, state.kazaCounters[prayerTime] - 1),
      },
      // Listeyi de güncellemek için en eski olanı bulup çıkarıyoruz
      kazaList: state.kazaList
        .filter((_k, i, self) => {
          const firstMatchIndex = self.findIndex((x) => x.prayer_time === prayerTime);
          return i !== firstMatchIndex;
        })
        .filter((k) => k.id !== 'temp'), // (Varsa temp'leri temizle)
    }));

    try {
      const { data } = await gamificationApi.quickCompleteKaza(prayerTime);
      get().fetchStats();
      get().fetchKazaList(); // Sync exact list in background
      return data.pointsEarned || 0;
    } catch (e) {
      set({
        kazaList: previousKazaList,
        kazaCompleted: previousCompleted,
        kazaCounters: previousCounters,
      });
      console.error('Failed to quick complete kaza', e);
      throw e;
    }
  },

  completeKaza: async (id) => {
    const previousKazaList = get().kazaList;
    const previousCompleted = get().kazaCompleted;
    const previousCounters = get().kazaCounters;

    const item = previousKazaList.find((k) => k.id === id);

    // Optimistic Update
    set((state) => ({
      kazaList: state.kazaList.filter((k) => k.id !== id),
      kazaCompleted: state.kazaCompleted + 1,
      kazaCounters: item
        ? {
            ...state.kazaCounters,
            [item.prayer_time]: Math.max(0, state.kazaCounters[item.prayer_time] - 1),
          }
        : state.kazaCounters,
    }));

    try {
      const { data } = await gamificationApi.completeKaza(id);
      get().fetchStats();
      return data.pointsEarned || 0;
    } catch (e) {
      set({
        kazaList: previousKazaList,
        kazaCompleted: previousCompleted,
        kazaCounters: previousCounters,
      });
      console.error('Failed to complete kaza', e);
      throw e;
    }
  },

  deleteKaza: async (id) => {
    const previousKazaList = get().kazaList;
    const previousCounters = get().kazaCounters;

    const item = previousKazaList.find((k) => k.id === id);

    // Optimistic Update
    set((state) => ({
      kazaList: state.kazaList.filter((k) => k.id !== id),
      kazaCounters: item
        ? {
            ...state.kazaCounters,
            [item.prayer_time]: Math.max(0, state.kazaCounters[item.prayer_time] - 1),
          }
        : state.kazaCounters,
    }));

    try {
      await gamificationApi.deleteKaza(id);
    } catch (e) {
      set({ kazaList: previousKazaList, kazaCounters: previousCounters });
      console.error('Failed to delete kaza', e);
      throw e;
    }
  },
}));
