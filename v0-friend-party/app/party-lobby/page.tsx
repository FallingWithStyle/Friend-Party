"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"

// Mock party members data
const mockPartyMembers = [
  { id: 1, name: "Gandalf the Grey", avatar: "🧙‍♂️", status: "ready", class: "Wizard" },
  { id: 2, name: "Legolas Greenleaf", avatar: "🏹", status: "ready", class: "Ranger" },
  { id: 3, name: "Gimli Ironforge", avatar: "⚔️", status: "waiting", class: "Fighter" },
  { id: 4, name: "Aragorn Strider", avatar: "👑", status: "ready", class: "Paladin" },
  { id: 5, name: "Frodo Baggins", avatar: "💍", status: "waiting", class: "Rogue" },
]

export default function PartyLobby() {
  const [isStarting, setIsStarting] = useState(false)

  const readyCount = mockPartyMembers.filter((member) => member.status === "ready").length
  const totalCount = mockPartyMembers.length

  const handleStartQuest = () => {
    setIsStarting(true)
    // Simulate quest starting
    setTimeout(() => {
      window.location.href = "/quiz"
    }, 2000)
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 mb-4">
            🏰 Party Lobby 🏰
          </h1>
          <p className="text-xl text-amber-200 font-serif italic">"The fellowship gathers before the great quest"</p>
        </div>

        {/* Party Code */}
        <div className="fantasy-card ornate-border p-6 mb-8 max-w-md mx-auto text-center">
          <h2 className="text-xl font-sans font-bold text-amber-300 mb-2">Quest Code</h2>
          <div className="text-3xl font-mono font-bold text-yellow-400 bg-amber-900/30 rounded-lg p-4 border-2 border-amber-600">
            DRAGON42
          </div>
          <p className="text-amber-300 font-serif text-sm mt-2">Share this code with thy companions</p>
        </div>

        {/* Party Members */}
        <div className="fantasy-card ornate-border p-8 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-sans font-bold text-amber-300 mb-6 text-center">
            ⚔️ Fellowship Members ({readyCount}/{totalCount} Ready) ⚔️
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {mockPartyMembers.map((member) => (
              <Card key={member.id} className="fantasy-card p-4 text-center">
                <div className="text-4xl mb-2">{member.avatar}</div>
                <h3 className="font-sans font-bold text-amber-300 mb-1">{member.name}</h3>
                <p className="text-amber-200 font-serif text-sm mb-2">{member.class}</p>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    member.status === "ready" ? "bg-green-600 text-green-100" : "bg-amber-600 text-amber-100"
                  }`}
                >
                  {member.status === "ready" ? "⚡ Ready" : "⏳ Waiting"}
                </div>
              </Card>
            ))}
          </div>

          {/* Quest Master Controls */}
          <div className="text-center border-t border-amber-800 pt-6">
            <h3 className="text-lg font-sans font-bold text-amber-300 mb-4">Quest Master Controls</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartQuest}
                disabled={isStarting}
                className="fantasy-button px-8 py-3 text-lg font-serif font-bold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                {isStarting ? "🔮 Casting..." : "🚀 Begin the Quest!"}
              </Button>
              <Link href="/">
                <Button className="fantasy-button px-6 py-3 font-serif font-bold bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800">
                  🏠 Return to Tavern
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quest Preview */}
        <div className="fantasy-card ornate-border p-6 max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-sans font-bold text-purple-300 mb-4">📜 Upcoming Quest 📜</h3>
          <p className="text-purple-200 font-serif mb-4">
            "The Riddles of the Ancient Tome" - Test thy knowledge across realms of wisdom
          </p>
          <div className="text-amber-300 font-serif text-sm">
            🎯 10 Questions • ⏱️ 30 seconds each • 🏆 Glory awaits the victor
          </div>
        </div>
      </div>
    </div>
  )
}
