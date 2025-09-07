// Minigame Framework Types
// Shared types for all minigames in the Friend-Party ecosystem

export type MinigameType = 'dragons_hoard' | 'changeling' | 'test_minigame';

export type MinigameSessionStatus = 'active' | 'completed' | 'cancelled';

export type RewardType = 'xp' | 'achievement' | 'avatar_part' | 'party_bonus';

// Base minigame session interface
export interface MinigameSession {
  id: string;
  party_id: string;
  minigame_type: MinigameType;
  status: MinigameSessionStatus;
  created_at: string;
  completed_at?: string;
  game_data?: Record<string, any>;
}

// Minigame participant interface
export interface MinigameParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  participant_data?: Record<string, any>;
}

// Minigame reward interface
export interface MinigameReward {
  id: string;
  session_id: string;
  user_id: string;
  reward_type: RewardType;
  reward_data: Record<string, any>;
  awarded_at: string;
}

// Minigame configuration interface
export interface MinigameConfig {
  id: string;
  minigame_type: MinigameType;
  config_key: string;
  config_value: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Minigame access control interface
export interface MinigameAccess {
  canPlay: boolean;
  reason?: string;
  availableMinigames: MinigameType[];
}

// Base minigame component props
export interface BaseMinigameProps {
  session: MinigameSession;
  participants: MinigameParticipant[];
  onSessionUpdate: (session: Partial<MinigameSession>) => void;
  onParticipantUpdate: (participant: Partial<MinigameParticipant>) => void;
  onRewardAwarded: (reward: Omit<MinigameReward, 'id' | 'awarded_at'>) => void;
}

// Minigame framework service interface
export interface MinigameFrameworkService {
  // Session management
  createSession: (partyId: string, minigameType: MinigameType, gameData?: Record<string, any>) => Promise<MinigameSession>;
  getSession: (sessionId: string) => Promise<MinigameSession | null>;
  updateSession: (sessionId: string, updates: Partial<MinigameSession>) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  
  // Participant management
  joinSession: (sessionId: string, userId: string, participantData?: Record<string, any>) => Promise<MinigameParticipant>;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
  getParticipants: (sessionId: string) => Promise<MinigameParticipant[]>;
  
  // Reward management
  awardReward: (sessionId: string, userId: string, rewardType: RewardType, rewardData: Record<string, any>) => Promise<MinigameReward>;
  getRewards: (sessionId: string) => Promise<MinigameReward[]>;
  
  // Access control
  checkMinigameAccess: (partyId: string) => Promise<MinigameAccess>;
  
  // Configuration
  getConfig: (minigameType: MinigameType, configKey: string) => Promise<MinigameConfig | null>;
  setConfig: (minigameType: MinigameType, configKey: string, configValue: Record<string, any>) => Promise<void>;
}

// Hook return types
export interface UseMinigameAccessReturn {
  access: MinigameAccess | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseMinigameSessionReturn {
  session: MinigameSession | null;
  participants: MinigameParticipant[];
  rewards: MinigameReward[];
  loading: boolean;
  error: string | null;
  updateSession: (updates: Partial<MinigameSession>) => Promise<void>;
  joinSession: (userId: string, participantData?: Record<string, any>) => Promise<void>;
  leaveSession: (userId: string) => Promise<void>;
  awardReward: (userId: string, rewardType: RewardType, rewardData: Record<string, any>) => Promise<void>;
  completeSession: () => Promise<void>;
}
