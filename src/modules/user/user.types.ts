export type UserProfile = {
  id: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
