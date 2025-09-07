'use client';

import React, { useState } from 'react';
import { ResultsDisplayProps } from '@/types/dragonsHoard';

export function ResultsDisplay({
  matchups,
  winningLoot,
  onAddToHoard,
  onPlayAgain
}: ResultsDisplayProps) {
  const [hoardAdded, setHoardAdded] = useState(false);
  const [isAddingToHoard, setIsAddingToHoard] = useState(false);

  const handleAddToHoard = async () => {
    if (hoardAdded || isAddingToHoard) return;

    try {
      setIsAddingToHoard(true);
      
      // Add each winning loot item to the hoard
      for (const loot of winningLoot) {
        await onAddToHoard(loot.id);
      }
      
      setHoardAdded(true);
    } catch (error) {
      console.error('Failed to add loot to hoard:', error);
    } finally {
      setIsAddingToHoard(false);
    }
  };

  const getWinnerStats = () => {
    const winnerCounts: Record<string, number> = {};
    
    matchups.forEach(matchup => {
      const lootAVotes = matchup.votes.filter(v => v.voted_for_loot_id === matchup.loot_a_id).length;
      const lootBVotes = matchup.votes.filter(v => v.voted_for_loot_id === matchup.loot_b_id).length;
      
      if (lootAVotes > lootBVotes) {
        winnerCounts[matchup.loot_a.creator_name] = (winnerCounts[matchup.loot_a.creator_name] || 0) + 1;
      } else if (lootBVotes > lootAVotes) {
        winnerCounts[matchup.loot_b.creator_name] = (winnerCounts[matchup.loot_b.creator_name] || 0) + 1;
      }
    });

    return winnerCounts;
  };

  const winnerStats = getWinnerStats();
  const topWinner = Object.entries(winnerStats).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);

  return (
    <div className="results-display">
      <div className="results-header">
        <h2>🏆 Dragon's Hoard Results</h2>
        <p>The voting is complete! Here are the winning loot items.</p>
      </div>

      <div className="winner-stats">
        <h3>Champion Hoarder</h3>
        <div className="champion">
          <span className="champion-name">{topWinner[0]}</span>
          <span className="champion-wins">{topWinner[1]} win{topWinner[1] !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="winning-loot">
        <h3>Winning Loot Items</h3>
        <div className="loot-grid">
          {winningLoot.map((loot, index) => (
            <div key={loot.id} className="winning-loot-item">
              <div className="loot-rank">#{index + 1}</div>
              <div className="loot-details">
                <h4 className="loot-name">{loot.name}</h4>
                <div className="loot-meta">
                  <span className="loot-category">
                    {loot.prompt.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="loot-creator">
                    by {loot.creator_name}
                  </span>
                </div>
                {loot.description && (
                  <p className="loot-description">{loot.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="matchup-summary">
        <h3>Matchup Results</h3>
        <div className="matchup-list">
          {matchups.map((matchup, index) => {
            const lootAVotes = matchup.votes.filter(v => v.voted_for_loot_id === matchup.loot_a_id).length;
            const lootBVotes = matchup.votes.filter(v => v.voted_for_loot_id === matchup.loot_b_id).length;
            const winner = lootAVotes > lootBVotes ? matchup.loot_a : matchup.loot_b;
            
            return (
              <div key={matchup.id} className="matchup-result">
                <div className="matchup-round">Round {matchup.round_number}</div>
                <div className="matchup-winner">
                  🏆 <strong>{winner.name}</strong> wins
                </div>
                <div className="matchup-score">
                  {lootAVotes} - {lootBVotes}
                  {matchup.vote_counts.dragon_vote && (
                    <span className="dragon-vote"> (Dragon vote)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hoard-actions">
        <h3>Add to Party Hoard</h3>
        <p>These winning loot items will be added to your party's permanent collection!</p>
        
        <button
          onClick={handleAddToHoard}
          disabled={hoardAdded || isAddingToHoard}
          className={`add-to-hoard-btn ${hoardAdded ? 'added' : ''}`}
        >
          {isAddingToHoard ? 'Adding to Hoard...' : 
           hoardAdded ? '✓ Added to Hoard!' : 
           'Add to Party Hoard'}
        </button>
      </div>

      <div className="play-again-section">
        <h3>Play Again?</h3>
        <p>Ready for another round of Dragon's Hoard?</p>
        <button
          onClick={onPlayAgain}
          className="play-again-btn"
        >
          Play Again
        </button>
      </div>

      <div className="results-footer">
        <p>Thanks for playing Dragon's Hoard! Your party's collection grows stronger.</p>
      </div>
    </div>
  );
}
