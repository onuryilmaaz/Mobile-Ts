import { api } from "@/services/api";

export const mosqueApi = {
  addMosque: (data: {
    name: string;
    latitude: number;
    longitude: number;
    image_url?: string;
    description?: string;
  }) => api.post("/mosques", data),

  getMosques: (filter: "mine" | "all" = "all") =>
    api.get(`/mosques?filter=${filter}`),

  uploadImage: (formData: FormData) =>
    api.post("/mosques/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
