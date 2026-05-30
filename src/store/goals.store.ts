import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { goalsApi } from '@/modules/goals/goals.api';

const CACHE_KEY = 'PERSONAL_GOALS_V2';

export type GoalActivity = 'quran' | 'dhikr' | 'nafile' | 'fasting' | 'dua' | 'memorization';

export type Goal = {
  activity: GoalActivity;
  label: string;
  unit: string;
  icon: string;
  sfSymbol: string;
  colorHex: string;
  target: number;
  enabled: boolean;
};

export const GOAL_META: Record<GoalActivity, Pick<Goal, 'label' | 'unit' | 'icon' | 'sfSymbol' | 'colorHex'>> = {
  quran:        { label: 'Kuran',       unit: 'sayfa',  icon: 'book-outline',       sfSymbol: 'book.fill',          colorHex: '#14b8a6' },
  dhikr:        { label: 'Zikir',       unit: 'adet',   icon: 'apps-outline',       sfSymbol: 'sparkles',           colorHex: '#f59e0b' },
  nafile:       { label: 'Nafile',      unit: 'rekat',  icon: 'star-outline',       sfSymbol: 'star.fill',          colorHex: '#818cf8' },
  fasting:      { label: 'Oruç',        unit: 'gün',    icon: 'sunny-outline',      sfSymbol: 'sun.max.fill',       colorHex: '#fb923c' },
  dua:          { label: 'Dua',         unit: 'dakika', icon: 'hand-left-outline',  sfSymbol: 'hands.and.sparkles', colorHex: '#ec4899' },
  memorization: { label: 'Hıfz',        unit: 'ayet',   icon: 'library-outline',    sfSymbol: 'text.book.closed',   colorHex: '#a78bfa' },
};

const DEFAULT_GOALS: Goal[] = [
  { activity: 'quran',        ...GOAL_META.quran,        target: 10,  enabled: true  },
  { activity: 'dhikr',        ...GOAL_META.dhikr,        target: 500, enabled: true  },
  { activity: 'nafile',       ...GOAL_META.nafile,       target: 12,  enabled: false },
  { activity: 'fasting',      ...GOAL_META.fasting,      target: 1,   enabled: false },
  { activity: 'dua',          ...GOAL_META.dua,          target: 15,  enabled: false },
  { activity: 'memorization', ...GOAL_META.memorization, target: 5,   enabled: false },
];

type GoalsStore = {
  goals: Goal[];
  loaded: boolean;
  syncing: boolean;
  load: (isAuthenticated: boolean) => Promise<void>;
  updateGoal: (activity: GoalActivity, patch: Partial<Pick<Goal, 'target' | 'enabled'>>, isAuthenticated: boolean) => Promise<void>;
};

function mergeWithServer(serverRows: any[]): Goal[] {
  return DEFAULT_GOALS.map((def) => {
    const row = serverRows.find((r: any) => r.activity_type === def.activity);
    if (!row) return def;
    return { ...def, target: row.target, enabled: row.enabled };
  });
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: DEFAULT_GOALS,
  loaded: false,
  syncing: false,

  load: async (isAuthenticated) => {
    if (get().loaded) return;

    // 1. Load cache immediately (fast)
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: Partial<Goal>[] = JSON.parse(raw);
        const merged = DEFAULT_GOALS.map((def) => {
          const c = cached.find((x) => x.activity === def.activity);
          return c ? { ...def, ...c } : def;
        });
        set({ goals: merged });
      }
    } catch {}

    set({ loaded: true });

    // 2. Sync from server in background (no await at call site)
    if (isAuthenticated) {
      try {
        set({ syncing: true });
        const res = await goalsApi.getGoals();
        const serverGoals: any[] = res.data?.data ?? [];
        if (serverGoals.length > 0) {
          const merged = mergeWithServer(serverGoals);
          set({ goals: merged });
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        }
      } catch {} finally {
        set({ syncing: false });
      }
    }
  },

  updateGoal: async (activity, patch, isAuthenticated) => {
    // Optimistic update
    const current = get().goals.find((g) => g.activity === activity);
    if (!current) return;
    const updated = { ...current, ...patch };
    const next = get().goals.map((g) => (g.activity === activity ? updated : g));
    set({ goals: next });
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));

    // Sync to server
    if (isAuthenticated) {
      try {
        await goalsApi.upsertGoal({
          activity_type: activity,
          target: updated.target,
          enabled: updated.enabled,
        });
      } catch {}
    }
  },
}));
