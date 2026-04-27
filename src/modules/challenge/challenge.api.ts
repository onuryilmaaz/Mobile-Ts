import { api } from '@/services/api';

export const challengeApi = {
  getActive:  () => api.get('/challenges'),
  join:       (id: string) => api.post(`/challenges/${id}/join`),
  getHistory: () => api.get('/challenges/history'),
};
