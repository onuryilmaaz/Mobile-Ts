import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { familyApi, clearChildToken, setChildToken } from './family.api';
import type {
  ChildProfile, ChildTask, TaskCompletion, ChildStats,
  ChildReward, TaskTemplate, ChildSession,
} from './family.types';

const CHILD_SESSION_KEY = 'child_session_data';

interface FamilyState {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  tasks: ChildTask[];
  todayTasks: ChildTask[];
  completions: TaskCompletion[];
  pendingApprovals: TaskCompletion[];
  childStats: ChildStats | null;
  rewards: ChildReward[];
  templates: TaskTemplate[];
  childSession: ChildSession | null;
  isLoading: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;

  // Parent actions
  fetchChildren: () => Promise<void>;
  createChild: (data: Record<string, unknown>) => Promise<ChildProfile | null>;
  updateChild: (childId: string, data: Record<string, unknown>) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  selectChild: (child: ChildProfile) => void;

  fetchTasks: (childId: string) => Promise<void>;
  createTask: (childId: string, data: Record<string, unknown>) => Promise<void>;
  updateTask: (childId: string, taskId: string, data: Record<string, unknown>) => Promise<void>;
  deleteTask: (childId: string, taskId: string) => Promise<void>;

  fetchPendingApprovals: () => Promise<void>;
  fetchCompletions: (childId: string) => Promise<void>;
  reviewCompletion: (completionId: string, approved: boolean, note?: string) => Promise<void>;

  fetchChildStats: (childId: string) => Promise<void>;
  fetchRewards: (childId: string) => Promise<void>;
  createReward: (childId: string, title: string, costStars: number) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;

  // Child session actions
  openChildMode: (childId: string, pinCode: string) => Promise<void>;
  exitChildMode: () => Promise<void>;
  fetchTodayTasks: () => Promise<void>;
  completeTask: (taskId: string, evidenceUrl?: string) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  children: [],
  selectedChild: null,
  tasks: [],
  todayTasks: [],
  completions: [],
  pendingApprovals: [],
  childStats: null,
  rewards: [],
  templates: [],
  childSession: null,
  isLoading: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(CHILD_SESSION_KEY);
      if (raw) {
        const session: ChildSession = JSON.parse(raw);
        set({ childSession: session });
      }
    } catch {}
    set({ hydrated: true });
  },

  fetchChildren: async () => {
    try {
      set({ isLoading: true });
      const { data } = await familyApi.getChildren();
      if (data.success) set({ children: data.data });
    } catch (e) {
      console.error('fetchChildren error', e);
    } finally {
      set({ isLoading: false });
    }
  },

  createChild: async (payload) => {
    try {
      const { data } = await familyApi.createChild(payload);
      if (data.success) {
        set((s) => ({ children: [...s.children, data.data] }));
        return data.data;
      }
    } catch (e) {
      console.error('createChild error', e);
    }
    return null;
  },

  updateChild: async (childId, payload) => {
    try {
      const { data } = await familyApi.updateChild(childId, payload);
      if (data.success) {
        set((s) => ({
          children: s.children.map((c) => (c.id === childId ? { ...c, ...data.data } : c)),
          selectedChild: s.selectedChild?.id === childId ? { ...s.selectedChild, ...data.data } : s.selectedChild,
        }));
      }
    } catch (e) {
      console.error('updateChild error', e);
    }
  },

  deleteChild: async (childId) => {
    try {
      await familyApi.deleteChild(childId);
      set((s) => ({
        children: s.children.filter((c) => c.id !== childId),
        selectedChild: s.selectedChild?.id === childId ? null : s.selectedChild,
      }));
    } catch (e) {
      console.error('deleteChild error', e);
    }
  },

  selectChild: (child) => set({ selectedChild: child }),

  fetchTasks: async (childId) => {
    try {
      const { data } = await familyApi.getTasks(childId);
      if (data.success) set({ tasks: data.data });
    } catch (e) {
      console.error('fetchTasks error', e);
    }
  },

  createTask: async (childId, payload) => {
    try {
      const { data } = await familyApi.createTask(childId, payload);
      if (data.success) set((s) => ({ tasks: [...s.tasks, data.data] }));
    } catch (e) {
      console.error('createTask error', e);
    }
  },

  updateTask: async (childId, taskId, payload) => {
    try {
      const { data } = await familyApi.updateTask(childId, taskId, payload);
      if (data.success) {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? data.data : t)) }));
      }
    } catch (e) {
      console.error('updateTask error', e);
    }
  },

  deleteTask: async (childId, taskId) => {
    try {
      await familyApi.deleteTask(childId, taskId);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
    } catch (e) {
      console.error('deleteTask error', e);
    }
  },

  fetchPendingApprovals: async () => {
    try {
      const { data } = await familyApi.getPendingApprovals();
      if (data.success) set({ pendingApprovals: data.data });
    } catch (e) {
      console.error('fetchPendingApprovals error', e);
    }
  },

  fetchCompletions: async (childId) => {
    try {
      const { data } = await familyApi.getCompletions(childId);
      if (data.success) set({ completions: data.data });
    } catch (e) {
      console.error('fetchCompletions error', e);
    }
  },

  reviewCompletion: async (completionId, approved, note) => {
    try {
      await familyApi.reviewCompletion(completionId, approved, note);
      set((s) => ({
        pendingApprovals: s.pendingApprovals.filter((c) => c.id !== completionId),
      }));
    } catch (e) {
      console.error('reviewCompletion error', e);
    }
  },

  fetchChildStats: async (childId) => {
    try {
      const { data } = await familyApi.getChildStats(childId);
      if (data.success) set({ childStats: data.data });
    } catch (e) {
      console.error('fetchChildStats error', e);
    }
  },

  fetchRewards: async (childId) => {
    try {
      const { data } = await familyApi.getRewards(childId);
      if (data.success) set({ rewards: data.data });
    } catch (e) {
      console.error('fetchRewards error', e);
    }
  },

  createReward: async (childId, title, costStars) => {
    try {
      const { data } = await familyApi.createReward(childId, title, costStars);
      if (data.success) set((s) => ({ rewards: [data.data, ...s.rewards] }));
    } catch (e) {
      console.error('createReward error', e);
    }
  },

  deleteReward: async (rewardId) => {
    try {
      await familyApi.deleteReward(rewardId);
      set((s) => ({ rewards: s.rewards.filter((r) => r.id !== rewardId) }));
    } catch (e) {
      console.error('deleteReward error', e);
    }
  },

  fetchTemplates: async () => {
    try {
      const { data } = await familyApi.getTaskTemplates();
      if (data.success) set({ templates: data.data });
    } catch (e) {
      console.error('fetchTemplates error', e);
    }
  },

  openChildMode: async (childId, pinCode) => {
    const { data } = await familyApi.createChildSession(childId, pinCode);
    if (!data.success) throw new Error('PIN hatalı');

    const children = get().children;
    const child = children.find((c) => c.id === childId) ?? get().selectedChild;

    const session: ChildSession = {
      token: data.token,
      childId,
      parentId: '',
      childName: child?.name ?? '',
      avatarEmoji: child?.avatar_emoji ?? '🌙',
    };

    await setChildToken(data.token);
    await AsyncStorage.setItem(CHILD_SESSION_KEY, JSON.stringify(session));
    set({ childSession: session });
  },

  exitChildMode: async () => {
    await clearChildToken();
    await AsyncStorage.removeItem(CHILD_SESSION_KEY);
    set({ childSession: null, todayTasks: [] });
  },

  fetchTodayTasks: async () => {
    try {
      set({ isLoading: true });
      const { data } = await familyApi.getTodayTasks();
      if (data.success) set({ todayTasks: data.data });
    } catch (e) {
      console.error('fetchTodayTasks error', e);
    } finally {
      set({ isLoading: false });
    }
  },

  completeTask: async (taskId, evidenceUrl) => {
    try {
      const { data } = await familyApi.completeTask(taskId, evidenceUrl);
      if (data.success) {
        set((s) => ({
          todayTasks: s.todayTasks.map((t) =>
            t.id === taskId
              ? { ...t, completion_id: data.data.id, status: data.data.status, stars_earned: data.data.stars_earned, completed_at: data.data.completed_at }
              : t,
          ),
        }));
      }
    } catch (e) {
      console.error('completeTask error', e);
      throw e;
    }
  },

  redeemReward: async (rewardId) => {
    try {
      await familyApi.redeemReward(rewardId);
      set((s) => ({
        rewards: s.rewards.map((r) =>
          r.id === rewardId ? { ...r, is_redeemed: true } : r,
        ),
      }));
    } catch (e) {
      console.error('redeemReward error', e);
      throw e;
    }
  },
}));
