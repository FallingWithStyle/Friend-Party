'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMinigameAccess, useMinigameSession } from '@/hooks';
import { MinigameType } from '@/types/minigame';
import { minigameFramework } from '@/lib/minigameFramework';

// Import specific minigame components
import { DragonsHoardGame } from '@/components/minigame/DragonsHoardGame';

interface MinigamePageProps {
  params: {
    id: string;
    type: string;
  };
}

export default function MinigamePage({ params }: MinigamePageProps) {
  const router = useRouter();
  const { id: partyId, type: minigameType } = params;
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if minigames are available for this party
  const { access, loading: accessLoading } = useMinigameAccess(partyId);
  
  // Get session data if we have a session ID
  const {
    session,
    participants,
    rewards,
    loading: sessionLoading,
    error: sessionError,
    updateSession,
    joinSession,
    leaveSession,
    awardReward,
    completeSession
  } = useMinigameSession(sessionId);

  // Initialize or join minigame session
  useEffect(() => {
    const initializeMinigame = async () => {
      if (accessLoading || !access) return;

      if (!access.canPlay) {
        setError(access.reason || 'Minigames not available');
        setLoading(false);
        return;
      }

      if (!access.availableMinigames.includes(minigameType as MinigameType)) {
        setError(`Minigame type '${minigameType}' is not available`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if there's already an active session for this party and minigame type
        const { data: existingSessions } = await minigameFramework.getSession(partyId);
        
        if (existingSessions && existingSessions.status === 'active') {
          setSessionId(existingSessions.id);
        } else {
          // Create new session
          const newSession = await minigameFramework.createSession(
            partyId,
            minigameType as MinigameType
          );
          setSessionId(newSession.id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize minigame';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeMinigame();
  }, [partyId, minigameType, access, accessLoading]);

  // Handle session updates
  const handleSessionUpdate = async (updates: any) => {
    if (!sessionId) return;
    await updateSession(updates);
  };

  // Handle participant updates
  const handleParticipantUpdate = async (participant: any) => {
    // This would typically update participant data
    console.log('Participant update:', participant);
  };

  // Handle reward awarding
  const handleRewardAwarded = async (reward: any) => {
    if (!sessionId) return;
    await awardReward(reward.user_id, reward.reward_type, reward.reward_data);
  };

  // Render loading state
  if (loading || accessLoading || sessionLoading) {
    return (
      <div className="minigame-loading">
        <div className="loading-spinner"></div>
        <p>Loading minigame...</p>
      </div>
    );
  }

  // Render error state
  if (error || sessionError) {
    return (
      <div className="minigame-error">
        <h2>Error</h2>
        <p>{error || sessionError}</p>
        <button onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    );
  }

  // Render access denied
  if (!access?.canPlay) {
    return (
      <div className="minigame-access-denied">
        <h2>Minigames Not Available</h2>
        <p>{access?.reason || 'Minigames are not available for this party'}</p>
        <button onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    );
  }

  // Render minigame not found
  if (!session) {
    return (
      <div className="minigame-not-found">
        <h2>Minigame Not Found</h2>
        <p>The requested minigame session could not be found.</p>
        <button onClick={() => router.back()}>
          Go Back
        </button>
      </div>
    );
  }

  // Render specific minigame based on type
  const renderMinigame = () => {
    switch (minigameType) {
      case 'dragons_hoard':
        return (
          <DragonsHoardGame
            session={session}
            participants={participants}
            onSessionUpdate={handleSessionUpdate}
            onParticipantUpdate={handleParticipantUpdate}
            onRewardAwarded={handleRewardAwarded}
          />
        );
      case 'changeling':
        return (
          <div className="minigame-coming-soon">
            <h2>Changeling Minigame</h2>
            <p>Coming soon! This minigame is not yet implemented.</p>
          </div>
        );
      default:
        return (
          <div className="minigame-unknown">
            <h2>Unknown Minigame</h2>
            <p>The minigame type '{minigameType}' is not recognized.</p>
          </div>
        );
    }
  };

  return (
    <div className="minigame-page">
      {renderMinigame()}
    </div>
  );
}
