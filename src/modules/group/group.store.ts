import { create } from 'zustand';
import { groupApi } from './group.api';
import type { Group, GroupDetail, GroupGoal, FeedItem, LeaderboardEntry } from './group.types';

type GroupState = {
  myGroups: Group[];
  currentGroup: GroupDetail | null;
  currentGoals: GroupGoal[];
  currentFeed: FeedItem[];
  currentLeaderboard: LeaderboardEntry[];
  isLoading: boolean;
  isLoadingDetail: boolean;

  fetchMyGroups: () => Promise<void>;
  fetchGroup: (id: string) => Promise<void>;
  fetchGoals: (id: string) => Promise<void>;
  fetchFeed: (id: string, refresh?: boolean) => Promise<void>;
  fetchLeaderboard: (id: string, period?: string) => Promise<void>;
  createGroup: (data: { name: string; description?: string; max_members?: number }) => Promise<Group>;
  joinByCode: (code: string) => Promise<Group>;
  leaveGroup: (id: string) => Promise<void>;
  clearCurrent: () => void;
};

export const useGroupStore = create<GroupState>((set, get) => ({
  myGroups: [],
  currentGroup: null,
  currentGoals: [],
  currentFeed: [],
  currentLeaderboard: [],
  isLoading: false,
  isLoadingDetail: false,

  fetchMyGroups: async () => {
    try {
      set({ isLoading: true });
      const { data } = await groupApi.myGroups();
      if (data.success) set({ myGroups: data.data });
    } catch (e) {
      console.error('fetchMyGroups:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGroup: async (id) => {
    try {
      set({ isLoadingDetail: true });
      const { data } = await groupApi.getById(id);
      if (data.success) set({ currentGroup: data.data });
    } catch (e) {
      console.error('fetchGroup:', e);
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  fetchGoals: async (id) => {
    try {
      const { data } = await groupApi.listGoals(id);
      if (data.success) set({ currentGoals: data.data });
    } catch (e) {
      console.error('fetchGoals:', e);
    }
  },

  fetchFeed: async (id, refresh = true) => {
    try {
      const offset = refresh ? 0 : get().currentFeed.length;
      const { data } = await groupApi.feed(id, 20, offset);
      if (data.success) {
        set({ currentFeed: refresh ? data.data : [...get().currentFeed, ...data.data] });
      }
    } catch (e) {
      console.error('fetchFeed:', e);
    }
  },

  fetchLeaderboard: async (id, period = 'all') => {
    try {
      const { data } = await groupApi.leaderboard(id, period);
      if (data.success) set({ currentLeaderboard: data.data });
    } catch (e) {
      console.error('fetchLeaderboard:', e);
    }
  },

  createGroup: async (input) => {
    const { data } = await groupApi.create(input);
    if (!data.success) throw new Error(data.message ?? 'Grup oluşturulamadı.');
    await get().fetchMyGroups();
    return data.data;
  },

  joinByCode: async (code) => {
    const { data } = await groupApi.joinByCode(code);
    if (!data.success) throw new Error(data.message ?? 'Gruba katılınamadı.');
    await get().fetchMyGroups();
    return data.data;
  },

  leaveGroup: async (id) => {
    const { data } = await groupApi.leave(id);
    if (!data.success) throw new Error(data.message ?? 'Gruptan ayrılınamadı.');
    await get().fetchMyGroups();
    set({ currentGroup: null });
  },

  clearCurrent: () => {
    set({ currentGroup: null, currentGoals: [], currentFeed: [], currentLeaderboard: [] });
  },
}));
