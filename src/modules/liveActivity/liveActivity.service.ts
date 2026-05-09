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
};
