export type GroupRole = 'owner' | 'moderator' | 'member';

export type GroupMember = {
  user_id: string;
  role: GroupRole;
  joined_at: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export type GroupActivityType = {
  id: string;
  group_id: string;
  name: string;
  base_type: string | null;
  unit: string;
  created_at: string;
};

export type Group = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  invite_code: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  // joined fields
  role: GroupRole;
  joined_at: string;
  member_count: number;
};

export type GroupDetail = Group & {
  my_role: GroupRole | null;
  members: GroupMember[];
  activity_types: GroupActivityType[];
};

export type GoalProgress =
  | { total: number; target: number }
  | { per_person: Array<{ user_id: string; first_name: string; last_name: string; avatar_url: string | null; total: number; target: number }> }
  | { per_person_days: Array<{ user_id: string; days: number; target: number }> };

export type GroupGoal = {
  id: string;
  group_id: string;
  activity_type_id: string | null;
  title: string;
  goal_type: 'group_total' | 'per_person' | 'streak';
  target_value: number;
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  // joined fields
  activity_type_name: string | null;
  unit: string | null;
  progress: GoalProgress;
};

export type FeedItem = {
  id: string;
  value: number;
  points: number;
  logged_at: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  activity_name: string;
  unit: string;
};

export type LeaderboardEntry = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: GroupRole;
  total_points?: number;
  current_streak?: number;
  period_points?: number;
};

export type GoalSuggestion = {
  id: string;
  group_id: string;
  suggested_by: string;
  title: string;
  goal_type: string;
  target_value: number;
  activity_type_id: string | null;
  start_date: string | null;
  end_date: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};
