/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Otp: { email: string; password?: string };
  ForgotPassword: undefined;
  ResetPassword: { email?: string };
};

export type AdminStackParamList = {
  Dashboard: undefined;
  Users: undefined;
  UserDetail: { userId: string };
  Roles: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ChangePassword: undefined;
  ChangeEmail: undefined;
  Sessions: undefined;
  Account: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  QiblaFinder: undefined;
};

export type UserTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  AdminStack: NavigatorScreenParams<AdminStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  UserTabs: NavigatorScreenParams<UserTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
