import { create } from "zustand";
import { mosqueApi } from "./mosque.api";

export interface Mosque {
  id: string;
  user_id: string;
  name: string;
  latitude: string;
  longitude: string;
  image_url: string | null;
  image_public_id: string | null;
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
  updateMosque: (id: string, data: Parameters<typeof mosqueApi.updateMosque>[1]) => Promise<boolean>;
  deleteMosque: (id: string) => Promise<boolean>;
}

export const useMosqueStore = create<MosqueState>((set, get) => ({
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
    try {
      const response = await mosqueApi.addMosque(data);
      if (response.data.success) {
        await get().fetchMosques();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Add mosque error:", error);
      return false;
    }
  },

  updateMosque: async (id, data) => {
    try {
      const response = await mosqueApi.updateMosque(id, data);
      if (response.data.success) {
        await get().fetchMosques();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Update mosque error:", error);
      return false;
    }
  },

  deleteMosque: async (id) => {
    try {
      const response = await mosqueApi.deleteMosque(id);
      if (response.data.success) {
        set((state) => ({ mosques: state.mosques.filter((m) => m.id !== id) }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete mosque error:", error);
      return false;
    }
  },
}));
