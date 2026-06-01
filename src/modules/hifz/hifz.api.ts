import { api } from '@/services/api';

export type HifzStatus = 'in_progress' | 'memorized' | 'reviewing';

export type HifzRow = {
  id: string;
  surah_id: number;
  status: HifzStatus;
  pages_done: number;
  updated_at: string;
};

export const hifzApi = {
  list: () => api.get<{ success: boolean; data: HifzRow[] }>('/hifz'),
  upsert: (payload: { surah_id: number; status: HifzStatus; pages_done?: number }) =>
    api.put<{ success: boolean; data: HifzRow }>('/hifz', payload),
  remove: (surahId: number) => api.delete(`/hifz/${surahId}`),
};
