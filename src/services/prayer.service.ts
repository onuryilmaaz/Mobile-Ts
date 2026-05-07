/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import { PrayerTimesResponse, PrayerTimeData } from '@/types/prayer';

const PRAYER_API_BASE_URL = 'https://ezanvakti.imsakiyem.com/api';

const prayerApiClient = axios.create({
  baseURL: PRAYER_API_BASE_URL,
  timeout: 15000,
});

export type PrayerPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const prayerService = {
  getPrayerTimes: async (districtId: string, period: PrayerPeriod = 'weekly') => {
    const { data } = await prayerApiClient.get<PrayerTimesResponse>(
      `/prayer-times/${districtId}/${period}`
    );
    return data;
  },

  getTodayPrayerTimes: async (districtId: string): Promise<PrayerTimeData | null> => {
    try {
      const response = await prayerService.getPrayerTimes(districtId, 'weekly');
      if (!response.success || !response.data || response.data.length === 0) {
        return null;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayData = response.data.find((item) => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === today.getTime();
      });

      return todayData || response.data[0] || null;
    } catch (error) {
      console.error('Error fetching today prayer times:', error);
      return null;
    }
  },
};
