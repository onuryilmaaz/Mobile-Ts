import { api } from '@/services/api';
import type { ChangePasswordPayload, UpdateProfilePayload, UserProfile } from './user.types';

export const userApi = {
  profile: () => api.get<UserProfile>('/user/profile'),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<UserProfile>('/user/update-profile', payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post('/user/change-password', payload),

  uploadAvatar: (formData: FormData) =>
    api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deactivate: () => api.post('/user/deactivate'),
};
