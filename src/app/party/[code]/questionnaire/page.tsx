'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Question {
  id: string;
  question_text: string;
  answer_options: string[];
}

interface PartyMember {
    id: string;
    user_id: string;
}

const supabase = createClient();

export default function QuestionnairePage() {
  const { code } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentUserMember, setCurrentUserMember] = useState<PartyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [abilityScores, setAbilityScores] = useState({
    STR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    WIS: 0,
    CHA: 0
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch the current user's party member ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect if not logged in, though they shouldn't reach this page.
        router.push('/');
        return;
      }

      const { data: party } = await supabase.from('parties').select('id').eq('code', code).single();
      if (!party) {
        // Handle party not found
        router.push('/');
        return;
      }

      const { data: member } = await supabase.from('party_members').select('id, user_id').eq('party_id', party.id).eq('user_id', user.id).single();
      if (member) {
        setCurrentUserMember(member);
      }

      // Fetch self-assessment questions
      const { data: questionData } = await supabase
        .from('questions')
        .select('id, question_text, answer_options')
        .eq('question_type', 'self-assessment');
      
      if (questionData) {
        setQuestions(questionData);
      }
      setLoading(false);
    };

    fetchInitialData();
  }, [code, router]);

  const calculateScores = (answers: string[]) => {
    const counts: Record<string, number> = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
    answers.forEach(answer => {
      if (Object.keys(counts).includes(answer)) {
        counts[answer] = (counts[answer] || 0) + 1;
      }
    });
    return {
      STR: counts.STR * 2,
      DEX: counts.DEX * 2,
      CON: counts.CON * 2,
      INT: counts.INT * 2,
      WIS: counts.WIS * 2,
      CHA: counts.CHA * 2
    };
  };

  const handleAnswer = async (answer: string) => {
    if (!currentUserMember || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newScores = calculateScores([answer]);
    setAbilityScores(newScores);

    const { error } = await supabase.from('answers').insert({
      question_id: currentQuestion.id,
      voter_member_id: currentUserMember.id,
      subject_member_id: currentUserMember.id, // For self-assessment, voter and subject are the same
      answer_value: answer,
    });

    if (error) {
      console.error('Error saving answer:', error);
      // Optionally, show an error to the user
      return;
    }

    // Move to the next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, finish the questionnaire
      try {
        const response = await fetch(`/api/party/${code}/finish-questionnaire`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: currentUserMember.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to finish questionnaire');
        }

        // Redirect to the results page
        router.push(`/party/${code}/results`);
      } catch (error) {
        console.error('Error finishing questionnaire:', error);
        // Optionally, show an error to the user
      }
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div className="text-center p-8">No questions found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const { question_text: mainQuestion, answer_options: options } = currentQuestion;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">{mainQuestion}?</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="w-full p-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Current Ability Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(abilityScores).map(([stat, value]) => (
              <div key={stat} className="bg-gray-100 p-3 rounded-lg">
                <span className="font-medium">{stat}:</span> {value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}