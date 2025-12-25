import type { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Otp: undefined;
};

// User Tab Navigator
export type UserTabParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Admin Stack
export type AdminStackParamList = {
  Dashboard: undefined;
  Users: undefined;
  UserDetail: { userId: string };
  Roles: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  UserTabs: NavigatorScreenParams<UserTabParamList>;
  Admin: NavigatorScreenParams<AdminStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

