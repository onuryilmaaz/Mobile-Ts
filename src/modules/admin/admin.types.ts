export type AdminUser = {
  id: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

export type AdminRole = {
  id: string;
  name: string;
};

export type DashboardStats = {
  userCount?: number;
  activeSessions?: number;
  adminCount?: number;
  [key: string]: number | undefined;
};
