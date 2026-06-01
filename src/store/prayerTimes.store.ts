import { create } from 'zustand';

type PrayerTimesStore = {
  imsak: string | null;
  aksam: string | null;
  yatsi: string | null;
  setTodayTimes: (params: { imsak: string; aksam: string; yatsi: string }) => void;
};

export const usePrayerTimesStore = create<PrayerTimesStore>((set) => ({
  imsak: null,
  aksam: null,
  yatsi: null,
  setTodayTimes: ({ imsak, aksam, yatsi }) => set({ imsak, aksam, yatsi }),
}));
