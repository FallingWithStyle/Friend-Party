-- Migration: Add party motto proposals and votes with vote_count maintenance
-- Date: 2025-07-31

-- 1) party_motto_proposals table
CREATE TABLE IF NOT EXISTS public.party_motto_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  proposed_by_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.party_motto_proposals IS 'Motto proposals for a party along with aggregated vote_count and finalization flags.';
COMMENT ON COLUMN public.party_motto_proposals.text IS 'The proposed motto text.';
COMMENT ON COLUMN public.party_motto_proposals.vote_count IS 'Cached count of votes, maintained via triggers.';
COMMENT ON COLUMN public.party_motto_proposals.is_finalized IS 'True if this proposal was chosen as the final party motto.';
COMMENT ON COLUMN public.party_motto_proposals.active IS 'False if proposals are closed; used to disable further voting when finalized.';

-- Helpful uniqueness to avoid duplicate identical proposals by same member (optional, allow duplicates across members)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_active_motto_text_per_party'
  ) THEN
    ALTER TABLE public.party_motto_proposals
      ADD CONSTRAINT unique_active_motto_text_per_party
      UNIQUE (party_id, text, active);
  END IF;
END$$;

-- 2) party_motto_votes table
CREATE TABLE IF NOT EXISTS public.party_motto_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.party_motto_proposals(id) ON DELETE CASCADE NOT NULL,
  voter_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_motto_vote UNIQUE (proposal_id, voter_member_id)
);

COMMENT ON TABLE public.party_motto_votes IS 'Stores per-member votes for specific motto proposals.';
COMMENT ON COLUMN public.party_motto_votes.voter_member_id IS 'The party member casting the vote.';

-- 3) RLS
ALTER TABLE public.party_motto_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_motto_votes ENABLE ROW LEVEL SECURITY;

-- Proposals RLS
DROP POLICY IF EXISTS "Allow members to read proposals in their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to read proposals in their party"
ON public.party_motto_proposals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.party_id = party_id
  )
);

DROP POLICY IF EXISTS "Allow members to insert proposals for their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to insert proposals for their party"
ON public.party_motto_proposals
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.id = proposed_by_member_id
      AND pm.party_id = party_id
  )
);

-- Updates limited: normally only system/finalize API updates these flags; keep strict and do updates via service role from server code.
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
    JOIN public.party_motto_proposals p ON p.id = proposal_id
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
      AND pm.id = voter_member_id
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
      AND pm.id = voter_member_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.user_id = auth.uid()
      AND pm.id = voter_member_id
  )
);

-- Optional: allow delete own vote (we will keep strict; updates cover unvote by deleting server-side or upserting to different prop)
-- DROP POLICY ... FOR DELETE ...

-- 4) updated_at trigger for votes
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

-- 5) vote_count maintenance triggers on proposals
-- We will adjust proposal.vote_count on insert/delete of votes, and on update when voter switches proposals.

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

-- 6) Helper view (optional) to show proposals with party, proposer name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views WHERE viewname = 'v_party_motto_proposals'
  ) THEN
    CREATE VIEW public.v_party_motto_proposals AS
      SELECT
        pmp.id,
        pmp.party_id,
        pmp.proposed_by_member_id,
        pm.display_name AS proposed_by_name,
        pmp.text,
        pmp.vote_count,
        pmp.is_finalized,
        pmp.active,
        pmp.created_at
      FROM public.party_motto_proposals pmp
      LEFT JOIN public.party_members pm ON pm.id = pmp.proposed_by_member_id;
  END IF;
END$$;

-- 7) Indexes
CREATE INDEX IF NOT EXISTS idx_party_motto_proposals_party ON public.party_motto_proposals(party_id);
CREATE INDEX IF NOT EXISTS idx_party_motto_votes_proposal ON public.party_motto_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_party_motto_votes_voter ON public.party_motto_votes(voter_member_id);