'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import './page.css';

interface AnswerOption {
  text: string;
  stat: string;
}

interface Question {
  id: string;
  question_text: string;
  answer_options: AnswerOption[];
}

interface PartyMember {
    id: string;
    user_id: string;
}

const supabase = createClient() as unknown as SupabaseClient;

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
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
  }, [code, router, supabase]);

  const handleAnswer = async (option: AnswerOption) => {
    if (!currentUserMember || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];

    // Update the answers state
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: option.stat
    }));

    setAbilityScores(prevScores => {
      const newCounts = { ...prevScores };
      newCounts[option.stat as keyof typeof newCounts] = (newCounts[option.stat as keyof typeof newCounts] || 0) + 1;
      return newCounts;
    });

    const { error } = await supabase.from('answers').insert({
      question_id: currentQuestion.id,
      voter_member_id: currentUserMember.id,
      subject_member_id: currentUserMember.id,
      answer_value: option.stat,
    });

    if (error) {
      console.error('Error saving answer:', error);
      return;
    }

    // Automatically move to the next question or finish
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

        // Redirect to the peer assessment page
        router.push(`/party/${code}/questionnaire/peer`);
      } catch (error) {
        console.error('Error finishing questionnaire:', error);
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
    <div className="peer-questionnaire-card">
      <div className="question-header">
        <h2 className="question-title">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <p className="question-text">{mainQuestion}?</p>
      </div>
      <div className="answers-container">
        {options.map((option, index) => {
          const isSelected = answers[currentQuestion.id] === option.stat;
          return (
            <button
              key={index}
              className={`answer-button ${isSelected ? 'selected' : ''}`}
              onClick={() => handleAnswer(option)}
            >
              {option.text}
            </button>
          );
        })}
      </div>
      <div className="scores-container">
        <h3 className="scores-title">Current Ability Scores</h3>
        <div className="scores-grid">
          {Object.entries(abilityScores).map(([stat, value]) => (
            <div key={stat} className="score-item">
              <span className="score-stat">{stat}:</span> {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}