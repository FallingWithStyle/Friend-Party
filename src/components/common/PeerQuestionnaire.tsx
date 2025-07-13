'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import './PeerQuestionnaire.css';

// Define types for better type safety
interface Question {
  id: string;
  question_text: string;
  question_type: 'self-assessment' | 'peer-assessment';
}

interface PartyMember {
  id: string;
  first_name: string;
  user_id: string;
}

export const PeerQuestionnaire = ({ partyCode }: { partyCode: string }) => {
  const router = useRouter();
  const { members, user } = usePartyStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> subject_member_id
  const [isLoading, setIsLoading] = useState(true);
  const [displayedMembers, setDisplayedMembers] = useState<PartyMember[]>([]);

  const currentUserMember = members.find((m: PartyMember) => m.user_id === user?.id);
  const otherMembers = members.filter((m: PartyMember) => m.user_id !== user?.id);

  useEffect(() => {
    if (otherMembers.length > 0) {
      const shuffled = [...otherMembers].sort(() => 0.5 - Math.random());
      setDisplayedMembers(shuffled.slice(0, 2));
    }
  }, [currentQuestionIndex, members, user]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, question_type')
        .eq('question_type', 'peer-assessment');

      if (error) {
        console.error('Error fetching questions:', error);
      } else {
        setQuestions(data as Question[]);
      }
      setIsLoading(false);
    };

    fetchQuestions();
  }, []);

  const handleAnswer = async (questionId: string, subjectMemberId: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: subjectMemberId,
    };
    setAnswers(newAnswers);

    // If this is the last question, submit all answers
    if (currentQuestionIndex === questions.length - 1) {
      if (!currentUserMember) return;

      const answersToSubmit = Object.entries(newAnswers).map(([questionId, subjectMemberId]) => ({
        question_id: questionId,
        voter_member_id: currentUserMember.id,
        subject_member_id: subjectMemberId,
        answer_value: '1',
      }));

      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase.from('answers').insert(answersToSubmit);

      if (error) {
        console.error('Error submitting answers:', error);
        // Handle error UI
      } else {
        const response = await fetch(`/api/party/${partyCode}/finish-questionnaire`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: currentUserMember.id }),
        });

        if (!response.ok) {
          console.error('Failed to finish questionnaire');
          return;
        }

        router.push(`/party/${partyCode}/results`);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  if (isLoading) {
    return <div>Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div>No peer-assessment questions found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="peer-questionnaire-card">
      <div className="question-header">
        <h2 className="question-title">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <p className="question-text">{currentQuestion.question_text}</p>
      </div>
      <div className="answers-container">
        {displayedMembers.map((member) => (
          <button
            key={member.id}
            className={`answer-button ${answers[currentQuestion.id] === member.id ? 'selected' : ''}`}
            onClick={() => handleAnswer(currentQuestion.id, member.id)}
          >
            {member.first_name}
          </button>
        ))}
      </div>
    </div>
  );
};