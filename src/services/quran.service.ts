const BASE_URL = 'https://api.acikkuran.com';

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
  page_number: number;
  juz_number: number;
  transcription: string;
  translation: {
    id: number;
    text: string;
    author: {
      id: number;
      name: string;
    }
  };
}

export const quranService = {
  async getSurahs(): Promise<Surah[]> {
    try {
      const response = await fetch(`${BASE_URL}/surahs`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching surahs:', error);
      return [];
    }
  },

  async getSurah(id: number): Promise<Surah | null> {
    try {
      const response = await fetch(`${BASE_URL}/surah/${id}`);
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Error fetching surah ${id}:`, error);
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
  }
};
