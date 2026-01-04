/* eslint-disable @typescript-eslint/array-type */
const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

export interface Hadith {
  hadithnumber: number;
  arabicnumber: number;
  text: string;
  grades: Array<{
    grade: string;
    name: string;
  }>;
  reference?: {
    book: number;
    hadith: number;
  };
}

export interface HadithBook {
  metadata: {
    name: string;
    section: {
      [key: string]: number;
    };
  };
  hadiths: Hadith[];
}

export const hadithService = {
  async getRandomHadith(book: 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi' = 'bukhari') {
    try {
      const response = await fetch(`${BASE_URL}/editions/tur-${book}.json`);
      const data: HadithBook = await response.json();

      if (data.hadiths && data.hadiths.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.hadiths.length);
        return {
          hadith: data.hadiths[randomIndex],
          bookName: data.metadata.name,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching hadith:', error);
      return null;
    }
  },

  async getHadithByNumber(book: 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi', number: number) {
    try {
      const response = await fetch(`${BASE_URL}/editions/tur-${book}.json`);
      const data: HadithBook = await response.json();

      const hadith = data.hadiths.find((h) => h.hadithnumber === number);
      if (hadith) {
        return {
          hadith,
          bookName: data.metadata.name,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching hadith:', error);
      return null;
    }
  },

  async getHourlyHadith() {
    try {
      const response = await fetch(`${BASE_URL}/editions/tur-bukhari.json`);
      const data: HadithBook = await response.json();

      if (data.hadiths && data.hadiths.length > 0) {
        const now = new Date();
        const dayOfYear = Math.floor(
          (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
        );
        const hour = now.getHours();
        const index = (dayOfYear * 24 + hour) % data.hadiths.length;

        return {
          hadith: data.hadiths[index],
          bookName: data.metadata.name,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching hourly hadith:', error);
      return null;
    }
  },
};
