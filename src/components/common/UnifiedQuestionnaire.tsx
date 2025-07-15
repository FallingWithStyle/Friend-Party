'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deterministicShuffle } from '@/lib/utils';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/lib/supabase/client';
import { Question, PartyMember, AnswerOption } from '@/types/questionnaire';
import './Questionnaire.css';

interface UnifiedQuestionnaireProps {
  partyCode: string;
  questionType: 'self-assessment' | 'peer-assessment';
}

export const UnifiedQuestionnaire = ({ partyCode, questionType }: UnifiedQuestionnaireProps) => {
  const router = useRouter();
  const { members, user } = usePartyStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [displayedMembers, setDisplayedMembers] = useState<PartyMember[]>([]);
  const [abilityScores, setAbilityScores] = useState({
    STR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    WIS: 0,
    CHA: 0
  });

  const currentUserMember = members.find((m: PartyMember) => m.user_id === user?.id);
  const otherMembers = useMemo(() => members.filter((m: PartyMember) => m.user_id !== user?.id), [members, user]);

  useEffect(() => {
    if (questionType === 'peer-assessment' && otherMembers.length > 0 && user && questions.length > 0) {
      const seed = user.id + currentQuestionIndex.toString();
      const shuffled = deterministicShuffle(otherMembers, seed);
      setDisplayedMembers(shuffled.slice(0, 2));
    }
  }, [currentQuestionIndex, questionType, otherMembers, user, questions]);

  useEffect(() => {
    if (user && members.length > 0) {
      const member = members.find((m: PartyMember) => m.user_id === user?.id);
      if (member) {
        setIsDataReady(true);
      }
    }
  }, [user, members]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, question_type, answer_options')
        .eq('question_type', questionType);

      if (error) {
        console.error('Error fetching questions:', error);
      } else {
        setQuestions(data as Question[]);
      }
      setIsLoading(false);
    };

    if (isDataReady) {
      fetchQuestions();
    }
  }, [questionType, isDataReady]);

  const handleAnswer = async (answer: string | AnswerOption) => {
    if (!currentUserMember || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    let answerValue: string;
    let subjectMemberId: string | null = null;

    if (questionType === 'self-assessment') {
      const option = answer as AnswerOption;
      answerValue = option.stat;
      subjectMemberId = currentUserMember.id;
      setAbilityScores(prevScores => {
        const newCounts = { ...prevScores };
        newCounts[option.stat as keyof typeof newCounts] = (newCounts[option.stat as keyof typeof newCounts] || 0) + 1;
        return newCounts;
      });
    } else {
      answerValue = '1';
      subjectMemberId = answer as string;
    }
    
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: typeof answer === 'string' ? answer : (answer as AnswerOption).stat,
    };
    setAnswers(newAnswers);

    if (questionType === 'peer-assessment') {
        if (currentQuestionIndex === questions.length - 1) {
            submitQuestionnaire(newAnswers);
        } else {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    } else { // self-assessment
        const supabase = createClient();
        const { error } = await supabase.from('answers').insert({
            question_id: currentQuestion.id,
            voter_member_id: currentUserMember.id,
            subject_member_id: subjectMemberId,
            answer_value: answerValue,
        });

        if (error) {
            console.error('Error saving answer:', error);
            return;
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            submitQuestionnaire(newAnswers);
        }
    }
  };

  const submitQuestionnaire = async (finalAnswers: Record<string, string>) => {
    if (!currentUserMember) return;

    if (questionType === 'peer-assessment') {
        const answersToSubmit = Object.entries(finalAnswers).map(([questionId, subjectMemberId]) => ({
            question_id: questionId,
            voter_member_id: currentUserMember.id,
            subject_member_id: subjectMemberId,
            answer_value: '1',
        }));

        const supabase = createClient();
        const { error } = await supabase.from('answers').insert(answersToSubmit);

        if (error) {
            console.error('Error submitting answers:', error);
            return;
        }
    }

    const response = await fetch(`/api/party/${partyCode}/finish-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserMember.id }),
    });

    if (!response.ok) {
        console.error('Failed to finish questionnaire');
        return;
    }

    if (questionType === 'self-assessment') {
        router.push(`/party/${partyCode}/questionnaire/peer`);
    } else {
        router.push(`/party/${partyCode}/results`);
    }
  };

  if (isLoading || !isDataReady) {
    return <div>Loading...</div>;
  }

  if (questions.length === 0) {
    return <div>No {questionType.replace('-', ' ')} questions found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="questionnaire-card">
      <div className="question-header">
        <h2 className="question-title">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <p className="question-text">{currentQuestion.question_text}</p>
      </div>
      <div className="answers-container">
        {questionType === 'self-assessment' && currentQuestion.answer_options ? (
          currentQuestion.answer_options.map((option, index) => (
            <button
              key={index}
              className={`answer-button ${answers[currentQuestion.id] === option.stat ? 'selected' : ''}`}
              onClick={() => handleAnswer(option)}
            >
              {option.text}
            </button>
          ))
        ) : (
          displayedMembers.map((member) => (
            <button
              key={member.id}
              className={`answer-button ${answers[currentQuestion.id] === member.id ? 'selected' : ''}`}
              onClick={() => handleAnswer(member.id)}
            >
              {member.first_name}
            </button>
          ))
        )}
      </div>
      {questionType === 'self-assessment' && (
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
      )}
    </div>
  );
};