export interface PrayerTimes {
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
}

export interface HijriDate {
  day: number;
  month: number;
  month_name: string;
  month_name_en: string;
  year: number;
  full_date: string;
}

export interface PrayerTimeData {
  _id: string;
  district_id: {
    _id: string;
    name: string;
    name_en: string;
    url: string;
    state_id: {
      _id: string;
      name: string;
      name_en: string;
      country_id: string;
    };
    country_id: {
      _id: string;
      name: string;
      name_en: string;
    };
  };
  date: string;
  hijri_date: HijriDate;
  times: PrayerTimes;
  meta?: {
    source: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PrayerTimesResponse {
  success: boolean;
  code: number;
  message: string;
  data: PrayerTimeData[];
  meta?: {
    totalCount?: number;
  };
  requestId?: string;
  timestamp?: number;
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
