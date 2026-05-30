import { create } from 'zustand';

type PrayerTimesStore = {
  imsak: string | null;
  aksam: string | null;
  setTodayTimes: (imsak: string, aksam: string) => void;
};

export const usePrayerTimesStore = create<PrayerTimesStore>((set) => ({
  imsak: null,
  aksam: null,
  setTodayTimes: (imsak, aksam) => set({ imsak, aksam }),
}));
