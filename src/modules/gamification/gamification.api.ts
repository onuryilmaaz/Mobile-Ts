import { api } from '@/services/api';

export const gamificationApi = {
  getStats: () => api.get('/gamification/stats'),
  getLeaderboard: () => api.get('/gamification/leaderboard'),
  trackPrayer: (
    prayerTime: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    isKaza: boolean = false
  ) => api.post('/prayer/track', { prayer_time: prayerTime, is_kaza: isKaza }),
};
