'use client';

import React, { useState, useEffect } from 'react';
import { VotingInterfaceProps } from '@/types/dragonsHoard';
import { LootMatchup } from './LootMatchup';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export function VotingInterface({
  matchups,
  currentMatchupIndex,
  onVote,
  onNextMatchup,
  userVotes,
  disabled = false
}: VotingInterfaceProps) {
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds per matchup
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMatchup = matchups[currentMatchupIndex];
  const userVote = currentMatchup ? userVotes[currentMatchup.id] : undefined;
  const isLastMatchup = currentMatchupIndex >= matchups.length - 1;

  // Timer for voting
  useEffect(() => {
    if (!currentMatchup || currentMatchup.status === 'completed') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto-advance if not voted
          if (!userVote) {
            handleAutoAdvance();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentMatchup, userVote]);

  const handleVote = async (lootId: string) => {
    if (disabled || isVoting || !currentMatchup) return;

    try {
      setIsVoting(true);
      setError(null);

      // Submit vote to database
      const { error: voteError } = await supabase
        .from('dragons_hoard_votes')
        .insert({
          matchup_id: currentMatchup.id,
          voted_for_loot_id: lootId
        });

      if (voteError) {
        throw new Error(`Failed to submit vote: ${voteError.message}`);
      }

      // Call parent callback
      onVote(currentMatchup.id, lootId);

      // Auto-advance after a short delay
      setTimeout(() => {
        if (!isLastMatchup) {
          onNextMatchup();
        }
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAutoAdvance = () => {
    if (!isLastMatchup) {
      onNextMatchup();
    }
  };

  const handleNext = () => {
    if (isLastMatchup) {
      // All matchups complete
      return;
    }
    onNextMatchup();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentMatchup) {
    return (
      <div className="voting-interface error">
        <h3>No Matchup Available</h3>
        <p>There are no matchups to vote on.</p>
      </div>
    );
  }

  return (
    <div className="voting-interface">
      <div className="voting-header">
        <h2>Vote on the Best Loot!</h2>
        <div className="voting-progress">
          <span className="current-round">
            Round {currentMatchupIndex + 1} of {matchups.length}
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentMatchupIndex + 1) / matchups.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="voting-timer">
        {currentMatchup.status === 'pending' && !userVote && (
          <div className="timer">
            <span className="timer-label">Time remaining:</span>
            <span className={`timer-value ${timeRemaining <= 10 ? 'warning' : ''}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
        
        {userVote && (
          <div className="voted-indicator">
            ✓ You've voted! Waiting for others...
          </div>
        )}
      </div>

      <LootMatchup
        matchup={currentMatchup}
        onVote={handleVote}
        userVote={userVote}
        disabled={disabled || isVoting}
      />

      <div className="voting-actions">
        {currentMatchup.status === 'completed' && (
          <button
            onClick={handleNext}
            disabled={disabled}
            className="next-matchup-btn"
          >
            {isLastMatchup ? 'View Results' : 'Next Matchup'}
          </button>
        )}
      </div>

      <div className="voting-instructions">
        <h4>How to Vote:</h4>
        <ul>
          <li>Read both loot items carefully</li>
          <li>Consider creativity, humor, and cursed potential</li>
          <li>Click "Vote" on your favorite</li>
          <li>You can only vote once per matchup</li>
        </ul>
      </div>
    </div>
  );
}
