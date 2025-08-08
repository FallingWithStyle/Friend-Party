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


