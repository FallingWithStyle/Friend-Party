"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Mock data structure based on the real Friend Party assessment questions
interface Question {
  id: string
  text: string
  type: "self" | "peer"
  category: string
}

interface Member {
  id: string
  name: string
  adventurer_name?: string
}

const mockQuestions: Question[] = [
  // Self-assessment questions
  {
    id: "self_1",
    text: "How well do you handle challenging situations under pressure?",
    type: "self",
    category: "resilience",
  },
  {
    id: "self_2",
    text: "How effectively do you communicate your ideas to others?",
    type: "self",
    category: "communication",
  },
  {
    id: "self_3",
    text: "How well do you work collaboratively in team settings?",
    type: "self",
    category: "teamwork",
  },
  {
    id: "self_4",
    text: "How adaptable are you when plans change unexpectedly?",
    type: "self",
    category: "adaptability",
  },
  {
    id: "self_5",
    text: "How well do you take initiative in group projects?",
    type: "self",
    category: "leadership",
  },
  // Peer assessment questions
  {
    id: "peer_1",
    text: "How well does this person handle challenging situations under pressure?",
    type: "peer",
    category: "resilience",
  },
  {
    id: "peer_2",
    text: "How effectively does this person communicate their ideas?",
    type: "peer",
    category: "communication",
  },
  {
    id: "peer_3",
    text: "How well does this person work collaboratively in teams?",
    type: "peer",
    category: "teamwork",
  },
  {
    id: "peer_4",
    text: "How adaptable is this person when plans change?",
    type: "peer",
    category: "adaptability",
  },
  {
    id: "peer_5",
    text: "How well does this person take initiative in groups?",
    type: "peer",
    category: "leadership",
  },
]

const mockMembers: Member[] = [
  { id: "1", name: "Gandalf", adventurer_name: "Gandalf the Grey" },
  { id: "2", name: "Legolas", adventurer_name: "Legolas Greenleaf" },
  { id: "3", name: "Gimli", adventurer_name: "Gimli son of Glóin" },
  { id: "4", name: "Aragorn", adventurer_name: "Strider" },
  { id: "5", name: "Frodo", adventurer_name: "Frodo Baggins" },
]

export default function QuestionnairePage() {
  const router = useRouter()
  const [currentPhase, setCurrentPhase] = useState<"self" | "peer">("self")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: number }>({})
  const [isComplete, setIsComplete] = useState(false)

  const selfQuestions = mockQuestions.filter((q) => q.type === "self")
  const peerQuestions = mockQuestions.filter((q) => q.type === "peer")

  const currentQuestions = currentPhase === "self" ? selfQuestions : peerQuestions
  const currentQuestion = currentQuestions[currentQuestionIndex]
  const currentMember = currentPhase === "peer" ? mockMembers[currentMemberIndex] : null

  const handleAnswer = (rating: number) => {
    const answerKey =
      currentPhase === "self"
        ? `self_${currentQuestion.id}_${rating}`
        : `peer_${currentMember?.id}_${currentQuestion.id}_${rating}`

    setAnswers((prev) => ({ ...prev, [answerKey]: rating }))

    // Move to next question or member
    if (currentPhase === "self") {
      if (currentQuestionIndex < selfQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else {
        // Move to peer assessment
        setCurrentPhase("peer")
        setCurrentQuestionIndex(0)
        setCurrentMemberIndex(0)
      }
    } else {
      // Peer assessment logic
      if (currentQuestionIndex < peerQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else if (currentMemberIndex < mockMembers.length - 1) {
        setCurrentMemberIndex((prev) => prev + 1)
        setCurrentQuestionIndex(0)
      } else {
        // Assessment complete
        setIsComplete(true)
        setTimeout(() => {
          router.push("/party-room")
        }, 2000)
      }
    }
  }

  const getProgress = () => {
    if (currentPhase === "self") {
      return (currentQuestionIndex / selfQuestions.length) * 50
    } else {
      const peerProgress =
        ((currentMemberIndex * peerQuestions.length + currentQuestionIndex) /
          (mockMembers.length * peerQuestions.length)) *
        50
      return 50 + peerProgress
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-amber-100 border-4 border-amber-600 rounded-lg p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-amber-900 mb-4">Quest Complete!</h1>
            <p className="text-amber-800 mb-4">Your assessments have been recorded in the ancient scrolls.</p>
            <div className="text-4xl mb-4">🏆</div>
            <p className="text-sm text-amber-700">Redirecting to victory celebration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-100 mb-2">
            {currentPhase === "self" ? "🪞 Self Assessment" : "👥 Peer Assessment"}
          </h1>
          <p className="text-amber-200">
            {currentPhase === "self"
              ? "Reflect upon your own abilities, brave adventurer"
              : `Evaluate your fellow party member: ${currentMember?.adventurer_name || currentMember?.name}`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-amber-800 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <p className="text-center text-amber-200 text-sm">{Math.round(getProgress())}% Complete</p>
        </div>

        {/* Question Card */}
        <div className="bg-amber-100 border-4 border-amber-600 rounded-lg p-8 shadow-2xl mb-8">
          <div className="text-center mb-6">
            <div className="text-2xl mb-4">{currentPhase === "self" ? "🤔" : "🔍"}</div>
            <h2 className="text-xl font-bold text-amber-900 mb-4">{currentQuestion?.text}</h2>
            {currentPhase === "peer" && currentMember && (
              <div className="bg-amber-200 rounded-lg p-3 mb-4">
                <p className="text-amber-800 font-semibold">
                  Assessing: {currentMember.adventurer_name || currentMember.name}
                </p>
              </div>
            )}
          </div>

          {/* Rating Scale */}
          <div className="space-y-3">
            <p className="text-center text-amber-800 font-semibold mb-4">Rate from 1 (Poor) to 5 (Excellent)</p>
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleAnswer(rating)}
                  className="w-16 h-16 rounded-full border-3 border-amber-600 bg-amber-200 hover:bg-amber-300 
                           text-amber-900 font-bold text-lg transition-all duration-200 hover:scale-110
                           hover:shadow-lg active:scale-95"
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-amber-700 mt-2 px-2">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Very Good</span>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="text-center">
          <div className="inline-flex bg-amber-800 rounded-full p-1">
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                currentPhase === "self" ? "bg-amber-400 text-amber-900" : "text-amber-300"
              }`}
            >
              Self Assessment
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                currentPhase === "peer" ? "bg-amber-400 text-amber-900" : "text-amber-300"
              }`}
            >
              Peer Assessment
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
