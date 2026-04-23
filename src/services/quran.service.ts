import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.acikkuran.com';
const SURAHS_CACHE_KEY = '@salah_surahs_cache';

let cachedSurahs: Surah[] | null = null;

export interface Surah {
  id: number;
  name: string;
  slug: string;
  verse_count: number;
  page_number: number;
  revelation_order: number;
  revelation_place: string;
  name_arabic: string;
  name_turkish: string;
}

export interface Verse {
  id: number;
  surah_id: number;
  verse_number: number;
  verse_simplified: string;
  page_number: number;
  juz_number: number;
  transcription: string;
  translation: {
    id: number;
    text: string;
    author: {
      id: number;
      name: string;
    };
  };
}

export const quranService = {
  async getSurahs(): Promise<Surah[]> {
    try {
      // 1. Check memory cache
      if (cachedSurahs) return cachedSurahs;

      // 2. Check persistent storage
      const stored = await AsyncStorage.getItem(SURAHS_CACHE_KEY);
      if (stored) {
        cachedSurahs = JSON.parse(stored);
        return cachedSurahs || [];
      }

      // 3. Fetch from API if not cached
      const response = await fetch(`${BASE_URL}/surahs`);
      const result = await response.json();
      const surahs = result.data;

      // 4. Save to cache
      if (surahs && surahs.length > 0) {
        cachedSurahs = surahs;
        await AsyncStorage.setItem(SURAHS_CACHE_KEY, JSON.stringify(surahs));
      }

      return surahs || [];
    } catch (error) {
      console.error('Error fetching surahs:', error);
      return [];
    }
  },

  async getSurah(id: number): Promise<Surah | null> {
    try {
      const surahs = await this.getSurahs();
      return surahs.find((s) => s.id === id) || null;
    } catch (error) {
      console.error(`Error finding surah ${id}:`, error);
      return null;
    }
  },

  async getVerse(surahId: number, verseNumber: number): Promise<Verse | null> {
    try {
      const response = await fetch(`${BASE_URL}/surah/${surahId}/verse/${verseNumber}`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Error fetching verse ${surahId}:${verseNumber}:`, error);
      return null;
    }
  },

  async getRandomVerse(): Promise<{ verse: Verse; surah: Surah } | null> {
    try {
      // Step 1: Get all surahs to know the verse counts
      const surahs = await this.getSurahs();
      if (!surahs || surahs.length === 0) return null;

      // Step 2: Pick a random surah
      const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];

      // Step 3: Pick a random verse number
      const randomVerseNumber = Math.floor(Math.random() * randomSurah.verse_count) + 1;

      // Step 4: Get the verse data
      const verse = await this.getVerse(randomSurah.id, randomVerseNumber);

      if (verse) {
        return { verse, surah: randomSurah };
      }
      return null;
    } catch (error) {
      console.error('Error fetching random verse:', error);
      return null;
    }
  },
};
