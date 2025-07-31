-- Migration: Add hireling functionality (is_npc on party_members + hireling_conversion_votes table)
-- Date: 2025-07-31

-- 1) Add is_npc to party_members if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'party_members'
      AND column_name = 'is_npc'
  ) THEN
    ALTER TABLE public.party_members
      ADD COLUMN is_npc BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END$$;

-- 2) Create hireling_conversion_votes table (idempotent)
CREATE TABLE IF NOT EXISTS public.hireling_conversion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_member_id_being_voted_on UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
  voter_party_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_hireling_vote UNIQUE (party_member_id_being_voted_on, voter_party_member_id)
);

COMMENT ON TABLE public.hireling_conversion_votes IS 'Tracks votes to convert a member into a hireling (NPC).';
COMMENT ON COLUMN public.hireling_conversion_votes.party_member_id_being_voted_on IS 'The target party member who is being voted on for conversion.';
COMMENT ON COLUMN public.hireling_conversion_votes.voter_party_member_id IS 'The party member casting the conversion vote.';

-- 3) Enable RLS
ALTER TABLE public.hireling_conversion_votes ENABLE ROW LEVEL SECURITY;

-- 4) Policies
-- Allow members to see votes for members within their own parties
DROP POLICY IF EXISTS "Allow members to see hireling votes in their party" ON public.hireling_conversion_votes;
CREATE POLICY "Allow members to see hireling votes in their party"
ON public.hireling_conversion_votes
FOR SELECT
TO authenticated
USING (
  -- A vote is visible if the voter or the target belong to a party that the authed user is a member of
  EXISTS (
    SELECT 1
    FROM public.party_members pm_self
    WHERE pm_self.user_id = auth.uid()
      AND (
        pm_self.party_id = (SELECT pm_target.party_id FROM public.party_members pm_target WHERE pm_target.id = party_member_id_being_voted_on)
        OR
        pm_self.party_id = (SELECT pm_voter.party_id FROM public.party_members pm_voter WHERE pm_voter.id = voter_party_member_id)
      )
  )
);

-- Allow members to insert/update their own votes (one per voter/target enforced by unique constraint)
DROP POLICY IF EXISTS "Allow members to upsert their own hireling votes" ON public.hireling_conversion_votes;
CREATE POLICY "Allow members to upsert their own hireling votes"
ON public.hireling_conversion_votes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm_voter
    WHERE pm_voter.id = voter_party_member_id
      AND pm_voter.user_id = auth.uid()
  )
);

-- Allow updates by the member who owns the voter_party_member_id (i.e., they can change their vote)
DROP POLICY IF EXISTS "Allow members to update their own hireling votes" ON public.hireling_conversion_votes;
CREATE POLICY "Allow members to update their own hireling votes"
ON public.hireling_conversion_votes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.party_members pm_voter
    WHERE pm_voter.id = voter_party_member_id
      AND pm_voter.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm_voter
    WHERE pm_voter.id = voter_party_member_id
      AND pm_voter.user_id = auth.uid()
  )
);

-- (Optional) Allow deletes by the same owner; keep strict by default (commented)
-- DROP POLICY IF EXISTS "Allow members to delete their own hireling votes" ON public.hireling_conversion_votes;
-- CREATE POLICY "Allow members to delete their own hireling votes"
-- ON public.hireling_conversion_votes
-- FOR DELETE
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.party_members pm_voter
--     WHERE pm_voter.id = voter_party_member_id
--       AND pm_voter.user_id = auth.uid()
--   )
-- );

-- 5) Updated_at trigger for hireling_conversion_votes
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_on_hireling_conversion_votes ON public.hireling_conversion_votes;
CREATE TRIGGER trg_set_updated_at_on_hireling_conversion_votes
BEFORE UPDATE ON public.hireling_conversion_votes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();