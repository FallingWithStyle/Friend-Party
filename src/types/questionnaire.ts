export interface AnswerOption {
  text: string;
  stat: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'self-assessment' | 'peer-assessment';
  answer_options?: AnswerOption[];
}

export interface PartyMember {
  id: string;
  first_name: string;
  user_id: string;
  is_leader: boolean;
  status: 'Lobby' | 'Self Assessment' | 'Peer Assessment' | 'Results';
}

export interface PeerAssessmentAssignment {
  question_id: string;
  subject_member_id: string;
}