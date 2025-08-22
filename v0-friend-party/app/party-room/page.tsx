"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Confetti } from "@/components/confetti"
import { PartyGames } from "@/components/party-games"

interface Player {
  id: string
  name: string
  adventurer_name: string
  selfAssessmentScore: number
  peerAssessmentScore: number
  overallScore: number
  avatar: string
  strengths: string[]
  growthAreas: string[]
}

export default function PartyRoomPage() {
  const [showConfetti, setShowConfetti] = useState(true)
  const [showGames, setShowGames] = useState(false)

  const [players] = useState<Player[]>([
    {
      id: "1",
      name: "Gandalf",
      adventurer_name: "Gandalf the Grey",
      selfAssessmentScore: 4.2,
      peerAssessmentScore: 4.8,
      overallScore: 4.5,
      avatar: "G",
      strengths: ["Leadership", "Communication", "Wisdom"],
      growthAreas: ["Adaptability"],
    },
    {
      id: "2",
      name: "Legolas",
      adventurer_name: "Legolas Greenleaf",
      selfAssessmentScore: 4.0,
      peerAssessmentScore: 4.6,
      overallScore: 4.3,
      avatar: "L",
      strengths: ["Teamwork", "Resilience", "Focus"],
      growthAreas: ["Initiative"],
    },
    {
      id: "3",
      name: "Gimli",
      adventurer_name: "Gimli son of Glóin",
      selfAssessmentScore: 3.8,
      peerAssessmentScore: 4.2,
      overallScore: 4.0,
      avatar: "G",
      strengths: ["Resilience", "Loyalty"],
      growthAreas: ["Communication", "Adaptability"],
    },
    {
      id: "4",
      name: "Aragorn",
      adventurer_name: "Strider",
      selfAssessmentScore: 4.4,
      peerAssessmentScore: 4.7,
      overallScore: 4.6,
      avatar: "A",
      strengths: ["Leadership", "Adaptability", "Initiative"],
      growthAreas: ["Self-confidence"],
    },
    {
      id: "5",
      name: "Frodo",
      adventurer_name: "Frodo Baggins",
      selfAssessmentScore: 3.6,
      peerAssessmentScore: 4.4,
      overallScore: 4.0,
      avatar: "F",
      strengths: ["Resilience", "Determination"],
      growthAreas: ["Leadership", "Communication"],
    },
  ])

  const winner = players.reduce((prev, current) => (prev.overallScore > current.overallScore ? prev : current))

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen relative">
      {showConfetti && <Confetti />}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 mb-4 drop-shadow-lg">
            🏆 Assessment Complete! 🏆
          </h1>
          <p className="text-2xl text-amber-200 font-serif italic">
            "The fellowship has been evaluated! Behold thy strengths and growth!"
          </p>
        </div>

        {!showGames ? (
          <>
            {/* Winner Announcement */}
            <div className="fantasy-card ornate-border p-8 mb-8 max-w-3xl mx-auto magical-glow">
              <div className="text-center">
                <h2 className="text-4xl font-sans font-bold text-amber-300 mb-6">👑 Most Well-Rounded Hero 👑</h2>
                <Avatar className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-amber-300">
                  <AvatarFallback className="text-3xl font-bold text-amber-900">{winner.avatar}</AvatarFallback>
                </Avatar>
                <h3 className="text-3xl font-serif font-bold text-amber-200 mb-2">{winner.adventurer_name}</h3>
                <p className="text-lg text-amber-300 mb-4">({winner.name})</p>
                <Badge className="text-xl px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-amber-900 font-bold border-2 border-amber-300">
                  ⭐ {winner.overallScore.toFixed(1)}/5.0 Overall Score ⭐
                </Badge>
                <div className="mt-4 text-amber-200">
                  <p className="font-serif">
                    <strong>Top Strengths:</strong> {winner.strengths.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Assessment Results */}
            <div className="fantasy-card ornate-border p-8 mb-8 max-w-5xl mx-auto">
              <h2 className="text-center text-3xl font-sans font-bold text-amber-300 mb-8">
                📜 Fellowship Assessment Results 📜
              </h2>
              <div className="space-y-6">
                {players
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className="p-6 rounded-lg bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-700"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Badge
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-amber-900"
                                : "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-200"
                            }`}
                          >
                            {index + 1}
                          </Badge>
                          <Avatar className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-500">
                            <AvatarFallback className="text-amber-200 font-bold text-lg">
                              {player.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-serif font-bold text-xl text-amber-200">{player.adventurer_name}</h3>
                            <p className="text-amber-300 text-sm">({player.name})</p>
                          </div>
                        </div>
                        <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-800 text-amber-200 border border-amber-600">
                          {player.overallScore.toFixed(1)}/5.0
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-amber-300 mb-2">
                            <strong>Self Assessment:</strong> {player.selfAssessmentScore.toFixed(1)}/5.0
                          </p>
                          <p className="text-amber-300 mb-2">
                            <strong>Peer Assessment:</strong> {player.peerAssessmentScore.toFixed(1)}/5.0
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-300 mb-2">
                            <strong>Strengths:</strong> {player.strengths.join(", ")}
                          </p>
                          <p className="text-amber-300">
                            <strong>Growth Areas:</strong> {player.growthAreas.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Party Actions */}
            <div className="text-center space-y-6">
              <Button
                size="lg"
                className="fantasy-button px-10 py-4 text-xl font-serif font-bold"
                onClick={() => setShowGames(true)}
              >
                🎮 Enter the Arena of Games 🎮
              </Button>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button className="fantasy-button px-6 py-3 font-serif font-bold">📊 View Detailed Reports</Button>
                <Button className="fantasy-button px-6 py-3 font-serif font-bold">🔄 Start New Assessment</Button>
              </div>
            </div>
          </>
        ) : (
          <PartyGames
            players={players.map((p) => ({
              id: p.id,
              name: p.adventurer_name,
              score: Math.round(p.overallScore * 20), // Convert to 0-100 scale for games
              avatar: p.avatar,
            }))}
            onBack={() => setShowGames(false)}
          />
        )}
      </div>
    </div>
  )
}
