import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { MinigameSession, MinigameParticipant, MinigameReward, RewardType, UseMinigameSessionReturn } from '@/types/minigame';

const supabase = createClient();

/**
 * Hook to manage minigame sessions, participants, and rewards
 */
export function useMinigameSession(sessionId: string | null): UseMinigameSessionReturn {
  const [session, setSession] = useState<MinigameSession | null>(null);
  const [participants, setParticipants] = useState<MinigameParticipant[]>([]);
  const [rewards, setRewards] = useState<MinigameReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionData = async () => {
    if (!sessionId) {
      setSession(null);
      setParticipants([]);
      setRewards([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('minigame_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw new Error(`Failed to fetch session: ${sessionError.message}`);
      }

      setSession(sessionData);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('minigame_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (participantsError) {
        throw new Error(`Failed to fetch participants: ${participantsError.message}`);
      }

      setParticipants(participantsData || []);

      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('minigame_rewards')
        .select('*')
        .eq('session_id', sessionId)
        .order('awarded_at', { ascending: true });

      if (rewardsError) {
        throw new Error(`Failed to fetch rewards: ${rewardsError.message}`);
      }

      setRewards(rewardsData || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const updateSession = async (updates: Partial<MinigameSession>) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('minigame_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to update session: ${error.message}`);
      }

      // Update local state
      setSession(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const joinSession = async (userId: string, participantData?: Record<string, any>) => {
    if (!sessionId) return;

    try {
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

      // Update local state
      setParticipants(prev => [...prev, data]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const leaveSession = async (userId: string) => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('minigame_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to leave session: ${error.message}`);
      }

      // Update local state
      setParticipants(prev => 
        prev.map(p => 
          p.user_id === userId 
            ? { ...p, left_at: new Date().toISOString() }
            : p
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const awardReward = async (userId: string, rewardType: RewardType, rewardData: Record<string, any>) => {
    if (!sessionId) return;

    try {
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

      // Update local state
      setRewards(prev => [...prev, data]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('minigame_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to complete session: ${error.message}`);
      }

      // Update local state
      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        completed_at: new Date().toISOString()
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  return {
    session,
    participants,
    rewards,
    loading,
    error,
    updateSession,
    joinSession,
    leaveSession,
    awardReward,
    completeSession
  };
}
