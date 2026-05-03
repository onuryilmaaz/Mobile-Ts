import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

export interface Hadith {
  id: number;
  book: string;
  hadith_number: number;
  text: string;
}

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'hadiths.db';

export const hadithService = {
  async initDatabase() {
    if (db) return db;

    try {
      const docDir = FileSystem.documentDirectory;

      if (!docDir) {
        console.error('FileSystem.documentDirectory is still null in legacy mode.');
        return null;
      }

      const dbDir = `${docDir}SQLite/`;
      const dbPath = `${dbDir}${DB_NAME}`;

      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      if (!fileInfo.exists) {
        console.log('Copying database from assets...');
        const asset = Asset.fromModule(require('../../assets/data/hadiths.db'));
        await asset.downloadAsync();

        if (asset.localUri) {
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: dbPath,
          });
          console.log('Database copied successfully.');
        } else {
          throw new Error('Asset localUri is null');
        }
      }

      db = await SQLite.openDatabaseAsync(DB_NAME);
      return db;
    } catch (error) {
      console.error('Error initializing hadith database:', error);
      return null;
    }
  },

  async getRandomHadith(book?: 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi') {
    try {
      const database = await this.initDatabase();
      if (!database) return null;

      let query = 'SELECT * FROM hadiths ';
      let params: any[] = [];

      if (book) {
        query += 'WHERE book = ? ';
        params.push(book);
      }

      query += 'ORDER BY RANDOM() LIMIT 1';

      const result = await database.getFirstAsync<Hadith>(query, params);

      if (result) {
        return {
          hadith: {
            hadithnumber: result.hadith_number,
            text: result.text,
          },
          bookName: this.getBookDisplayName(result.book),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting random hadith:', error);
      return null;
    }
  },

  async getHourlyHadith() {
    try {
      const database = await this.initDatabase();
      if (!database) return null;

      const now = new Date();
      const seed = Math.floor(now.getTime() / (1000 * 60 * 60));

      const totalCountResult = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM hadiths'
      );
      const totalCount = totalCountResult?.count || 1;
      const offset = seed % totalCount;

      const result = await database.getFirstAsync<Hadith>(
        'SELECT * FROM hadiths LIMIT 1 OFFSET ?',
        [offset]
      );

      if (result) {
        return {
          hadith: {
            hadithnumber: result.hadith_number,
            text: result.text,
          },
          bookName: this.getBookDisplayName(result.book),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting hourly hadith:', error);
      return null;
    }
  },

  getBookDisplayName(book: string) {
    const names: Record<string, string> = {
      bukhari: 'Sahih-i Buhârî',
      muslim: 'Sahih-i Müslim',
      abudawud: 'Sünen-i Ebû Dâvûd',
      tirmidhi: 'Sünen-i Tirmizî',
    };
    return names[book] || book;
  },
};
