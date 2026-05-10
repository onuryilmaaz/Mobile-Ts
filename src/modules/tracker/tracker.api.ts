import { api } from '@/services/api';
import type { ActivityType } from './tracker.types';

export const trackerApi = {
  getTodayLogs: () => api.get('/tracker/today'),

  getDateLogs: (date: string) => api.get(`/tracker/date/${date}`),

  logActivity: (payload: {
    activity_type: ActivityType;
    value: Record<string, any>;
    notes?: string;
    date?: string;
  }) => api.post('/tracker', payload),

  updateLog: (id: string, value: Record<string, any>, notes?: string) =>
    api.patch(`/tracker/${id}`, { value, notes }),

  deleteLog: (id: string) => api.delete(`/tracker/${id}`),

  getWeeklyStats: () => api.get('/tracker/stats/weekly'),

  getMonthlyStats: (year?: number, month?: number) =>
    api.get('/tracker/stats/monthly', { params: { year, month } }),
};
