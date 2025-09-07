'use client';

import React, { useState, useEffect } from 'react';
import { BaseMinigameComponent } from './BaseMinigameComponent';
import { PromptDisplay } from './PromptDisplay';
import { LootCreation } from './LootCreation';
import { VotingInterface } from './VotingInterface';
import { ResultsDisplay } from './ResultsDisplay';
import { HoardCollection } from './HoardCollection';
import { 
  DragonsHoardGameProps, 
  DragonsHoardGamePhase, 
  DragonsHoardGameState,
  DragonsHoardPlayerState,
  DragonsHoardConfig 
} from '@/types/dragonsHoard';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export function DragonsHoardGame({
  session,
  participants,
  onSessionUpdate,
  onParticipantUpdate,
  onRewardAwarded
}: DragonsHoardGameProps) {
  const [gameState, setGameState] = useState<DragonsHoardGameState>({
    phase: 'waiting_for_players',
    current_round: 0,
    total_rounds: 0,
    prompts_assigned: false,
    loot_created: false,
    matchups_created: false,
    voting_complete: false,
    results_calculated: false
  });

  const [playerStates, setPlayerStates] = useState<DragonsHoardPlayerState[]>([]);
  const [config, setConfig] = useState<DragonsHoardConfig>({
    prompts_per_player: 2,
    max_rounds: 0,
    voting_timeout_seconds: 30,
    dragon_vote_threshold: 2,
    categories_enabled: ['goblin_market', 'dragons_hoard', 'wizards_tower', 'rogues_hideout', 'cursed_tomb', 'pirate_underwater', 'giant_forest', 'knight_tavern']
  });

  // Initialize game when component mounts
  useEffect(() => {
    initializeGame();
  }, [session, participants]);

  const initializeGame = async () => {
    if (!session || participants.length === 0) return;

    try {
      // Calculate total rounds based on number of participants
      const totalRounds = Math.ceil((participants.length * config.prompts_per_player) / 2);
      
      setGameState(prev => ({
        ...prev,
        total_rounds: totalRounds,
        phase: 'prompt_assignment'
      }));

      // Initialize player states
      const initialPlayerStates: DragonsHoardPlayerState[] = participants.map(participant => ({
        user_id: participant.user_id,
        name: participant.participant_data?.display_name || `Player ${participant.user_id.slice(0, 8)}`,
        prompts: [],
        loot_items: [],
        has_created_loot: false,
        has_voted: false,
        wins: 0,
        total_votes_received: 0
      }));

      setPlayerStates(initialPlayerStates);

      // Update session with game data
      onSessionUpdate({
        game_data: {
          phase: 'prompt_assignment',
          total_rounds: totalRounds,
          player_states: initialPlayerStates
        }
      });

    } catch (error) {
      console.error('Failed to initialize Dragon\'s Hoard game:', error);
    }
  };

  const handlePromptsReady = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'loot_creation',
      prompts_assigned: true
    }));

    onSessionUpdate({
      game_data: {
        ...session.game_data,
        phase: 'loot_creation',
        prompts_assigned: true
      }
    });
  };

  const handleLootCreated = (loot: any) => {
    // Update player state
    setPlayerStates(prev => prev.map(player => 
      player.user_id === loot.creator_id
        ? {
            ...player,
            loot_items: [...player.loot_items, loot],
            has_created_loot: true
          }
        : player
    ));

    // Check if all players have created their loot
    const allLootCreated = playerStates.every(player => 
      player.loot_items.length >= config.prompts_per_player
    );

    if (allLootCreated) {
      setGameState(prev => ({
        ...prev,
        phase: 'pairing',
        loot_created: true
      }));

      createMatchups();
    }
  };

  const createMatchups = async () => {
    try {
      // Get all loot items for this session
      const { data: lootItems } = await supabase
        .from('dragons_hoard_loot')
        .select('*')
        .eq('session_id', session.id);

      if (!lootItems || lootItems.length === 0) return;

      // Create round-robin matchups
      const matchups = [];
      for (let i = 0; i < lootItems.length; i += 2) {
        if (i + 1 < lootItems.length) {
          matchups.push({
            session_id: session.id,
            loot_a_id: lootItems[i].id,
            loot_b_id: lootItems[i + 1].id,
            round_number: Math.floor(i / 2) + 1,
            status: 'pending'
          });
        }
      }

      // Insert matchups into database
      const { error } = await supabase
        .from('dragons_hoard_matchups')
        .insert(matchups);

      if (error) {
        throw new Error(`Failed to create matchups: ${error.message}`);
      }

      setGameState(prev => ({
        ...prev,
        phase: 'voting',
        matchups_created: true,
        current_round: 1
      }));

      onSessionUpdate({
        game_data: {
          ...session.game_data,
          phase: 'voting',
          matchups_created: true,
          current_round: 1
        }
      });

    } catch (error) {
      console.error('Failed to create matchups:', error);
    }
  };

  const handleVotingComplete = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'results',
      voting_complete: true
    }));

    onSessionUpdate({
      game_data: {
        ...session.game_data,
        phase: 'results',
        voting_complete: true
      }
    });

    calculateResults();
  };

  const calculateResults = async () => {
    try {
      // Get all matchups with votes
      const { data: matchups } = await supabase
        .from('dragons_hoard_matchups')
        .select(`
          *,
          dragons_hoard_votes(*)
        `)
        .eq('session_id', session.id);

      if (!matchups) return;

      const winningLoot = [];
      const updatedPlayerStates = [...playerStates];

      // Process each matchup
      for (const matchup of matchups) {
        const votes = matchup.dragons_hoard_votes || [];
        const lootAVotes = votes.filter((v: any) => v.voted_for_loot_id === matchup.loot_a_id).length;
        const lootBVotes = votes.filter((v: any) => v.voted_for_loot_id === matchup.loot_b_id).length;

        // Determine winner (with dragon vote tiebreaker if needed)
        let winnerId: string;
        if (lootAVotes > lootBVotes) {
          winnerId = matchup.loot_a_id;
        } else if (lootBVotes > lootAVotes) {
          winnerId = matchup.loot_b_id;
        } else {
          // Dragon vote tiebreaker
          winnerId = Math.random() < 0.5 ? matchup.loot_a_id : matchup.loot_b_id;
        }

        winningLoot.push(winnerId);

        // Update player stats
        const winnerLoot = await supabase
          .from('dragons_hoard_loot')
          .select('creator_id')
          .eq('id', winnerId)
          .single();

        if (winnerLoot.data) {
          const winnerIndex = updatedPlayerStates.findIndex(p => p.user_id === winnerLoot.data.creator_id);
          if (winnerIndex !== -1) {
            updatedPlayerStates[winnerIndex].wins += 1;
          }
        }
      }

      setPlayerStates(updatedPlayerStates);

      setGameState(prev => ({
        ...prev,
        phase: 'completed',
        results_calculated: true
      }));

      onSessionUpdate({
        game_data: {
          ...session.game_data,
          phase: 'completed',
          results_calculated: true,
          winning_loot: winningLoot,
          player_states: updatedPlayerStates
        }
      });

      // Award rewards
      awardRewards(updatedPlayerStates);

    } catch (error) {
      console.error('Failed to calculate results:', error);
    }
  };

  const awardRewards = (playerStates: DragonsHoardPlayerState[]) => {
    playerStates.forEach(player => {
      // Award XP for participation
      onRewardAwarded({
        user_id: player.user_id,
        reward_type: 'xp',
        reward_data: { amount: 10, reason: 'Dragon\'s Hoard participation' }
      });

      // Award XP for wins
      if (player.wins > 0) {
        onRewardAwarded({
          user_id: player.user_id,
          reward_type: 'xp',
          reward_data: { amount: player.wins * 5, reason: 'Dragon\'s Hoard wins' }
        });
      }

      // Award achievement for creative loot
      if (player.loot_items.length >= config.prompts_per_player) {
        onRewardAwarded({
          user_id: player.user_id,
          reward_type: 'achievement',
          reward_data: { 
            achievement_id: 'dragons_hoard_creative',
            name: 'Creative Hoarder',
            description: 'Created all required loot items'
          }
        });
      }
    });
  };

  const handlePlayAgain = () => {
    // Reset game state for another round
    setGameState({
      phase: 'prompt_assignment',
      current_round: 0,
      total_rounds: 0,
      prompts_assigned: false,
      loot_created: false,
      matchups_created: false,
      voting_complete: false,
      results_calculated: false
    });

    setPlayerStates(prev => prev.map(player => ({
      ...player,
      prompts: [],
      loot_items: [],
      has_created_loot: false,
      has_voted: false
    })));

    initializeGame();
  };

  const renderGameContent = () => {
    switch (gameState.phase) {
      case 'waiting_for_players':
        return (
          <div className="waiting-for-players">
            <h2>Waiting for Players</h2>
            <p>Make sure all party members have joined the minigame.</p>
            <div className="participant-list">
              {participants.map(participant => (
                <div key={participant.id} className="participant">
                  {participant.participant_data?.display_name || `Player ${participant.user_id.slice(0, 8)}`}
                </div>
              ))}
            </div>
          </div>
        );

      case 'prompt_assignment':
        return (
          <PromptDisplay
            prompts={[]} // This would be populated from the database
            onPromptsReady={handlePromptsReady}
          />
        );

      case 'loot_creation':
        return (
          <LootCreation
            prompts={[]} // This would be populated from the database
            onLootCreated={handleLootCreated}
          />
        );

      case 'voting':
        return (
          <VotingInterface
            matchups={[]} // This would be populated from the database
            currentMatchupIndex={gameState.current_round - 1}
            onVote={() => {}} // This would handle voting
            onNextMatchup={() => {}} // This would advance to next matchup
            userVotes={{}}
          />
        );

      case 'results':
        return (
          <ResultsDisplay
            matchups={[]} // This would be populated from the database
            winningLoot={[]} // This would be populated from results
            onAddToHoard={() => {}} // This would add loot to party hoard
            onPlayAgain={handlePlayAgain}
          />
        );

      case 'completed':
        return (
          <div className="game-completed">
            <h2>Game Completed!</h2>
            <p>Thanks for playing Dragon's Hoard!</p>
            <HoardCollection
              partyId={session.party_id}
              hoard={[]} // This would be populated from the database
              lootDetails={[]} // This would be populated from the database
            />
            <button onClick={handlePlayAgain} className="play-again-btn">
              Play Again
            </button>
          </div>
        );

      default:
        return <div>Unknown game phase</div>;
    }
  };

  return (
    <BaseMinigameComponent
      session={session}
      participants={participants}
      onSessionUpdate={onSessionUpdate}
      onParticipantUpdate={onParticipantUpdate}
      onRewardAwarded={onRewardAwarded}
      title="Dragon's Hoard"
      description="Create cursed loot items and vote on the best ones!"
    >
      {renderGameContent()}
    </BaseMinigameComponent>
  );
}
