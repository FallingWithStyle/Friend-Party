// Central minimal row types used across API routes (kept intentionally small)

export type UUID = string;

export interface PartyRow {
  id: UUID;
  code?: string;
  motto?: string | null;
  status?: string | null;
  morale_score?: number | null;
  morale_level?: 'Low' | 'Neutral' | 'High' | null;
}

export interface PartyMemberRow {
  id: UUID;
  user_id?: UUID;
  party_id?: UUID;
  is_npc?: boolean;
  is_leader?: boolean;
  assessment_status?: string | null;
}

export interface MottoProposalRow {
  id: UUID;
  party_id: UUID;
  text?: string | null;
  vote_count?: number | null;
  active?: boolean | null;
  is_finalized?: boolean | null;
  created_at?: string | null;
}

export interface MottoVoteRow {
  id?: UUID;
  proposal_id: UUID;
  voter_member_id: UUID;
}

export interface NameProposalRow {
  id: UUID;
  party_id: UUID;
  target_member_id: UUID;
  proposing_member_id: UUID;
  proposed_name: string;
  is_active: boolean;
}

export interface NameProposalVoteRow {
  id: UUID;
  proposal_id: UUID;
  voter_member_id: UUID;
}

export interface AppSettingRow {
  key: string;
  value: unknown;
}

export interface AchievementRow {
  achievement_id: UUID;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlock_conditions: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievementRow {
  id: UUID;
  user_id: UUID;
  achievement_id: UUID;
  earned_at: string;
}

export interface UserAchievementProgressRow {
  id: UUID;
  user_id: UUID;
  achievement_id: UUID;
  progress_data: Record<string, unknown>;
  last_updated: string;
}

export interface AvatarPartRow {
  part_id: UUID;
  type: string;
  name: string;
  image_url: string;
  unlock_requirements?: Record<string, unknown> | null;
  is_default: boolean;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserAvatarPartRow {
  id: UUID;
  user_id: UUID;
  part_id: UUID;
  unlocked_at: string;
}

export interface UserAvatarRow {
  id: UUID;
  user_id: UUID;
  head_part_id?: UUID | null;
  skin_part_id?: UUID | null;
  eyes_part_id?: UUID | null;
  accessories_part_id?: UUID | null;
  backgrounds_part_id?: UUID | null;
  effects_part_id?: UUID | null;
  created_at: string;
  updated_at: string;
}


