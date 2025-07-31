-- Migration: Normalize mottos - add new columns, backfill, enforce NOT NULL, ensure votes table, update RLS
-- Date: 2025-07-31
-- This migration is additive and idempotent. It does not drop legacy columns.

-- 0) Safety: ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Add new normalized columns to party_motto_proposals if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'proposed_by_member_id'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD COLUMN proposed_by_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'text'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD COLUMN "text" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'vote_count'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD COLUMN vote_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD COLUMN active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'is_finalized'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD COLUMN is_finalized BOOLEAN DEFAULT FALSE;
  END IF;
END$$;

-- 2) Ensure party_motto_votes exists with correct constraints
CREATE TABLE IF NOT EXISTS public.party_motto_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.party_motto_proposals(id) ON DELETE CASCADE NOT NULL,
  voter_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_motto_vote UNIQUE (proposal_id, voter_member_id)
);

-- Ensure RLS is enabled on votes (idempotent)
ALTER TABLE public.party_motto_votes ENABLE ROW LEVEL SECURITY;

-- 3) Backfill new columns from legacy columns where needed
-- Note: COALESCE used only here during migration to avoid runtime fallbacks.
UPDATE public.party_motto_proposals
SET proposed_by_member_id = proposing_member_id
WHERE proposed_by_member_id IS NULL;

UPDATE public.party_motto_proposals
SET "text" = proposed_motto
WHERE "text" IS NULL OR length(trim("text")) = 0;

UPDATE public.party_motto_proposals
SET vote_count = COALESCE(votes, 0)
WHERE vote_count IS NULL;

UPDATE public.party_motto_proposals
SET active = COALESCE(active, TRUE)
WHERE active IS NULL;

UPDATE public.party_motto_proposals
SET is_finalized = COALESCE(is_finalized, FALSE)
WHERE is_finalized IS NULL;

-- 3a) Optional normalization: de-duplicate impossible negative vote_count
UPDATE public.party_motto_proposals
SET vote_count = GREATEST(vote_count, 0)
WHERE vote_count < 0;

-- 4) Enforce NOT NULL constraints after backfill
ALTER TABLE public.party_motto_proposals
  ALTER COLUMN proposed_by_member_id SET NOT NULL;

ALTER TABLE public.party_motto_proposals
  ALTER COLUMN "text" SET NOT NULL;

ALTER TABLE public.party_motto_proposals
  ALTER COLUMN vote_count SET NOT NULL;

ALTER TABLE public.party_motto_proposals
  ALTER COLUMN active SET NOT NULL;

ALTER TABLE public.party_motto_proposals
  ALTER COLUMN is_finalized SET NOT NULL;

-- 5) Helpful uniqueness to avoid duplicate identical proposals by same member/party while active (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_active_motto_text_per_party'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD CONSTRAINT unique_active_motto_text_per_party
      UNIQUE (party_id, "text", active);
  END IF;
END$$;

-- 6) Vote_count maintenance triggers (idempotent create or replace)
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_on_party_motto_votes ON public.party_motto_votes;
CREATE TRIGGER trg_set_updated_at_on_party_motto_votes
BEFORE UPDATE ON public.party_motto_votes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.inc_motto_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.party_motto_proposals
  SET vote_count = vote_count + 1
  WHERE id = NEW.proposal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.dec_motto_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.party_motto_proposals
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = OLD.proposal_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.switch_motto_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.proposal_id IS DISTINCT FROM NEW.proposal_id THEN
    UPDATE public.party_motto_proposals
      SET vote_count = GREATEST(vote_count - 1, 0)
      WHERE id = OLD.proposal_id;
    UPDATE public.party_motto_proposals
      SET vote_count = vote_count + 1
      WHERE id = NEW.proposal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inc_motto_vote_count ON public.party_motto_votes;
CREATE TRIGGER trg_inc_motto_vote_count
AFTER INSERT ON public.party_motto_votes
FOR EACH ROW
EXECUTE FUNCTION public.inc_motto_vote_count();

DROP TRIGGER IF EXISTS trg_dec_motto_vote_count ON public.party_motto_votes;
CREATE TRIGGER trg_dec_motto_vote_count
AFTER DELETE ON public.party_motto_votes
FOR EACH ROW
EXECUTE FUNCTION public.dec_motto_vote_count();

DROP TRIGGER IF EXISTS trg_switch_motto_vote_count ON public.party_motto_votes;
CREATE TRIGGER trg_switch_motto_vote_count
AFTER UPDATE OF proposal_id ON public.party_motto_votes
FOR EACH ROW
EXECUTE FUNCTION public.switch_motto_vote_count();

-- 7) Indexes
CREATE INDEX IF NOT EXISTS idx_party_motto_proposals_party ON public.party_motto_proposals(party_id);
CREATE INDEX IF NOT EXISTS idx_party_motto_votes_proposal ON public.party_motto_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_party_motto_votes_voter ON public.party_motto_votes(voter_member_id);

-- 8) RLS updates to use only normalized columns on proposals and votes

-- Ensure RLS enabled
ALTER TABLE public.party_motto_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_motto_votes ENABLE ROW LEVEL SECURITY;

-- Proposals RLS: select within party membership
DROP POLICY IF EXISTS "Allow members to read proposals in their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to read proposals in their party"
ON public.party_motto_proposals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.party_id = party_motto_proposals.party_id
  )
);

-- Insert proposals by the authenticated member in their own party using normalized proposer column
DROP POLICY IF EXISTS "Allow members to insert proposals for their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to insert proposals for their party"
ON public.party_motto_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.id = party_motto_proposals.proposed_by_member_id
      AND pm.party_id = party_motto_proposals.party_id
  )
);

-- Keep updates restricted (server/service role will perform finalize/close)
DROP POLICY IF EXISTS "Allow system updates to proposals (none to auth by default)" ON public.party_motto_proposals;

-- Votes RLS
DROP POLICY IF EXISTS "Allow members to read votes in their party" ON public.party_motto_votes;
CREATE POLICY "Allow members to read votes in their party"
ON public.party_motto_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    JOIN public.party_motto_proposals p ON p.id = party_motto_votes.proposal_id
    WHERE pm.user_id = auth.uid()
      AND pm.party_id = p.party_id
  )
);

DROP POLICY IF EXISTS "Allow members to insert their own vote" ON public.party_motto_votes;
CREATE POLICY "Allow members to insert their own vote"
ON public.party_motto_votes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.id = party_motto_votes.voter_member_id
  )
);

DROP POLICY IF EXISTS "Allow members to update their own vote" ON public.party_motto_votes;
CREATE POLICY "Allow members to update their own vote"
ON public.party_motto_votes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.id = party_motto_votes.voter_member_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_motto_proposals p_new
    JOIN public.party_members pm ON pm.party_id = p_new.party_id
    WHERE party_motto_votes.proposal_id = p_new.id
      AND party_motto_votes.voter_member_id = pm.id
      AND pm.user_id = auth.uid()
  )
);

-- 9) Validation helpers (safe to run; do not enforce failures here)
-- SELECT COUNT(*) AS nulls_missing_proposer FROM public.party_motto_proposals WHERE proposed_by_member_id IS NULL;
-- SELECT COUNT(*) AS nulls_missing_text FROM public.party_motto_proposals WHERE "text" IS NULL OR length(trim("text")) = 0;

-- Note:
-- Legacy columns proposing_member_id, proposed_motto, votes are intentionally retained.
-- A follow-up migration will drop them after code cutover and validation.