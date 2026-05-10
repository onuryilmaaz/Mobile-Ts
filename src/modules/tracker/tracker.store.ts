import { create } from 'zustand';
import { trackerApi } from './tracker.api';
import type { ActivityType, TrackerLog, WeeklyStats, MonthlyStats } from './tracker.types';

interface TrackerState {
  todayLogs: TrackerLog[];
  weeklyStats: WeeklyStats | null;
  monthlyStats: MonthlyStats | null;
  isLoading: boolean;

  fetchTodayLogs: () => Promise<void>;
  fetchWeeklyStats: () => Promise<void>;
  fetchMonthlyStats: (year?: number, month?: number) => Promise<void>;

  logActivity: (
    activityType: ActivityType,
    value: Record<string, any>,
    notes?: string
  ) => Promise<TrackerLog | null>;

  updateLog: (id: string, value: Record<string, any>, notes?: string) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  todayLogs: [],
  weeklyStats: null,
  monthlyStats: null,
  isLoading: false,

  fetchTodayLogs: async () => {
    try {
      set({ isLoading: true });
      const { data } = await trackerApi.getTodayLogs();
      if (data.success) set({ todayLogs: data.data });
    } catch (e) {
      console.error('fetchTodayLogs error', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWeeklyStats: async () => {
    try {
      const { data } = await trackerApi.getWeeklyStats();
      if (data.success) set({ weeklyStats: data.data });
    } catch (e) {
      console.error('fetchWeeklyStats error', e);
    }
  },

  fetchMonthlyStats: async (year, month) => {
    try {
      const { data } = await trackerApi.getMonthlyStats(year, month);
      if (data.success) set({ monthlyStats: data.data });
    } catch (e) {
      console.error('fetchMonthlyStats error', e);
    }
  },

  logActivity: async (activityType, value, notes) => {
    try {
      const { data } = await trackerApi.logActivity({ activity_type: activityType, value, notes });
      if (data.success) {
        const newLog: TrackerLog = data.data;
        set((s) => ({ todayLogs: [...s.todayLogs, newLog] }));
        // Refresh stats in background
        get().fetchWeeklyStats();
        return newLog;
      }
      return null;
    } catch (e) {
      console.error('logActivity error', e);
      throw e;
    }
  },

  updateLog: async (id, value, notes) => {
    try {
      const { data } = await trackerApi.updateLog(id, value, notes);
      if (data.success) {
        set((s) => ({
          todayLogs: s.todayLogs.map((l) => (l.id === id ? data.data : l)),
        }));
        get().fetchWeeklyStats();
      }
    } catch (e) {
      console.error('updateLog error', e);
      throw e;
    }
  },

  deleteLog: async (id) => {
    try {
      await trackerApi.deleteLog(id);
      set((s) => ({ todayLogs: s.todayLogs.filter((l) => l.id !== id) }));
      get().fetchWeeklyStats();
    } catch (e) {
      console.error('deleteLog error', e);
      throw e;
    }
  },
}));
