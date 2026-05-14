/* eslint-disable @typescript-eslint/no-unused-vars */
import { NativeModules, Platform } from 'react-native';

const { SalahLiveActivityModule: Native } = NativeModules;

const isSupported = Platform.OS === 'ios' && !!Native;

export interface PrayerActivityParams {
  prayerName: string;
  nextPrayer: string;
  endTimeMs: number;
}

export interface WidgetDataParams {
  prayerName: string;
  prayerTime: string;
  nextPrayer: string;
  endTimeMs: number;
  imsak?: string;
  gunes?: string;
  ogle?: string;
  ikindi?: string;
  aksam?: string;
  yatsi?: string;
}

export interface PrayerTrackerParams {
  completedPrayers: string[];
  kazaPrayers: string[];
  date: string;
}

export interface AmelDataParams {
  types: string[];
  totalCount: number;
  date: string;
}

export interface InspirationDataParams {
  text: string;
  source: string;
  type: string;
  arabic?: string;
  date: string;
}

export const liveActivityService = {
  get isSupported() {
    return isSupported;
  },

  async startPrayerActivity(params: PrayerActivityParams): Promise<string | null> {
    if (!isSupported) return null;
    try {
      return await Native.startPrayerActivity(params);
    } catch (e) {
      return null;
    }
  },

  async endPrayerActivity(): Promise<void> {
    if (!isSupported) return;
    try {
      await Native.endPrayerActivity();
    } catch {
      // silent
    }
  },

  updateWidgetData(params: WidgetDataParams): void {
    if (!isSupported) return;
    try {
      Native.updateWidgetData(params);
    } catch {
      // silent
    }
  },

  updatePrayerTrackerData(params: PrayerTrackerParams): void {
    if (!isSupported) return;
    try {
      Native.updatePrayerTrackerData(params);
    } catch {
      // silent
    }
  },

  updateAmelData(params: AmelDataParams): void {
    if (!isSupported) return;
    try {
      Native.updateAmelData(params);
    } catch {
      // silent
    }
  },

  updateInspirationData(params: InspirationDataParams): void {
    if (!isSupported) return;
    try {
      Native.updateInspirationData(params);
    } catch {
      // silent
    }
  },

  async getPendingWidgetPrayers(): Promise<string> {
    if (!isSupported) return '';
    try {
      return (await Native.getPendingWidgetPrayers()) ?? '';
    } catch {
      return '';
    }
  },
};
