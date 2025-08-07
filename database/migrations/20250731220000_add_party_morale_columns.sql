-- Migration: Add Party Morale fields to parties
-- Safe/idempotent: uses IF NOT EXISTS and constrained values

BEGIN;

-- Numeric morale score in [0..1] (not enforced here; computed by app logic)
ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS morale_score NUMERIC(5,4);

-- Morale level derived from score: 'Low' | 'Neutral' | 'High'
ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS morale_level TEXT
  CHECK (morale_level IN ('Low','Neutral','High'));

COMMENT ON COLUMN public.parties.morale_score IS 'Party Morale score in [0..1], computed from participation (completion, voting, proposals)';
COMMENT ON COLUMN public.parties.morale_level IS 'Derived morale band for UX display and tie-break logic: Low/Neutral/High';

COMMIT;