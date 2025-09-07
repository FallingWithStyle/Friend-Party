import React, { ReactNode } from 'react';
import { BaseMinigameProps } from '@/types/minigame';

interface BaseMinigameComponentProps extends BaseMinigameProps {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Base component for all minigames
 * Provides common functionality and layout structure
 */
export function BaseMinigameComponent({
  session,
  participants,
  onSessionUpdate,
  onParticipantUpdate,
  onRewardAwarded,
  children,
  title,
  description,
  className = ''
}: BaseMinigameComponentProps) {
  const handleSessionUpdate = (updates: Partial<typeof session>) => {
    onSessionUpdate(updates);
  };

  const handleParticipantUpdate = (participant: Partial<typeof participants[0]>) => {
    onParticipantUpdate(participant);
  };

  const handleRewardAwarded = (reward: Parameters<typeof onRewardAwarded>[0]) => {
    onRewardAwarded(reward);
  };

  return (
    <div className={`minigame-container ${className}`}>
      {/* Minigame Header */}
      <div className="minigame-header">
        <h1 className="minigame-title">{title}</h1>
        {description && (
          <p className="minigame-description">{description}</p>
        )}
        
        {/* Session Status */}
        <div className="minigame-status">
          <span className={`status-badge status-${session.status}`}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
          <span className="participant-count">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Minigame Content */}
      <div className="minigame-content">
        {children}
      </div>

      {/* Minigame Footer */}
      <div className="minigame-footer">
        <div className="minigame-info">
          <span className="minigame-type">
            {session.minigame_type.replace('_', ' ').toUpperCase()}
          </span>
          <span className="session-id">
            Session: {session.id.slice(0, 8)}...
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for minigame-specific functionality
 * Provides common utilities that all minigames can use
 */
export function useMinigameUtils() {
  const formatParticipantName = (participant: typeof participants[0]) => {
    // This would typically fetch the user's display name
    // For now, we'll use a placeholder
    return `Player ${participant.user_id.slice(0, 8)}`;
  };

  const getActiveParticipants = (participants: typeof participants) => {
    return participants.filter(p => !p.left_at);
  };

  const getParticipantById = (participants: typeof participants, userId: string) => {
    return participants.find(p => p.user_id === userId);
  };

  const isParticipantActive = (participant: typeof participants[0]) => {
    return !participant.left_at;
  };

  const getSessionDuration = (session: typeof session) => {
    if (!session.completed_at) {
      return Date.now() - new Date(session.created_at).getTime();
    }
    return new Date(session.completed_at).getTime() - new Date(session.created_at).getTime();
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    formatParticipantName,
    getActiveParticipants,
    getParticipantById,
    isParticipantActive,
    getSessionDuration,
    formatDuration
  };
}
