'use client';

import React from 'react';
import { LootMatchupProps } from '@/types/dragonsHoard';

// Helper function to format category names for display
const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'goblin_market': 'Goblin Market',
    'dragons_hoard': 'Dragon\'s Hoard',
    'wizards_tower': 'Wizard\'s Tower',
    'rogues_hideout': 'Rogue\'s Hideout',
    'cursed_tomb': 'Cursed Tomb',
    'pirate_underwater': 'Pirate & Underwater',
    'giant_forest': 'Giant & Forest',
    'knight_tavern': 'Knight & Tavern'
  };
  
  return categoryMap[category] || category.replace('_', ' ').toUpperCase();
};

export function LootMatchup({ 
  matchup, 
  onVote, 
  userVote, 
  disabled = false 
}: LootMatchupProps) {
  const handleVote = (lootId: string) => {
    if (disabled || userVote) return;
    onVote(lootId);
  };

  const getVoteCounts = () => {
    const lootAVotes = matchup.votes.filter(v => v.voted_for_loot_id === matchup.loot_a_id).length;
    const lootBVotes = matchup.votes.filter(v => v.voted_for_loot_id === matchup.loot_b_id).length;
    
    return {
      loot_a: lootAVotes,
      loot_b: lootBVotes,
      total: lootAVotes + lootBVotes
    };
  };

  const voteCounts = getVoteCounts();
  const isVotingComplete = matchup.status === 'completed';
  const winner = voteCounts.loot_a > voteCounts.loot_b ? 'a' : 
                 voteCounts.loot_b > voteCounts.loot_a ? 'b' : 
                 matchup.vote_counts.dragon_vote;

  // Get the categories for both loot items
  const categoryA = formatCategoryName(matchup.loot_a.prompt.category);
  const categoryB = formatCategoryName(matchup.loot_b.prompt.category);
  const categoriesMatch = matchup.loot_a.prompt.category === matchup.loot_b.prompt.category;

  return (
    <div className="loot-matchup">
      <div className="matchup-header">
        <h3>Round {matchup.round_number}</h3>
        <div className="matchup-status">
          {isVotingComplete ? (
            <span className="status-completed">✓ Voting Complete</span>
          ) : (
            <span className="status-voting">🗳️ Vote Now</span>
          )}
        </div>
      </div>

      {/* Category Display */}
      <div className="category-display">
        <h4>Category: {categoriesMatch ? categoryA : `${categoryA} vs ${categoryB}`}</h4>
        <p className="category-description">
          {categoriesMatch 
            ? `Both items are from the ${categoryA} category`
            : `One item from ${categoryA}, one from ${categoryB}`
          }
        </p>
      </div>

      <div className="loot-comparison">
        {/* Loot Item A */}
        <div className={`loot-item ${winner === 'a' ? 'winner' : ''} ${userVote === matchup.loot_a_id ? 'user-vote' : ''}`}>
          <div className="loot-header">
            <h4>{matchup.loot_a.name}</h4>
            <div className="loot-meta">
              <span className="loot-category">
                {formatCategoryName(matchup.loot_a.prompt.category)}
              </span>
              <span className="loot-creator">
                by {matchup.loot_a.creator_name}
              </span>
            </div>
          </div>
          
          {matchup.loot_a.description && (
            <div className="loot-description">
              {matchup.loot_a.description}
            </div>
          )}

          <div className="loot-footer">
            <div className="vote-count">
              {voteCounts.loot_a} vote{voteCounts.loot_a !== 1 ? 's' : ''}
            </div>
            
            {!isVotingComplete && (
              <button
                onClick={() => handleVote(matchup.loot_a_id)}
                disabled={disabled || userVote !== undefined}
                className={`vote-btn ${userVote === matchup.loot_a_id ? 'voted' : ''}`}
              >
                {userVote === matchup.loot_a_id ? '✓ Voted' : 'Vote'}
              </button>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>

        {/* Loot Item B */}
        <div className={`loot-item ${winner === 'b' ? 'winner' : ''} ${userVote === matchup.loot_b_id ? 'user-vote' : ''}`}>
          <div className="loot-header">
            <h4>{matchup.loot_b.name}</h4>
            <div className="loot-meta">
              <span className="loot-category">
                {formatCategoryName(matchup.loot_b.prompt.category)}
              </span>
              <span className="loot-creator">
                by {matchup.loot_b.creator_name}
              </span>
            </div>
          </div>
          
          {matchup.loot_b.description && (
            <div className="loot-description">
              {matchup.loot_b.description}
            </div>
          )}

          <div className="loot-footer">
            <div className="vote-count">
              {voteCounts.loot_b} vote{voteCounts.loot_b !== 1 ? 's' : ''}
            </div>
            
            {!isVotingComplete && (
              <button
                onClick={() => handleVote(matchup.loot_b_id)}
                disabled={disabled || userVote !== undefined}
                className={`vote-btn ${userVote === matchup.loot_b_id ? 'voted' : ''}`}
              >
                {userVote === matchup.loot_b_id ? '✓ Voted' : 'Vote'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dragon Vote Indicator */}
      {matchup.vote_counts.dragon_vote && (
        <div className="dragon-vote-indicator">
          🐉 The dragon cast the deciding vote!
        </div>
      )}

      {/* Results Summary */}
      {isVotingComplete && (
        <div className="matchup-results">
          <div className="winner-announcement">
            {winner === 'a' ? (
              <p>🏆 <strong>{matchup.loot_a.name}</strong> wins!</p>
            ) : (
              <p>🏆 <strong>{matchup.loot_b.name}</strong> wins!</p>
            )}
          </div>
          <div className="vote-summary">
            Final score: {voteCounts.loot_a} - {voteCounts.loot_b}
            {matchup.vote_counts.dragon_vote && (
              <span className="dragon-vote-note"> (Dragon vote used)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
