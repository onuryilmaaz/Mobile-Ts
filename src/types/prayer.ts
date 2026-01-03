export interface PrayerTimes {
  sabah: string;
  imsak: string;
  öğle: string;
  ikindi: string;
  akşam: string;
  yatsı: string;
}

export interface NextPrayer {
  name: string;
  time: string;
  remaining: {
    hours: number;
    minutes: number;
    totalMinutes: number;
  };
}

export interface PrayerTimesData {
  city: string;
  date: string;
  prayers: PrayerTimes;
  nextPrayer: NextPrayer;
}

export interface PrayerTimesResponse {
  success: boolean;
  data: PrayerTimesData;
}
