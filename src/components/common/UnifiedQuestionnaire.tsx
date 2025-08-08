'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deterministicShuffle } from '@/lib/utils';
import { IS_DEBUG_MODE, logDebug } from '@/lib/debug'; // Import debug utilities
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/lib/supabase/client';
import { Question, PartyMember, AnswerOption, PeerAssessmentAssignment } from '@/types/questionnaire';
import LoadingSpinner from './LoadingSpinner';
import './Questionnaire.css';

interface UnifiedQuestionnaireProps {
  partyCode: string;
  questionType: 'self-assessment' | 'peer-assessment';
}

export const UnifiedQuestionnaire = ({ partyCode, questionType }: UnifiedQuestionnaireProps) => {
  const { members, user, loading: partyStoreLoading } = usePartyStore();
  const router = useRouter();
  // Log when component mounts for peer assessment
  useEffect(() => {
    if (questionType === 'peer-assessment') {
      console.log('[PeerAssessment] UnifiedQuestionnaire mounted for user:', user?.id);
    }
  }, [questionType, user]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected: string; all: string[] } | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedMembers, setDisplayedMembers] = useState<PartyMember[]>([]);
  const [assignments, setAssignments] = useState<PeerAssessmentAssignment[]>([]);
  const [abilityScores, setAbilityScores] = useState({
    STR: 0,
    DEX: 0,
    CON: 0,
    INT: 0,
    WIS: 0,
    CHA: 0
  });

  const currentUserMember = useMemo(() => members.find(m => m.user_id === user?.id), [members, user]);
  const otherMembers = useMemo(() => members.filter(m => m.user_id !== user?.id), [members, user]);

  // Effect to set displayed members for peer assessment
  useEffect(() => {
    if (questionType === 'peer-assessment' && assignments.length > 0 && questions.length > 0 && user) {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      if (currentQuestionId) {
        const relevantAssignments = assignments.filter(a => a.question_id === currentQuestionId);
        const subjectMemberIds = relevantAssignments.map(a => a.subject_member_id);
        const membersToDisplay = otherMembers.filter(m => subjectMemberIds.includes(m.id));
        
        const seed = user.id + currentQuestionIndex.toString();
        const shuffled = deterministicShuffle(membersToDisplay, seed);
        setDisplayedMembers(shuffled.slice(0, 2));
      }
    }
  }, [currentQuestionIndex, questionType, assignments, questions, otherMembers, user]);

  // Effect to fetch questions
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
    };

    if (!partyStoreLoading && user && members.length > 0) {
      fetchQuestions();
    }
  }, [questionType, partyStoreLoading, user, members]);

  // Effect to fetch assignments for peer assessment
  useEffect(() => {
    const fetchAssignments = async () => {
      if (questionType !== 'peer-assessment' || !partyCode) return;
      const response = await fetch(`/api/party/${partyCode}/peer-assessment-assignments`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[PeerAssessment] Assignments fetched for member:`, currentUserMember?.id, 'Count:', data.length);
        setAssignments(data);
        if (data.length === 0) {
          console.warn('[PeerAssessment] No assignments found for member:', currentUserMember?.id, user?.id, members);
        } else {
          console.log('[PeerAssessment] Assignments loaded successfully.');
        }
      } else {
        console.error('Failed to fetch peer assessment assignments');
      }
    };

    if (!partyStoreLoading && user && members.length > 0) {
      fetchAssignments();
    }
  }, [partyStoreLoading, partyCode, questionType, user, members, currentUserMember]);

  const handleAnswer = (answer: string | AnswerOption, allOptions?: PartyMember[]) => {
    if (!currentUserMember || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];
    let newAnswers;

    if (questionType === 'peer-assessment' && typeof answer === 'string' && allOptions) {
      newAnswers = {
        ...answers,
        [currentQuestion.id]: {
          selected: answer,
          all: allOptions.map(m => m.id)
        }
      };
    } else {
      newAnswers = {
        ...answers,
        [currentQuestion.id]: typeof answer === 'string' ? answer : (answer as AnswerOption).stat,
      };
    }
    
    setAnswers(newAnswers);

    if (questionType === 'self-assessment') {
      const option = answer as AnswerOption;
      setAbilityScores(prevScores => {
        const newCounts = { ...prevScores };
        newCounts[option.stat as keyof typeof newCounts] = (newCounts[option.stat as keyof typeof newCounts] || 0) + 1;
        return newCounts;
      });
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitQuestionnaire(newAnswers as Record<string, string | { selected: string; all: string[] }>);
    }
  };

  const submitQuestionnaire = async (finalAnswers: Record<string, string | { selected: string; all: string[] }>) => {
    if (!currentUserMember) return;
    setIsSubmitting(true);

    const answersToSubmit: Array<{ question_id: string; voter_member_id: string; subject_member_id: string; answer_value: string }> = [];
    if (questionType === 'self-assessment') {
      answersToSubmit = Object.entries(finalAnswers).map(([questionId, answerValue]) => ({
        question_id: questionId,
        voter_member_id: currentUserMember.id,
        subject_member_id: currentUserMember.id,
        answer_value: answerValue as string,
      }));
    } else { // peer-assessment
      Object.entries(finalAnswers).forEach(([questionId, answerData]) => {
        const { selected, all } = answerData as { selected: string; all: string[] };
        all.forEach(subjectMemberId => {
          answersToSubmit.push({
            question_id: questionId,
            voter_member_id: currentUserMember.id,
            subject_member_id: subjectMemberId,
            answer_value: subjectMemberId === selected ? '1' : '0',
          });
        });
      });
    }

    const supabase = createClient();
    logDebug(`Submitting answers for ${questionType}:`, answersToSubmit);
    if (questionType === 'self-assessment') {
      await fetch('/api/debug/log-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: currentUserMember.id,
          member_name: currentUserMember.first_name,
          source: 'self-assessment-submission',
          stats: abilityScores,
        }),
      });
    }
    const { error } = await supabase.from('answers').insert(answersToSubmit);

    if (error) {
      console.error('Error submitting answers:', error);
      return;
    }


    const response = await fetch(`/api/party/${partyCode}/finish-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: currentUserMember.id, assessment_type: questionType }),
    });

    if (!response.ok) {
        console.error('Failed to finish questionnaire');
        return;
    }

    if (questionType === 'self-assessment') {
        router.push(`/party/${partyCode}`); // Redirect to lobby after self assessment
    } else {
        router.push(`/party/${partyCode}/results`);
    }
    setIsSubmitting(false);
  };

  const handleAutoComplete = async () => {
    if (!IS_DEBUG_MODE) {
      logDebug("Auto-complete attempted in non-debug mode.");
      return;
    }
    logDebug("Starting auto-complete for questionnaire.");

    const tempAnswers: Record<string, string | { selected: string; all: string[] }> = {};
    for (const question of questions) {
      if (questionType === 'self-assessment' && question.answer_options) {
        // Select the first option for self-assessment
        tempAnswers[question.id] = question.answer_options[0].stat;
      } else if (questionType === 'peer-assessment' && displayedMembers.length > 0) {
        // Select the first displayed member for peer-assessment
        tempAnswers[question.id] = {
          selected: displayedMembers[0].id,
          all: displayedMembers.map(m => m.id)
        };
      }
    }
    setAnswers(tempAnswers);
    await submitQuestionnaire(tempAnswers);
    logDebug("Auto-complete finished.");
  };

  if (partyStoreLoading || !user || members.length === 0 || questions.length === 0 || (questionType === 'peer-assessment' && assignments.length === 0)) {
    return <div>Loading...</div>;
  }

  if (questions.length === 0) {
    return <div>No {questionType === 'self-assessment' ? 'Self Assessment' : 'Peer Assessment'} questions found.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      {isSubmitting && <LoadingSpinner />}
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
                className={`answer-button ${
                  (answers[currentQuestion.id] as { selected: string })?.selected === member.id ? 'selected' : ''
                }`}
                onClick={() => handleAnswer(member.id, displayedMembers)}
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
        {IS_DEBUG_MODE && (
          <div className="debug-controls">
            <button onClick={handleAutoComplete} className="debug-button">
              Auto-Complete {questionType === 'self-assessment' ? 'Self' : 'Peer'} Assessment
            </button>
          </div>
        )}
      </div>
    </>
  );
};