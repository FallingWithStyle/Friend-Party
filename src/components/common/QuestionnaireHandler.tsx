import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePartyStore } from '@/store/partyStore';
import { Member } from '@/types/member';
import { useRouter } from 'next/navigation';
import usePartyStore from '@/store/partyStore';
import './PeerQuestionnaire.css';

interface Question {
  id: string;
  question_text: string;
  option1?: string;
  option2?: string;
  option3?: string;
  question_type: string;
}

interface Member {
  id: string;
  first_name: string;
}

export const QuestionnaireHandler = ({ partyCode, questionType = 'peer-assessment' }: { partyCode: string, questionType?: string }) => {
  const router = useRouter();
  const { party, user } = usePartyStore();
  const [emailVerified, setEmailVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [nameVerified, setNameVerified] = useState(false);
  const [name, setName] = useState('');
  const currentMember = party?.members?.find((member: any) => member.user_id === user?.id);

  // Check if user has already provided email and name for this party
  useEffect(() => {
    if (currentMember) {
      // User already has information recorded for this party
      if (currentMember.email) {
        setEmail(currentMember.email);
        setEmailVerified(true);
      }
      if (currentMember.first_name) {
        setName(currentMember.first_name);
        setNameVerified(true);
      }
    } else if (user?.email) {
      // Use the user's email from their account if available
      setEmail(user.email);
      setEmailVerified(true);
    }
  }, [currentMember, user]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedMembers, setDisplayedMembers] = useState<Member[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('question_type', questionType);

      if (error) {
        console.error('Error fetching questions:', error);
        return;
      }

      setQuestions(data || []);
    };

    const fetchMembers = async () => {
      const supabase = createClient();
      const { data: membersData } = await supabase
        .from('party_members')
        .select('*')
        .eq('party_code', party?.code)
        .neq('user_id', user?.id);
      const { data, error } = await supabase
        .from('party_members')
        .select('id, first_name, user_id')
        .eq('party_code', partyCode)
        .neq('user_id', user?.id);
    
      if (data) {
        setMembers(membersData || []);
        setDisplayedMembers(data);
      }

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers(data || []);
      setDisplayedMembers(data || []);
    };

    fetchQuestions();
    fetchMembers();
  }, [partyCode, currentMember?.id, questionType]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Submit answers to the database
      const submissions = questions.map(question => ({
        party_code: partyCode,
        question_id: question.id,
        answer: answers[question.id],
        responder_id: currentMember?.id,
        respondent_id: questionType === 'peer-assessment' ? answers[question.id] : null
      }));

      const supabaseClient = createClient();
      const { error } = await supabaseClient
        .from('answers')
        .insert(submissions);

      if (error) {
        console.error('Error submitting answers:', error);
        return;
      }

      // Redirect to results page
      router.push(`/party/${partyCode}/results`);
    } catch (err) {
      console.error('Error during submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Skip email verification if we already have an email for this user in this party
  if (!emailVerified && !currentMember?.email) {
    return (
      <div className="email-verification">
        <h2>Verify Your Email</h2>
        <p>Please confirm your email address for this party</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <button
          onClick={() => setEmailVerified(true)}
          disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
        >
          Next
        </button>
      </div>
    );
  }

  if (!nameVerified) {
    return (
      <div className="name-verification">
        <h2>Enter Your Name</h2>
        <p>Please enter your name for this party</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <button
          onClick={() => {
            setNameVerified(true);
            // Update the member's name in the database
            const updateMemberName = async () => {
              const supabase = createClient();
              await supabase
                .from('party_members')
                .update({ first_name: name })
                .eq('id', currentMember?.id);
            };
            updateMemberName();
          }}
          disabled={!name || name.trim().length === 0}
        >
          Confirm Name
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const allQuestionsAnswered = questions.every(question => answers[question.id]);

  return (
    <div className="questionnaire-container">
      <div className="question-progress">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>

      <div className="question-text">
        {currentQuestion.question_text}
      </div>

      <div className="answer-options">
        {questionType === 'peer-assessment' && currentQuestion.question_type === 'peer' ? (
          displayedMembers.map((member) => (
            <button
              key={member.id}
              className={`answer-button ${answers[currentQuestion.id] === member.id ? 'selected' : ''}`}
              onClick={() => handleAnswer(currentQuestion.id, member.id)}
            >
              {member.first_name}
            </button>
          ))
        ) : (
          <div className="self-assessment-options">
            <button
              className={`answer-button ${answers[currentQuestion.id] === 'option1' ? 'selected' : ''}`}
              onClick={() => handleAnswer(currentQuestion.id, 'option1')}
            >
              {currentQuestion.option1 || 'Option 1'}
            </button>
            <button
              className={`answer-button ${answers[currentQuestion.id] === 'option2' ? 'selected' : ''}`}
              onClick={() => handleAnswer(currentQuestion.id, 'option2')}
            >
              {currentQuestion.option2 || 'Option 2'}
            </button>
            <button
              className={`answer-button ${answers[currentQuestion.id] === 'option3' ? 'selected' : ''}`}
              onClick={() => handleAnswer(currentQuestion.id, 'option3')}
            >
              {currentQuestion.option3 || 'Option 3'}
            </button>
          </div>
        )}
      </div>

      <div className="questionnaire-navigation">
        {currentQuestionIndex > 0 && (
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }
            }}
            className="nav-button"
          >
            Previous
          </button>
        )}

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="nav-button"
            disabled={!answers[currentQuestion.id]}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="nav-button submit-button"
            disabled={!allQuestionsAnswered || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        )}
      </div>
    </div>
  );
};