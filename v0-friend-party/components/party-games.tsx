"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Player {
  id: string
  name: string
  score: number
  avatar: string
}

interface PartyGamesProps {
  players: Player[]
  onBack: () => void
}

export function PartyGames({ players, onBack }: PartyGamesProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const games = [
    {
      id: "reaction",
      title: "⚡ Reaction Time",
      description: "Test your reflexes! Click when the screen turns green.",
      color: "from-green-400 to-emerald-500",
    },
    {
      id: "memory",
      title: "🧠 Memory Match",
      description: "Remember the sequence and repeat it back.",
      color: "from-blue-400 to-cyan-500",
    },
    {
      id: "typing",
      title: "⌨️ Speed Typing",
      description: "Type the words as fast as you can!",
      color: "from-purple-400 to-pink-500",
    },
    {
      id: "trivia",
      title: "🤔 Lightning Trivia",
      description: "Quick-fire questions for bonus points.",
      color: "from-orange-400 to-red-500",
    },
  ]

  if (selectedGame) {
    return (
      <div className="text-center">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{games.find((g) => g.id === selectedGame)?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">Game implementation coming soon!</p>
            <p className="text-gray-600 mb-6">This is where the {selectedGame} mini-game would be implemented.</p>
            <Button onClick={() => setSelectedGame(null)} variant="outline">
              ← Back to Games
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-purple-800 mb-4">🎮 Mini-Games</h2>
        <p className="text-lg text-gray-700">Choose a game to play with your friends!</p>
      </div>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {games.map((game) => (
          <Card
            key={game.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedGame(game.id)}
          >
            <CardHeader>
              <CardTitle className={`text-xl bg-gradient-to-r ${game.color} bg-clip-text text-transparent`}>
                {game.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{game.description}</p>
              <Badge variant="secondary">{players.length} players ready</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Button onClick={onBack} variant="outline" size="lg">
          ← Back to Party Room
        </Button>
      </div>
    </div>
  )
}
