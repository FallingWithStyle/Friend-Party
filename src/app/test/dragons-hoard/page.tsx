'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MinigameConfig {
  type: string;
  name: string;
  description: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
}

interface TestSetup {
  success: boolean;
  minigame: {
    type: string;
    name: string;
    description: string;
    emoji: string;
  };
  party: {
    id: string;
    code: string;
    name: string;
    motto: string;
  };
  session: {
    id: string;
    minigame_type: string;
    status: string;
  };
  participants: Array<{
    user_id: string;
    display_name: string;
    is_npc: boolean;
  }>;
  testInfo: {
    partyUrl: string;
    minigameUrl: string;
    totalPlayers: number;
    npcCount: number;
    minPlayers: number;
    maxPlayers: number;
  };
}

export default function MinigameTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestSetup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableMinigames, setAvailableMinigames] = useState<MinigameConfig[]>([]);
  const [selectedMinigame, setSelectedMinigame] = useState('dragons_hoard');
  const [numPlayers, setNumPlayers] = useState(4);
  const [partyName, setPartyName] = useState('');

  // Load available minigames on component mount
  useEffect(() => {
    fetchAvailableMinigames();
  }, []);

  const fetchAvailableMinigames = async () => {
    try {
      const response = await fetch('/api/test/minigame');
      const data = await response.json();
      if (data.availableMinigames) {
        setAvailableMinigames(data.availableMinigames);
        // Set default party name based on first minigame
        if (data.availableMinigames.length > 0) {
          setPartyName(`Test ${data.availableMinigames[0].name} Party`);
        }
      }
    } catch (err) {
      console.error('Failed to load minigames:', err);
    }
  };

  const createTestSetup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/minigame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minigameType: selectedMinigame,
          numPlayers,
          partyName: partyName || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test setup');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🎮 Minigame Test Setup
          </h1>
          
          <p className="text-gray-600 mb-8">
            Create a test party with NPC players to test any minigame.
            This will set up a party with random fellow players so you can test the full experience.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="minigameType" className="block text-sm font-medium text-gray-700 mb-2">
                Select Minigame
              </label>
              <select
                id="minigameType"
                value={selectedMinigame}
                onChange={(e) => {
                  setSelectedMinigame(e.target.value);
                  const minigame = availableMinigames.find(m => m.type === e.target.value);
                  if (minigame) {
                    setPartyName(`Test ${minigame.name} Party`);
                    setNumPlayers(Math.max(minigame.minPlayers, 4));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMinigames.map(minigame => (
                  <option key={minigame.type} value={minigame.type}>
                    {minigame.emoji} {minigame.name} - {minigame.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="numPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Players
              </label>
              <select
                id="numPlayers"
                value={numPlayers}
                onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableMinigames.find(m => m.type === selectedMinigame) && 
                  Array.from({ length: availableMinigames.find(m => m.type === selectedMinigame)!.maxPlayers - availableMinigames.find(m => m.type === selectedMinigame)!.minPlayers + 1 }, (_, i) => {
                    const value = availableMinigames.find(m => m.type === selectedMinigame)!.minPlayers + i;
                    return (
                      <option key={value} value={value}>
                        {value} Player{value !== 1 ? 's' : ''}
                      </option>
                    );
                  })
                }
              </select>
            </div>

            <div>
              <label htmlFor="partyName" className="block text-sm font-medium text-gray-700 mb-2">
                Party Name (Optional)
              </label>
              <input
                type="text"
                id="partyName"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a custom party name"
              />
            </div>

            <button
              onClick={createTestSetup}
              disabled={loading || availableMinigames.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Creating Test Setup...' : `Create Test Party & Start ${availableMinigames.find(m => m.type === selectedMinigame)?.name || 'Minigame'}`}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-green-800 font-medium text-lg">✅ Test Setup Created Successfully!</h3>
                <p className="text-green-700">
                  Your test party has been created for <strong>{result.minigame.emoji} {result.minigame.name}</strong> with {result.testInfo.totalPlayers} players 
                  ({result.testInfo.npcCount} NPCs + you as the leader).
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {result.minigame.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Party Details</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>Name:</strong> {result.party.name}</li>
                    <li><strong>Code:</strong> {result.party.code}</li>
                    <li><strong>Motto:</strong> {result.party.motto}</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Players</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {result.participants.map((participant, index) => (
                      <li key={participant.user_id}>
                        <strong>{participant.display_name}</strong>
                        {participant.is_npc && <span className="text-blue-600 ml-1">(NPC)</span>}
                        {index === 0 && <span className="text-green-600 ml-1">(Leader)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={result.testInfo.partyUrl}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 text-center font-medium"
                >
                  🏠 Go to Party Lobby
                </Link>
                <Link
                  href={result.testInfo.minigameUrl}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 text-center font-medium"
                >
                  {result.minigame.emoji} Start {result.minigame.name}
                </Link>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Test Instructions</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Click "Start {result.minigame.name}" to begin testing</li>
                  <li>Follow the minigame instructions and prompts</li>
                  <li>Interact with the NPC players as if they were real players</li>
                  <li>Test all the minigame features and mechanics</li>
                  <li>Check that rewards and achievements work correctly</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
