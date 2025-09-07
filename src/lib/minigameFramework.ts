import { createClient } from '@/lib/supabase';
import { 
  MinigameSession, 
  MinigameParticipant, 
  MinigameReward, 
  MinigameConfig, 
  MinigameType, 
  RewardType, 
  MinigameAccess,
  MinigameFrameworkService 
} from '@/types/minigame';

const supabase = createClient();

/**
 * Minigame Framework Service
 * Provides core functionality for managing minigames across the application
 */
export class MinigameFrameworkService implements MinigameFrameworkService {
  
  // Session Management
  async createSession(partyId: string, minigameType: MinigameType, gameData?: Record<string, any>): Promise<MinigameSession> {
    const { data, error } = await supabase
      .from('minigame_sessions')
      .insert({
        party_id: partyId,
        minigame_type: minigameType,
        game_data: gameData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create minigame session: ${error.message}`);
    }

    return data;
  }

  async getSession(sessionId: string): Promise<MinigameSession | null> {
    const { data, error } = await supabase
      .from('minigame_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Session not found
      }
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return data;
  }

  async updateSession(sessionId: string, updates: Partial<MinigameSession>): Promise<void> {
    const { error } = await supabase
      .from('minigame_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  async completeSession(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }

  // Participant Management
  async joinSession(sessionId: string, userId: string, participantData?: Record<string, any>): Promise<MinigameParticipant> {
    const { data, error } = await supabase
      .from('minigame_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        participant_data: participantData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to join session: ${error.message}`);
    }

    return data;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('minigame_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to leave session: ${error.message}`);
    }
  }

  async getParticipants(sessionId: string): Promise<MinigameParticipant[]> {
    const { data, error } = await supabase
      .from('minigame_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch participants: ${error.message}`);
    }

    return data || [];
  }

  // Reward Management
  async awardReward(sessionId: string, userId: string, rewardType: RewardType, rewardData: Record<string, any>): Promise<MinigameReward> {
    const { data, error } = await supabase
      .from('minigame_rewards')
      .insert({
        session_id: sessionId,
        user_id: userId,
        reward_type: rewardType,
        reward_data: rewardData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to award reward: ${error.message}`);
    }

    return data;
  }

  async getRewards(sessionId: string): Promise<MinigameReward[]> {
    const { data, error } = await supabase
      .from('minigame_rewards')
      .select('*')
      .eq('session_id', sessionId)
      .order('awarded_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch rewards: ${error.message}`);
    }

    return data || [];
  }

  // Access Control
  async checkMinigameAccess(partyId: string): Promise<MinigameAccess> {
    // Get all party members
    const { data: members, error: membersError } = await supabase
      .from('party_members')
      .select('id, user_id, first_name, status, is_npc')
      .eq('party_id', partyId);

    if (membersError) {
      throw new Error(`Failed to fetch party members: ${membersError.message}`);
    }

    if (!members || members.length === 0) {
      return { canPlay: false, reason: 'No party members found', availableMinigames: [] };
    }

    // Filter out hirelings (NPCs) for assessment completion check
    const nonHirelingMembers = members.filter(member => !member.is_npc);
    
    if (nonHirelingMembers.length === 0) {
      return { canPlay: false, reason: 'No non-hireling members found', availableMinigames: [] };
    }

    // Check if all non-hireling members have completed assessments
    const allCompleted = nonHirelingMembers.every(member => member.status === 'Finished');
    
    if (!allCompleted) {
      const incompleteMembers = nonHirelingMembers
        .filter(member => member.status !== 'Finished')
        .map(member => member.first_name);
      
      return { 
        canPlay: false, 
        reason: `Waiting for ${incompleteMembers.join(', ')} to complete assessments`,
        availableMinigames: []
      };
    }

    // For now, all minigames are available if assessments are complete
    const availableMinigames: MinigameType[] = ['dragons_hoard'];

    return {
      canPlay: true,
      availableMinigames
    };
  }

  // Configuration
  async getConfig(minigameType: MinigameType, configKey: string): Promise<MinigameConfig | null> {
    const { data, error } = await supabase
      .from('minigame_config')
      .select('*')
      .eq('minigame_type', minigameType)
      .eq('config_key', configKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Config not found
      }
      throw new Error(`Failed to fetch config: ${error.message}`);
    }

    return data;
  }

  async setConfig(minigameType: MinigameType, configKey: string, configValue: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('minigame_config')
      .upsert({
        minigame_type: minigameType,
        config_key: configKey,
        config_value: configValue
      });

    if (error) {
      throw new Error(`Failed to set config: ${error.message}`);
    }
  }
}

// Export singleton instance
export const minigameFramework = new MinigameFrameworkService();
