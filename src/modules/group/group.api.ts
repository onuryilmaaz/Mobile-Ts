import { api } from '@/services/api';

export const groupApi = {
  // Group CRUD
  create:       (data: { name: string; description?: string; max_members?: number }) =>
    api.post('/groups', data),
  uploadAvatar: (id: string, formData: FormData) =>
    api.post(`/groups/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  myGroups: () => api.get('/groups/me'),
  getById:  (id: string) => api.get(`/groups/${id}`),
  update:   (id: string, data: object) => api.patch(`/groups/${id}`, data),
  remove:   (id: string) => api.delete(`/groups/${id}`),

  // Membership
  joinByCode: (inviteCode: string) => api.post(`/groups/join/${inviteCode}`),
  leave:      (id: string) => api.post(`/groups/${id}/leave`),
  kickMember:       (id: string, memberId: string) => api.delete(`/groups/${id}/members/${memberId}`),
  updateMemberRole: (id: string, memberId: string, role: 'moderator' | 'member') =>
    api.patch(`/groups/${id}/members/${memberId}/role`, { role }),

  // Activity types
  addActivityType:    (id: string, data: object) => api.post(`/groups/${id}/activity-types`, data),
  deleteActivityType: (id: string, typeId: string) => api.delete(`/groups/${id}/activity-types/${typeId}`),

  // Goals
  createGoal: (id: string, data: object) => api.post(`/groups/${id}/goals`, data),
  listGoals:  (id: string) => api.get(`/groups/${id}/goals`),
  updateGoal: (id: string, goalId: string, data: object) =>
    api.patch(`/groups/${id}/goals/${goalId}`, data),

  // Goal suggestions
  suggestGoal:         (id: string, data: object) => api.post(`/groups/${id}/goal-suggestions`, data),
  listSuggestions:     (id: string) => api.get(`/groups/${id}/goal-suggestions`),
  reviewSuggestion:    (id: string, suggestionId: string, approved: boolean) =>
    api.patch(`/groups/${id}/goal-suggestions/${suggestionId}`, { approved }),

  // Manual activity log
  logManualActivity: (id: string, data: { activity_type_id: string; value: number; notes?: string }) =>
    api.post(`/groups/${id}/activity-logs`, data),

  // Feed & Leaderboard
  feed:        (id: string, limit = 20, offset = 0) =>
    api.get(`/groups/${id}/feed?limit=${limit}&offset=${offset}`),
  leaderboard: (id: string, period: string, start?: string, end?: string) =>
    api.get(`/groups/${id}/leaderboard?period=${period}${start ? `&start=${start}&end=${end}` : ''}`),
};
