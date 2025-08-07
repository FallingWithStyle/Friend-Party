-- Migration: Create peer_assessment_assignments table
-- This table will store the pre-calculated distribution of peer assessments
-- to ensure fairness.

CREATE TABLE IF NOT EXISTS public.peer_assessment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    assessor_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    subject_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_assessment_assignment UNIQUE (party_id, question_id, assessor_member_id, subject_member_id)
);

COMMENT ON TABLE public.peer_assessment_assignments IS 'Stores the pre-calculated assignments for peer assessments to ensure each member is assessed an equal number of times for each stat.';
COMMENT ON COLUMN public.peer_assessment_assignments.assessor_member_id IS 'The party member who is assigned to perform the assessment.';
COMMENT ON COLUMN public.peer_assessment_assignments.subject_member_id IS 'The party member who is the subject of the assessment.';

-- Enable RLS
ALTER TABLE public.peer_assessment_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for peer_assessment_assignments
CREATE POLICY "Allow members to see their own assessment assignments"
ON public.peer_assessment_assignments FOR SELECT
TO authenticated
USING (assessor_member_id IN (SELECT id FROM public.party_members WHERE user_id = auth.uid()));