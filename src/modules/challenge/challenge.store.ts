import { create } from 'zustand';
import { challengeApi } from './challenge.api';

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: string;
  goal_type: string;
  goal_value: number;
  bonus_points: number;
  ends_at: string;
  user_challenge_id: string | null;
  progress: number | null;
  is_completed: boolean | null;
  joined_at: string | null;
};

type ChallengeState = {
  active: Challenge[];
  history: any[];
  isLoading: boolean;
  fetchActive: () => Promise<void>;
  joinChallenge: (id: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
};

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  active: [],
  history: [],
  isLoading: false,

  fetchActive: async () => {
    try {
      set({ isLoading: true });
      const { data } = await challengeApi.getActive();
      if (data.success) set({ active: data.data });
    } catch (e) {
      console.error('Failed to fetch challenges', e);
    } finally {
      set({ isLoading: false });
    }
  },

  joinChallenge: async (id) => {
    try {
      await challengeApi.join(id);
      await get().fetchActive();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Katılım başarısız.';
      throw new Error(msg);
    }
  },

  fetchHistory: async () => {
    try {
      const { data } = await challengeApi.getHistory();
      if (data.success) set({ history: data.data });
    } catch (e) {
      console.error('Failed to fetch challenge history', e);
    }
  },
}));
