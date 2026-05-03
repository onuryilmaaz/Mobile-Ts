import { create } from "zustand";
import { mosqueApi } from "./mosque.api";

interface Mosque {
  id: string;
  user_id: string;
  name: string;
  latitude: string; // Postgres returns decimal as string
  longitude: string;
  image_url: string | null;
  description: string | null;
  first_name?: string;
  last_name?: string;
  username?: string;
  created_at: string;
}

interface MosqueState {
  mosques: Mosque[];
  isLoading: boolean;
  fetchMosques: (filter?: "mine" | "all") => Promise<void>;
  addMosque: (data: Parameters<typeof mosqueApi.addMosque>[0]) => Promise<boolean>;
}

export const useMosqueStore = create<MosqueState>((set) => ({
  mosques: [],
  isLoading: false,

  fetchMosques: async (filter = "all") => {
    set({ isLoading: true });
    try {
      const response = await mosqueApi.getMosques(filter);
      if (response.data.success) {
        set({ mosques: response.data.mosques });
      }
    } catch (error) {
      console.error("Fetch mosques error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addMosque: async (data) => {
    set({ isLoading: true });
    try {
      const response = await mosqueApi.addMosque(data);
      if (response.data.success) {
        await useMosqueStore.getState().fetchMosques();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Add mosque error:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
