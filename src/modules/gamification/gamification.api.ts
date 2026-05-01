import { api } from '@/services/api';

export const gamificationApi = {
  getStats: () => api.get('/gamification/stats'),
  getLeaderboard: (limit = 10) => api.get(`/gamification/leaderboard?limit=${limit}`),
  getLevel: () => api.get('/gamification/level'),
  getWeeklyStats: () => api.get('/gamification/stats/weekly'),
  getMonthlyStats: () => api.get('/gamification/stats/monthly'),

  trackPrayer: (
    prayerTime: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    isKaza: boolean = false
  ) => api.post('/prayer/track', { prayer_time: prayerTime, is_kaza: isKaza }),

  untrackPrayer: (prayerTime: string) =>
    api.delete('/prayer/track', { data: { prayer_time: prayerTime } }),

  getPrayerHistory: (days = 7) => api.get(`/prayer/history?days=${days}`),

  getKazaList: () => api.get('/prayer/kaza'),
  addKaza: (prayerTime: string, missedDate: string) =>
    api.post('/prayer/kaza', { prayer_time: prayerTime, missed_date: missedDate }),
  batchAddKaza: (prayers: string[], count: number) =>
    api.post('/prayer/kaza/batch', { prayers, count }),
  quickCompleteKaza: (prayerTime: string) =>
    api.post('/prayer/kaza/quick-complete', { prayer_time: prayerTime }),
  completeKaza: (id: string) => api.patch(`/prayer/kaza/${id}/complete`),
  deleteKaza: (id: string) => api.delete(`/prayer/kaza/${id}`),
};
