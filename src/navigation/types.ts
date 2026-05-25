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
  AppSettings: undefined;
};

export type FamilyStackParamList = {
  FamilyDashboard: undefined;
  AddChild: undefined;
  ChildDetail: { childId: string };
  CreateTask: { childId: string };
  EditTask: { childId: string; taskId: string };
  PendingApprovals: undefined;
  CompletionDetail: { completionId: string };
  RewardCatalog: { childId: string };
  ChildReport: { childId: string };
};

export type ChildTabParamList = {
  ChildTasks: undefined;
  ChildRewards: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  QiblaFinder: undefined;
  LocationSelection: undefined;
  KazaTracker: undefined;
  Stats: undefined;
  Challenges: undefined;
  MosqueMap: undefined;
  Dua: undefined;
  Dhikr: undefined;
  HijriCalendar: undefined;
  Settings: undefined;
  Ramadan: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Family: NavigatorScreenParams<FamilyStackParamList>;
};

export type SurahsStackParamList = {
  SurahsMain: undefined;
  SurahDetail: { surahId: number; surahName: string };
};

export type TrackerStackParamList = {
  TrackerMain: { type?: string } | undefined;
  Gamification: undefined;
  KazaTracker: undefined;
  Stats: undefined;
  Challenges: undefined;
};

export type GroupStackParamList = {
  GroupList: undefined;
  GroupDetail: { groupId: string };
  GroupCreate: undefined;
  GroupInvite: { groupId: string; inviteCode: string };
  GroupSettings: { groupId: string };
  GoalCreate: { groupId: string };
  GoalSuggest: { groupId: string };
  GroupManualLog: { groupId: string };
};

export type UserTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Surahs: NavigatorScreenParams<SurahsStackParamList>;
  Dhikr: undefined;
  Tracker: NavigatorScreenParams<TrackerStackParamList>;
  Groups: NavigatorScreenParams<GroupStackParamList>;
  AdminStack: NavigatorScreenParams<AdminStackParamList>;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  UserTabs: NavigatorScreenParams<UserTabParamList>;
  ChildMode: NavigatorScreenParams<ChildTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
