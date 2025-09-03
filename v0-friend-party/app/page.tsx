import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 mb-4 drop-shadow-lg">
            ⚔️ Friend Party ⚔️
          </h1>
          <p className="text-xl text-amber-200 font-serif italic mb-8">
            "Gather thy companions for a quest of wit and wisdom"
          </p>

          {/* Magic Link Section */}
          <div className="fantasy-card ornate-border p-8 mb-8 max-w-2xl mx-auto magical-glow">
            <h2 className="text-2xl font-sans font-bold text-amber-300 mb-6 flex items-center justify-center gap-2">
              🔮 Summon Magic Portal 🔮
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
              <Input
                placeholder="Enter thy email for magical passage..."
                className="fantasy-input max-w-md text-center placeholder:text-amber-600"
              />
              <Button className="fantasy-button px-6 py-2 font-serif font-bold">✨ Cast Spell</Button>
            </div>
            <p className="text-amber-300 font-serif text-sm mt-4 italic">
              Casting Time: 2 rounds. Check your email for the link after that.
            </p>
          </div>

          {/* Create Party Section */}
          <div className="fantasy-card ornate-border p-8 mb-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-sans font-bold text-amber-300 mb-6">⚡ Forge a New Adventure ⚡</h2>
            <p className="text-amber-200 font-serif mb-6">
              Become the Dungeon Master and create a legendary quest for thy fellowship
            </p>
            <Button className="fantasy-button px-8 py-3 text-lg font-serif font-bold">🏰 Create Party</Button>
          </div>

          {/* Join Party Section */}
          <div className="fantasy-card ornate-border p-8 mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-sans font-bold text-amber-300 mb-4">🗡️ Join an Existing Quest 🗡️</h2>
            <p className="text-amber-200 font-serif mb-6">Enter the sacred code to join thy companions' adventure</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Input
                placeholder="Enter Party Code..."
                className="fantasy-input max-w-xs text-center placeholder:text-amber-600"
              />
              <Button className="fantasy-button px-6 py-2 font-serif font-bold">⚔️ Join Quest</Button>
            </div>
          </div>

          {/* Demo Navigation to Party Room */}
          <div className="fantasy-card ornate-border p-6 mb-8 max-w-2xl mx-auto bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
            <h3 className="text-xl font-sans font-bold text-purple-300 mb-4">🎭 Demo Preview 🎭</h3>
            <p className="text-purple-200 font-serif mb-4 text-sm">Experience the full party adventure</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/party-lobby">
                <Button className="fantasy-button px-6 py-2 font-serif font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  🏰 Party Lobby
                </Button>
              </Link>
              <Link href="/questionnaire">
                <Button className="fantasy-button px-6 py-2 font-serif font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  📋 Assessment Quest
                </Button>
              </Link>
              <Link href="/party-room">
                <Button className="fantasy-button px-6 py-2 font-serif font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  🏆 Victory Celebration
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-amber-600 font-serif">
            <p className="border-t border-amber-800 pt-4">
              © 2025 Friend Party • <span className="italic">May your dice roll high</span> 🎲
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
