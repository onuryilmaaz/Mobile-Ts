import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { api, API_BASE_URL } from '@/services/api';

const CHILD_TOKEN_KEY = 'child_token';

export async function getChildToken(): Promise<string | null> {
  return AsyncStorage.getItem(CHILD_TOKEN_KEY);
}

export async function setChildToken(token: string) {
  await AsyncStorage.setItem(CHILD_TOKEN_KEY, token);
}

export async function clearChildToken() {
  await AsyncStorage.removeItem(CHILD_TOKEN_KEY);
}

const childApi = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

childApi.interceptors.request.use(async (config) => {
  const token = await getChildToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const familyApi = {
  // Children
  createChild: (data: Record<string, unknown>) => api.post('/family/children', data),
  getChildren: () => api.get('/family/children'),
  getChild: (childId: string) => api.get(`/family/children/${childId}`),
  updateChild: (childId: string, data: Record<string, unknown>) =>
    api.patch(`/family/children/${childId}`, data),
  deleteChild: (childId: string) => api.delete(`/family/children/${childId}`),

  // PIN / Session
  createChildSession: (childId: string, pinCode: string) =>
    api.post(`/family/children/${childId}/session`, { pin_code: pinCode }),
  setPin: (childId: string, pinCode: string) =>
    api.post(`/family/children/${childId}/pin`, { pin_code: pinCode }),

  // Tasks
  getTaskTemplates: () => api.get('/family/task-templates'),
  createTask: (childId: string, data: Record<string, unknown>) =>
    api.post(`/family/children/${childId}/tasks`, data),
  getTasks: (childId: string) => api.get(`/family/children/${childId}/tasks`),
  updateTask: (childId: string, taskId: string, data: Record<string, unknown>) =>
    api.patch(`/family/children/${childId}/tasks/${taskId}`, data),
  deleteTask: (childId: string, taskId: string) =>
    api.delete(`/family/children/${childId}/tasks/${taskId}`),

  // Completions (parent side)
  getCompletions: (childId: string, limit?: number) =>
    api.get(`/family/children/${childId}/completions`, { params: { limit } }),
  reviewCompletion: (completionId: string, approved: boolean, parentNote?: string) =>
    api.patch(`/family/completions/${completionId}/review`, { approved, parent_note: parentNote }),
  getPendingApprovals: () => api.get('/family/pending-approvals'),

  // Stats & Reports
  getChildStats: (childId: string) => api.get(`/family/children/${childId}/stats`),
  getWeeklyReport: (childId: string) => api.get(`/family/children/${childId}/report/weekly`),
  getMonthlyReport: (childId: string, year?: number, month?: number) =>
    api.get(`/family/children/${childId}/report/monthly`, { params: { year, month } }),

  // Rewards (parent side)
  createReward: (childId: string, title: string, costStars: number) =>
    api.post(`/family/children/${childId}/rewards`, { title, cost_stars: costStars }),
  getRewards: (childId: string) => api.get(`/family/children/${childId}/rewards`),
  deleteReward: (rewardId: string) => api.delete(`/family/rewards/${rewardId}`),

  // Child session endpoints (uses child token)
  getTodayTasks: () => childApi.get('/family/child/today'),
  completeTask: (taskId: string, evidenceUrl?: string) =>
    childApi.post(`/family/tasks/${taskId}/complete`, { evidence_url: evidenceUrl }),
  redeemReward: (rewardId: string) => childApi.post(`/family/rewards/${rewardId}/redeem`, {}),
};
