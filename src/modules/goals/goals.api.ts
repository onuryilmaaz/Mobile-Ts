import { api } from '@/services/api';

export const goalsApi = {
  getGoals: () => api.get('/goals'),
  upsertGoal: (payload: { activity_type: string; target: number; enabled: boolean }) =>
    api.put('/goals', payload),
  deleteGoal: (activityType: string) => api.delete(`/goals/${activityType}`),
};
