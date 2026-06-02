import { create } from 'zustand';

type PrayerTimesStore = {
  imsak: string | null;
  gunes: string | null;
  ogle: string | null;
  ikindi: string | null;
  aksam: string | null;
  yatsi: string | null;
  setTodayTimes: (params: {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
  }) => void;
};

export const usePrayerTimesStore = create<PrayerTimesStore>((set) => ({
  imsak: null,
  gunes: null,
  ogle: null,
  ikindi: null,
  aksam: null,
  yatsi: null,
  setTodayTimes: ({ imsak, gunes, ogle, ikindi, aksam, yatsi }) =>
    set({ imsak, gunes, ogle, ikindi, aksam, yatsi }),
}));
