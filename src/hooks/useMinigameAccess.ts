import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { MinigameAccess, UseMinigameAccessReturn } from '@/types/minigame';

const supabase = createClient();

/**
 * Hook to check if minigames are available for a party
 * Minigames are only available after all non-hireling party members complete assessments
 */
export function useMinigameAccess(partyId: string | null): UseMinigameAccessReturn {
  const [access, setAccess] = useState<MinigameAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = async () => {
    if (!partyId) {
      setAccess({ canPlay: false, reason: 'No party selected', availableMinigames: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all party members
      const { data: members, error: membersError } = await supabase
        .from('party_members')
        .select('id, user_id, first_name, status, is_npc')
        .eq('party_id', partyId);

      if (membersError) {
        throw new Error(`Failed to fetch party members: ${membersError.message}`);
      }

      if (!members || members.length === 0) {
        setAccess({ canPlay: false, reason: 'No party members found', availableMinigames: [] });
        return;
      }

      // Filter out hirelings (NPCs) for assessment completion check
      const nonHirelingMembers = members.filter(member => !member.is_npc);
      
      if (nonHirelingMembers.length === 0) {
        setAccess({ canPlay: false, reason: 'No non-hireling members found', availableMinigames: [] });
        return;
      }

      // Check if all non-hireling members have completed assessments
      const allCompleted = nonHirelingMembers.every(member => member.status === 'Finished');
      
      if (!allCompleted) {
        const incompleteMembers = nonHirelingMembers
          .filter(member => member.status !== 'Finished')
          .map(member => member.first_name);
        
        setAccess({ 
          canPlay: false, 
          reason: `Waiting for ${incompleteMembers.join(', ')} to complete assessments`,
          availableMinigames: []
        });
        return;
      }

      // Check if there are any active minigame sessions
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('minigame_sessions')
        .select('id, minigame_type, status')
        .eq('party_id', partyId)
        .eq('status', 'active');

      if (sessionsError) {
        console.warn('Failed to check active sessions:', sessionsError.message);
      }

      // For now, all minigames are available if assessments are complete
      // In the future, this could be more sophisticated based on party preferences
      const availableMinigames: string[] = ['dragons_hoard'];
      
      // If there are active sessions, we might want to limit available games
      if (activeSessions && activeSessions.length > 0) {
        // For now, allow multiple sessions of the same type
        // This could be configurable per minigame type
      }

      setAccess({
        canPlay: true,
        availableMinigames: availableMinigames as any[]
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setAccess({ canPlay: false, reason: errorMessage, availableMinigames: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [partyId]);

  const refetch = () => {
    checkAccess();
  };

  return {
    access,
    loading,
    error,
    refetch
  };
}
