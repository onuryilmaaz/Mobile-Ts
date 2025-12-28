import axios from 'axios';
import { api } from '@/services/api';
import {
  AuthResponse,
  ChangeEmailConfirmPayload,
  ChangeEmailRequestPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
  RegisterPayload,
  ResetPasswordPayload,
  SessionInfo,
  VerifyEmailPayload,
} from './auth.types';
import { getRefreshToken } from '@/services/token.service';

const BASE_URL = 'http://localhost:3000';

const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginResponse>('/auth/login', payload),

  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),

  refresh: (refreshToken: string) =>
    refreshClient.post<RefreshResponse>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),

  me: () => api.get('/me'),

  verifyEmail: (payload: VerifyEmailPayload) => api.post('/auth/verify-email', payload),

  resendEmailOtp: (email: string) => api.post('/auth/resend-email-otp', { email }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) => api.post('/auth/reset-password', payload),

  changeEmailRequest: (payload: ChangeEmailRequestPayload) =>
    api.post('/auth/change-email/request', payload),

  changeEmailConfirm: (payload: ChangeEmailConfirmPayload) =>
    api.post('/auth/change-email/confirm', payload),

  sessions: () => api.get<SessionInfo[]>('/auth/sessions'),

  revokeSession: (sessionId: string) => api.post('/auth/sessions/revoke', { sessionId }),

  revokeOtherSessions: async () => {
    const refreshToken = await getRefreshToken();
    return api.post('/auth/sessions/revoke-others', undefined, {
      headers: { 'x-refresh-token': refreshToken ?? '' },
    });
  },
};
