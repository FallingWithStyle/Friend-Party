'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const otherMembers = members.filter((m: PartyMember) => m.user_id !== user?.id);

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient();
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
    
    const supabase = createClient();
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

      router.push(`/party/${partyCode}/lobby`);
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
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          Question {currentQuestionIndex + 1} of {questions.length}
        </CardTitle>
        <p className="text-lg">{currentQuestion.question_text}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={otherMembers[0]?.id} className="w-full">
          <TabsList>
            {otherMembers.map((member) => (
              <TabsTrigger key={member.id} value={member.id}>
                {member.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {otherMembers.map((member) => (
            <TabsContent key={member.id} value={member.id}>
              <div className="flex flex-col space-y-2 mt-4">
                {(currentQuestion.options || ['Yes', 'No']).map((option) => (
                  <Button
                    key={option}
                    variant={
                      answers[member.id]?.find(a => a.question_id === currentQuestion.id)?.value === option
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => handleAnswer(member.id, currentQuestion.id, option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="mt-6 flex justify-end">
          {isLastQuestion ? (
            <Button onClick={handleSubmit}>Finish & See Results</Button>
          ) : (
            <Button onClick={handleNextQuestion}>Next Question</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};