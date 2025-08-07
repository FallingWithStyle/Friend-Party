-- Migration: Drop legacy motto columns after cutover
-- Date: 2025-07-31
-- This migration removes legacy columns from party_motto_proposals and cleans up dependent policies first.

BEGIN;

-- 0) Drop any policies that still reference legacy columns to avoid dependency errors
DO $$
BEGIN
  -- This policy name exists in init.sql before normalization; safe to drop if present
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'party_motto_proposals'
      AND policyname = 'Allow members to insert motto proposals in their party'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow members to insert motto proposals in their party" ON public.party_motto_proposals';
  END IF;
END$$;

-- 1) Recreate normalized-only proposal insert policy (idempotent)
DROP POLICY IF EXISTS "Allow members to insert proposals for their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to insert proposals for their party"
ON public.party_motto_proposals
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.id = party_motto_proposals.proposed_by_member_id
      AND pm.party_id = party_motto_proposals.party_id
  )
);

-- 2) Safety checks: ensure normalized columns exist (indicates prior migration ran)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'proposed_by_member_id'
  ) THEN
    RAISE EXCEPTION 'Normalized column proposed_by_member_id does not exist; aborting legacy drop.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'text'
  ) THEN
    RAISE EXCEPTION 'Normalized column text does not exist; aborting legacy drop.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'vote_count'
  ) THEN
    RAISE EXCEPTION 'Normalized column vote_count does not exist; aborting legacy drop.';
  END IF;
END$$;

-- 3) Validate no NULLs remain in normalized columns (defensive)
DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.party_motto_proposals
  WHERE proposed_by_member_id IS NULL
     OR "text" IS NULL
     OR length(trim("text")) = 0
     OR vote_count IS NULL
     OR active IS NULL
     OR is_finalized IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Validation failed: % rows with NULLs or empty text in normalized columns', null_count;
  END IF;
END$$;

-- 4) Drop legacy columns if present (now that policies are clean)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'proposing_member_id'
  ) THEN
    ALTER TABLE public.party_motto_proposals DROP COLUMN proposing_member_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'proposed_motto'
  ) THEN
    ALTER TABLE public.party_motto_proposals DROP COLUMN proposed_motto;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'party_motto_proposals' AND column_name = 'votes'
  ) THEN
    ALTER TABLE public.party_motto_proposals DROP COLUMN votes;
  END IF;
END$$;

-- 5) Ensure helpful uniqueness remains in place on normalized columns
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

-- 6) Ensure essential RLS policies exist and only reference normalized cols
ALTER TABLE public.party_motto_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_motto_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to read proposals in their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to read proposals in their party"
ON public.party_motto_proposals
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.party_id = party_motto_proposals.party_id
  )
);

-- Votes policies (normalized)
DROP POLICY IF EXISTS "pm_motto_votes_select" ON public.party_motto_votes;
CREATE POLICY "pm_motto_votes_select" ON public.party_motto_votes
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.party_motto_proposals p
    JOIN public.party_members me ON me.party_id = p.party_id
    WHERE public.party_motto_votes.proposal_id = p.id
      AND me.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pm_motto_votes_insert" ON public.party_motto_votes;
CREATE POLICY "pm_motto_votes_insert" ON public.party_motto_votes
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_motto_proposals p
    JOIN public.party_members me ON me.party_id = p.party_id
    WHERE public.party_motto_votes.proposal_id = p.id
      AND public.party_motto_votes.voter_member_id = me.id
      AND me.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pm_motto_votes_update" ON public.party_motto_votes;
CREATE POLICY "pm_motto_votes_update" ON public.party_motto_votes
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.party_motto_votes v
    JOIN public.party_members me ON me.id = v.voter_member_id
    WHERE v.id = public.party_motto_votes.id
      AND me.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_motto_proposals p_new
    JOIN public.party_members pm ON pm.party_id = p_new.party_id
    WHERE public.party_motto_votes.proposal_id = p_new.id
      AND public.party_motto_votes.voter_member_id = pm.id
      AND pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "pm_motto_votes_delete" ON public.party_motto_votes;
CREATE POLICY "pm_motto_votes_delete" ON public.party_motto_votes
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.party_members me
    WHERE me.id = public.party_motto_votes.voter_member_id
      AND me.user_id = auth.uid()
  )
);

COMMIT;