"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Mock quiz questions
const mockQuestions = [
  {
    id: 1,
    question: "Which spell allows a wizard to see invisible creatures?",
    options: ["Detect Magic", "True Seeing", "See Invisibility", "Arcane Eye"],
    correct: 2,
    category: "Arcane Knowledge",
  },
  {
    id: 2,
    question: "What is the maximum number of spell slots a 20th level wizard has for 9th level spells?",
    options: ["1", "2", "3", "4"],
    correct: 0,
    category: "Spellcasting",
  },
  {
    id: 3,
    question: "Which dragon type breathes cold damage?",
    options: ["Red Dragon", "Blue Dragon", "White Dragon", "Green Dragon"],
    correct: 2,
    category: "Monster Lore",
  },
]

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isAnswered, setIsAnswered] = useState(false)
  const router = useRouter()

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !isAnswered) {
      handleNextQuestion()
    }
  }, [timeLeft, isAnswered])

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return

    setSelectedAnswer(answerIndex)
    setIsAnswered(true)

    if (answerIndex === mockQuestions[currentQuestion].correct) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setTimeLeft(30)
    } else {
      // Quiz complete - redirect to party room
      router.push("/party-room")
    }
  }

  const question = mockQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 mb-4">
            📜 The Riddles of the Ancient Tome 📜
          </h1>
          <div className="flex justify-center items-center gap-8 text-amber-200 font-serif">
            <div>
              Question {currentQuestion + 1} of {mockQuestions.length}
            </div>
            <div className={`text-2xl font-bold ${timeLeft <= 10 ? "text-red-400" : "text-amber-300"}`}>
              ⏱️ {timeLeft}s
            </div>
            <div>Score: {score}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="w-full bg-amber-900/30 rounded-full h-3 border border-amber-600">
            <div
              className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="fantasy-card ornate-border p-8 max-w-3xl mx-auto magical-glow">
          <div className="text-center mb-6">
            <div className="text-sm text-purple-300 font-serif mb-2">{question.category}</div>
            <h2 className="text-2xl font-sans font-bold text-amber-300 mb-6">{question.question}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {question.options.map((option, index) => {
              let buttonClass =
                "fantasy-card p-4 text-left hover:bg-amber-800/20 transition-all cursor-pointer border-2 border-amber-600/50"

              if (isAnswered) {
                if (index === question.correct) {
                  buttonClass += " bg-green-600/30 border-green-400"
                } else if (index === selectedAnswer && index !== question.correct) {
                  buttonClass += " bg-red-600/30 border-red-400"
                }
              } else if (selectedAnswer === index) {
                buttonClass += " bg-amber-600/30 border-amber-400"
              }

              return (
                <div key={index} className={buttonClass} onClick={() => handleAnswerSelect(index)}>
                  <div className="font-serif text-amber-200">
                    <span className="font-bold text-amber-300 mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </div>
                </div>
              )
            })}
          </div>

          {isAnswered && (
            <div className="text-center">
              <Button onClick={handleNextQuestion} className="fantasy-button px-8 py-3 text-lg font-serif font-bold">
                {currentQuestion < mockQuestions.length - 1 ? "⚔️ Next Challenge" : "🏆 Complete Quest"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
