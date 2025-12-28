export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

export type ChangeEmailRequestPayload = {
  newEmail: string;
};

export type ChangeEmailConfirmPayload = {
  otp: string;
  newEmail: string;
};

export type SessionInfo = {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt?: string;
  isCurrent?: boolean;
};
