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

  const handleAnswer = async (answer: string) => {
    if (!currentUserMember || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];

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
      // All questions answered, advance to the next stage (peer-assessment)
      // For now, we'll just log it. This will be implemented in Story 2.3
      console.log('Self-assessment complete!');
      // In a real scenario, you'd likely update the user's status and redirect
      // e.g., router.push(`/party/${code}/peer-assessment`);
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
      </div>
    </div>
  );
}