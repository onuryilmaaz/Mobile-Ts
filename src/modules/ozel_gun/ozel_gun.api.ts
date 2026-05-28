import { api } from '@/services/api';

export const ozelGunApi = {
  getActive: () => api.get('/ozel-gun/active'),
  start: () => api.post('/ozel-gun/start'),
  end: () => api.post('/ozel-gun/end'),
};
