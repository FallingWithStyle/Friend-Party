// Dragon's Hoard Minigame Types
// Specific types for the Dragon's Hoard Quiplash-style minigame

export type DragonsHoardPromptCategory = 
  | 'goblin_market'
  | 'dragons_hoard'
  | 'wizards_tower'
  | 'rogues_hideout'
  | 'cursed_tomb'
  | 'pirate_underwater'
  | 'giant_forest'
  | 'knight_tavern';

export type DragonsHoardMatchupStatus = 'pending' | 'voting' | 'completed';

export type DragonsHoardGamePhase = 
  | 'waiting_for_players'
  | 'prompt_assignment'
  | 'loot_creation'
  | 'pairing'
  | 'voting'
  | 'results'
  | 'completed';

// Database entity types
export interface DragonsHoardPrompt {
  id: string;
  prompt_text: string;
  category: DragonsHoardPromptCategory;
  is_active: boolean;
  created_at: string;
}

export interface DragonsHoardLoot {
  id: string;
  session_id: string;
  creator_id: string;
  prompt_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface DragonsHoardMatchup {
  id: string;
  session_id: string;
  loot_a_id: string;
  loot_b_id: string;
  round_number: number;
  status: DragonsHoardMatchupStatus;
  created_at: string;
  completed_at?: string;
}

export interface DragonsHoardVote {
  id: string;
  matchup_id: string;
  voter_id: string;
  voted_for_loot_id: string;
  created_at: string;
}

export interface DragonsHoardHoard {
  id: string;
  party_id: string;
  loot_id: string;
  added_at: string;
}

// Extended types with related data
export interface DragonsHoardLootWithDetails extends DragonsHoardLoot {
  prompt: DragonsHoardPrompt;
  creator_name: string;
}

export interface DragonsHoardMatchupWithDetails extends DragonsHoardMatchup {
  loot_a: DragonsHoardLootWithDetails;
  loot_b: DragonsHoardLootWithDetails;
  votes: DragonsHoardVote[];
  vote_counts: {
    loot_a_votes: number;
    loot_b_votes: number;
    dragon_vote?: 'a' | 'b';
  };
}

// Game state types
export interface DragonsHoardGameState {
  phase: DragonsHoardGamePhase;
  current_round: number;
  total_rounds: number;
  prompts_assigned: boolean;
  loot_created: boolean;
  matchups_created: boolean;
  voting_complete: boolean;
  results_calculated: boolean;
}

export interface DragonsHoardPlayerState {
  user_id: string;
  name: string;
  prompts: DragonsHoardPrompt[];
  loot_items: DragonsHoardLoot[];
  has_created_loot: boolean;
  has_voted: boolean;
  wins: number;
  total_votes_received: number;
}

// Game configuration
export interface DragonsHoardConfig {
  prompts_per_player: number;
  max_rounds: number;
  voting_timeout_seconds: number;
  dragon_vote_threshold: number; // Minimum voters needed before dragon vote kicks in
  categories_enabled: DragonsHoardPromptCategory[];
}

// Component props
export interface DragonsHoardGameProps {
  session: any; // MinigameSession
  participants: any[]; // MinigameParticipant[]
  onSessionUpdate: (updates: any) => void;
  onParticipantUpdate: (participant: any) => void;
  onRewardAwarded: (reward: any) => void;
}

export interface PromptDisplayProps {
  prompts: DragonsHoardPrompt[];
  onPromptsReady: () => void;
}

export interface LootCreationProps {
  prompts: DragonsHoardPrompt[];
  onLootCreated: (loot: Omit<DragonsHoardLoot, 'id' | 'session_id' | 'created_at'>) => void;
  disabled?: boolean;
}

export interface LootMatchupProps {
  matchup: DragonsHoardMatchupWithDetails;
  onVote: (lootId: string) => void;
  userVote?: string;
  disabled?: boolean;
}

export interface VotingInterfaceProps {
  matchups: DragonsHoardMatchupWithDetails[];
  currentMatchupIndex: number;
  onVote: (matchupId: string, lootId: string) => void;
  onNextMatchup: () => void;
  userVotes: Record<string, string>; // matchupId -> voted lootId
  disabled?: boolean;
}

export interface ResultsDisplayProps {
  matchups: DragonsHoardMatchupWithDetails[];
  winningLoot: DragonsHoardLootWithDetails[];
  onAddToHoard: (lootId: string) => void;
  onPlayAgain: () => void;
}

export interface HoardCollectionProps {
  partyId: string;
  hoard: DragonsHoardHoard[];
  lootDetails: DragonsHoardLootWithDetails[];
}

// Utility types
export interface DragonsHoardStats {
  total_sessions: number;
  total_loot_created: number;
  most_popular_category: DragonsHoardPromptCategory;
  most_creative_player: string;
  longest_winning_streak: number;
}

export interface DragonsHoardLeaderboard {
  player_id: string;
  player_name: string;
  wins: number;
  total_loot_created: number;
  total_votes_received: number;
  win_percentage: number;
}
