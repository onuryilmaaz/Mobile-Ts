import { api } from "@/services/api";

export const mosqueApi = {
  getMosques: (filter: "mine" | "all" = "all") =>
    api.get(`/mosques?filter=${filter}`),

  addMosque: (data: {
    name: string;
    latitude: number;
    longitude: number;
    image_url?: string;
    image_public_id?: string;
    description?: string;
  }) => api.post("/mosques", data),

  uploadImage: (formData: FormData) =>
    api.post("/mosques/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }),

  updateMosque: (
    id: string,
    data: {
      name: string;
      description?: string;
      image_url?: string;
      image_public_id?: string;
    }
  ) => api.put(`/mosques/${id}`, data),

  deleteMosque: (id: string) => api.delete(`/mosques/${id}`),
};
