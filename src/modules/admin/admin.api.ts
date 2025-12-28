import { api } from '@/services/api';
import type { AdminRole, AdminUser, DashboardStats } from './admin.types';

export const adminApi = {
  healthy: () => api.get('/admin/healthy'),
  dashboard: () => api.get<DashboardStats>('/admin/dashboard'),

  listUsers: () => api.get<AdminUser[] | { users: AdminUser[] }>('/admin/users'),
  getUser: (userId: string) => api.get<AdminUser | { user: AdminUser }>(`/admin/users/${userId}`),
  activateUser: (userId: string) => api.post(`/admin/users/${userId}/activate`),
  deactivateUser: (userId: string) => api.post(`/admin/users/${userId}/deactivate`),

  listUserSessions: (userId: string) => api.get(`/admin/users/${userId}/sessions`),
  revokeAllSessions: (userId: string) =>
    api.post(`/admin/users/${userId}/sessions/revoke-all`),

  listRoles: () => api.get<AdminRole[] | { roles: AdminRole[] }>('/admin/roles'),
  createRole: (name: string) => api.post('/admin/roles', { name: name.toLowerCase().trim() }),
  updateRole: (roleId: string, name: string) => api.patch(`/admin/roles/${roleId}`, { name: name.toLowerCase().trim() }),
  deleteRole: (roleId: string) => api.delete(`/admin/roles/${roleId}`),

  assignRole: (userId: string, roleId: string) =>
    api.post(`/admin/users/${userId}/roles`, { roleId }),
  removeRole: (userId: string, roleId: string) =>
    api.delete(`/admin/users/${userId}/roles/${roleId}`),
};
