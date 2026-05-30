import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'QURAN_BOOKMARKS_V2';
const LAST_READ_KEY = 'QURAN_LAST_READ';

export type Bookmark = {
  id: string; // `${surahId}:${verseNumber}`
  surahId: number;
  surahName: string;
  verseNumber: number;
  preview?: string; // first 80 chars of translation
  createdAt: number;
};

export type LastRead = {
  surahId: number;
  surahName: string;
  verseNumber: number;
  updatedAt: number;
};

type QuranStore = {
  bookmarks: Bookmark[];
  lastRead: LastRead | null;
  loaded: boolean;

  load: () => Promise<void>;
  addBookmark: (b: Omit<Bookmark, 'id' | 'createdAt'>) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  isBookmarked: (surahId: number, verseNumber: number) => boolean;
  setLastRead: (lr: Omit<LastRead, 'updatedAt'>) => Promise<void>;
};

export const useQuranStore = create<QuranStore>((set, get) => ({
  bookmarks: [],
  lastRead: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      const [bRaw, lrRaw] = await Promise.all([
        AsyncStorage.getItem(BOOKMARKS_KEY),
        AsyncStorage.getItem(LAST_READ_KEY),
      ]);
      const bookmarks: Bookmark[] = bRaw ? JSON.parse(bRaw) : [];
      const lastRead: LastRead | null = lrRaw ? JSON.parse(lrRaw) : null;
      set({ bookmarks, lastRead, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addBookmark: async (b) => {
    const id = `${b.surahId}:${b.verseNumber}`;
    const existing = get().bookmarks;
    if (existing.find((x) => x.id === id)) return;
    const next: Bookmark[] = [{ ...b, id, createdAt: Date.now() }, ...existing];
    set({ bookmarks: next });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  },

  removeBookmark: async (id) => {
    const next = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: next });
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  },

  isBookmarked: (surahId, verseNumber) => {
    const id = `${surahId}:${verseNumber}`;
    return get().bookmarks.some((b) => b.id === id);
  },

  setLastRead: async (lr) => {
    const next: LastRead = { ...lr, updatedAt: Date.now() };
    set({ lastRead: next });
    await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(next));
  },
}));
