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
  options: string[]; // Assuming options are an array of strings
}

interface PartyMember {
  id: string;
  name: string;
  user_id: string;
}

interface Answer {
  question_id: string;
  subject_user_id: string;
  value: string;
}

export const PeerQuestionnaire = ({ partyCode }: { partyCode: string }) => {
  const router = useRouter();
  const { members, user } = usePartyStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({}); // Member ID -> Answers
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  const otherMembers = members.filter((m: PartyMember) => m.user_id !== user?.id);

  useEffect(() => {
    if (otherMembers.length > 0) {
      setActiveTab(otherMembers[0].id);
    }
  }, [members, user]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data, error } = await supabase
        .from('questions')
        .select('*')
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

  const handleAnswer = (subjectMemberId: string, questionId: string, value: string) => {
    setAnswers((prev) => {
      const memberAnswers = prev[subjectMemberId] || [];
      const existingAnswerIndex = memberAnswers.findIndex(
        (a) => a.question_id === questionId
      );

      let newMemberAnswers;
      if (existingAnswerIndex > -1) {
        newMemberAnswers = [...memberAnswers];
        newMemberAnswers[existingAnswerIndex] = { question_id: questionId, subject_user_id: subjectMemberId, value };
      } else {
        newMemberAnswers = [...memberAnswers, { question_id: questionId, subject_user_id: subjectMemberId, value }];
      }
      return { ...prev, [subjectMemberId]: newMemberAnswers };
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const allAnswers = Object.values(answers).flat();
    const answersToSubmit = allAnswers.map(answer => ({
        ...answer,
        user_id: user.id, // The user giving the assessment
        party_code: partyCode,
    }));
    
    const supabase = createClient() as unknown as SupabaseClient;
    const { error } = await supabase.from('answers').insert(answersToSubmit);

    if (error) {
      console.error('Error submitting answers:', error);
      // Handle error UI
    } else {
      // Update user status to 'Finished'
      await supabase
        .from('party_members')
        .update({ status: 'Finished' })
        .eq('user_id', user.id)
        .eq('party_code', partyCode);

      router.push(`/party/${partyCode}/results`);
    }
  };

  if (isLoading) {
    return <div>Loading questions...</div>;
  }

  if (questions.length === 0) {
    return <div>No peer-assessment questions found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="peer-questionnaire-card">
      <div className="question-header">
        <h2 className="question-title">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <p className="question-text">{currentQuestion.question_text}</p>
      </div>
      <div className="tabs-container">
        <div className="tabs-list">
          {otherMembers.map((member) => (
            <button
              key={member.id}
              className="tab-trigger"
              data-state={activeTab === member.id ? 'active' : 'inactive'}
              onClick={() => setActiveTab(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>
        {otherMembers.map((member) => (
          <div key={member.id} className="tab-content" hidden={activeTab !== member.id}>
            <div className="answers-container">
              {(currentQuestion.options || ['Yes', 'No']).map((option) => (
                <button
                  key={option}
                  className={`answer-button ${answers[member.id]?.find(a => a.question_id === currentQuestion.id)?.value === option ? 'selected' : ''}`}
                  onClick={() => handleAnswer(member.id, currentQuestion.id, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="navigation-buttons">
        {isLastQuestion ? (
          <button onClick={handleSubmit} className="nav-button">Finish & See Results</button>
        ) : (
          <button onClick={handleNextQuestion} className="nav-button">Next Question</button>
        )}
      </div>
    </div>
  );
};