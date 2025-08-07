ALTER TABLE public.party_members
ADD COLUMN assessment_status TEXT DEFAULT 'NotStarted' NOT NULL;

COMMENT ON COLUMN public.party_members.assessment_status IS 'The member''s current stage in the assessment process (NotStarted, SelfAssessmentCompleted, PeerAssessmentCompleted).';