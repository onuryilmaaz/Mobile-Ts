import { api } from './api';
import { PrayerTimesResponse } from '@/types/prayer';

export const prayerService = {
  getPrayerTimes: async (city: string) => {
    const { data } = await api.get<PrayerTimesResponse>('/prayer/daily', {
      params: { city: city.toLowerCase() },
    });
    return data;
  },
};
