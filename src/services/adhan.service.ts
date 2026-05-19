import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

const ADHAN_PRAYERS_KEY = 'ADHAN_PRAYERS_V2';

export const ADHAN_PRAYER_KEYS = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type AdhanPrayerKey = (typeof ADHAN_PRAYER_KEYS)[number];

const DEFAULT_ADHAN_PRAYERS: Record<AdhanPrayerKey, boolean> = {
  imsak: true,
  gunes: false,
  ogle: true,
  ikindi: true,
  aksam: true,
  yatsi: true,
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ADHAN_SOURCES: Record<AdhanPrayerKey, ReturnType<typeof require>> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  imsak: require('../../assets/audio/imsak.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gunes: require('../../assets/audio/imsak.mp3'), // güneşte ezan çalınmaz, fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ogle: require('../../assets/audio/ogle.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ikindi: require('../../assets/audio/ikindi.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  aksam: require('../../assets/audio/aksam.mp3'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  yatsi: require('../../assets/audio/yatsi.mp3'),
};

let currentPlayer: AudioPlayer | null = null;

export const adhanService = {
  async getAdhanPrayers(): Promise<Record<AdhanPrayerKey, boolean>> {
    const val = await AsyncStorage.getItem(ADHAN_PRAYERS_KEY);
    if (!val) return { ...DEFAULT_ADHAN_PRAYERS };
    try {
      return { ...DEFAULT_ADHAN_PRAYERS, ...JSON.parse(val) };
    } catch {
      return { ...DEFAULT_ADHAN_PRAYERS };
    }
  },

  async setAdhanPrayer(key: AdhanPrayerKey, value: boolean): Promise<void> {
    const current = await this.getAdhanPrayers();
    current[key] = value;
    await AsyncStorage.setItem(ADHAN_PRAYERS_KEY, JSON.stringify(current));
  },

  async isAdhanEnabled(prayerKey: AdhanPrayerKey): Promise<boolean> {
    const prayers = await this.getAdhanPrayers();
    return prayers[prayerKey] ?? false;
  },

  async playAdhan(prayerKey: AdhanPrayerKey = 'ogle'): Promise<void> {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      if (currentPlayer) {
        try {
          currentPlayer.pause();
          currentPlayer.remove();
        } catch {}
        currentPlayer = null;
      }
      const source = ADHAN_SOURCES[prayerKey];
      currentPlayer = createAudioPlayer(source);
      currentPlayer.play();
    } catch (e) {
      console.error('Adhan playback error:', e);
    }
  },

  stop(): void {
    if (currentPlayer) {
      try {
        currentPlayer.pause();
        currentPlayer.remove();
      } catch {}
      currentPlayer = null;
    }
  },

  isPlaying(): boolean {
    return currentPlayer !== null && currentPlayer.playing;
  },

  addFinishedListener(onFinished: () => void): (() => void) | null {
    if (!currentPlayer) return null;
    const sub = currentPlayer.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        onFinished();
      }
    });
    return () => sub.remove();
  },
};
