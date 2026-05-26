export type TaskType =
  | 'prayer'
  | 'quran'
  | 'dua'
  | 'dhikr'
  | 'wudu'
  | 'memorization'
  | 'manners'
  | 'custom';

export type Recurrence = 'daily' | 'weekly' | 'once';
export type CompletionStatus = 'pending' | 'approved' | 'rejected';

export interface ChildProfile {
  id: string;
  parent_id: string;
  name: string;
  birth_year: number | null;
  avatar_emoji: string;
  gender: 'erkek' | 'kız' | null;
  is_active: boolean;
  created_at: string;
  total_stars?: number;
  current_streak?: number;
  level?: number;
  pending_approvals?: number;
  task_count?: number;
}

export interface ChildStats {
  child_id: string;
  total_stars: number;
  current_streak: number;
  highest_streak: number;
  level: number;
  level_name: string;
  next_level_stars: number | null;
  last_activity: string | null;
  badges: ChildBadge[];
}

export interface ChildTask {
  id: string;
  child_id: string;
  parent_id: string;
  task_type: TaskType;
  title: string;
  description: string | null;
  recurrence: Recurrence;
  scheduled_days: number[] | null;
  due_time: string | null;
  reward_stars: number;
  requires_proof: boolean;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
  // joined in today view
  completion_id?: string | null;
  status?: CompletionStatus | null;
  stars_earned?: number;
  completed_at?: string | null;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  child_id: string;
  completion_date: string;
  completed_at: string;
  status: CompletionStatus;
  evidence_url: string | null;
  parent_note: string | null;
  reviewed_at: string | null;
  stars_earned: number;
  // joined
  title?: string;
  task_type?: TaskType;
  reward_stars?: number;
  child_name?: string;
  avatar_emoji?: string;
}

export interface ChildBadge {
  badge_type: string;
  earned_at: string;
  name?: string;
  description?: string;
  emoji?: string;
}

export interface ChildReward {
  id: string;
  child_id: string;
  title: string;
  cost_stars: number;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
}

export interface TaskTemplate {
  task_type: TaskType;
  title: string;
  description: string;
  reward_stars: number;
  requires_approval: boolean;
}

export interface ChildSession {
  token: string;
  childId: string;
  parentId: string;
  childName: string;
  avatarEmoji: string;
  gender?: 'erkek' | 'kız' | null;
}

export const TASK_TYPE_META: Record<TaskType, { label: string; emoji: string; color: string }> = {
  prayer: { label: 'Namaz', emoji: '🕌', color: '#10b981' },
  quran: { label: 'Kuran', emoji: '📖', color: '#8b5cf6' },
  dua: { label: 'Dua', emoji: '🤲', color: '#ec4899' },
  dhikr: { label: 'Zikir', emoji: '📿', color: '#06b6d4' },
  wudu: { label: 'Abdest', emoji: '💧', color: '#3b82f6' },
  memorization: { label: 'Ezber', emoji: '🧠', color: '#f59e0b' },
  manners: { label: 'Adab', emoji: '😇', color: '#f97316' },
  custom: { label: 'Özel', emoji: '✨', color: '#6366f1' },
};
