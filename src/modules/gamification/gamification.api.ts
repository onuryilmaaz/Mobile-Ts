import { api } from '@/services/api';

export const gamificationApi = {
  getStats: () => api.get('/gamification/stats'),
  getLeaderboard: () => api.get('/gamification/leaderboard'),
  trackPrayer: (prayerTime: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') =>
    api.post('/prayer/track', { prayer_time: prayerTime }),
};
