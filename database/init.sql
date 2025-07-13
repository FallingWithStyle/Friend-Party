-- FriendParty Initialization Script
-- This script is designed to be idempotent and can be run multiple times.

-- == 1. CLEAN SLATE ==
-- Drop all policies, functions, and tables to ensure a clean environment.
-- Note: Dropping is done in reverse order of creation to respect dependencies.

-- Drop Policies
DROP POLICY IF EXISTS "Allow members to insert their own answers" ON public.answers;
DROP POLICY IF EXISTS "Allow members to see answers in their party" ON public.answers;
DROP POLICY IF EXISTS "Allow all users to read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow members to insert motto proposals in their party" ON public.party_motto_proposals;
DROP POLICY IF EXISTS "Allow members to see motto proposals in their party" ON public.party_motto_proposals;
DROP POLICY IF EXISTS "Allow members to cast votes in their party" ON public.name_proposal_votes;
DROP POLICY IF EXISTS "Allow members to see votes in their party" ON public.name_proposal_votes;
DROP POLICY IF EXISTS "Allow members to insert proposals in their party" ON public.name_proposals;
DROP POLICY IF EXISTS "Allow members to see proposals in their party" ON public.name_proposals;
DROP POLICY IF EXISTS "Allow user to update their own adventurer name" ON public.party_members;
DROP POLICY IF EXISTS "Allow users to see members of their own parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow users to be added to parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow public read for parties" ON public.parties;
DROP POLICY IF EXISTS "Allow users to read parties they are a member of" ON public.parties;
DROP POLICY IF EXISTS "Allow authenticated users to create parties" ON public.parties;

-- Drop Functions
DROP FUNCTION IF EXISTS public.is_party_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_party_with_leader(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_party_and_leader(text, text, text, text, text);

-- Drop Tables
DROP TABLE IF EXISTS public.stats CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.name_proposal_votes CASCADE;
DROP TABLE IF EXISTS public.party_motto_proposals CASCADE;
DROP TABLE IF EXISTS public.name_proposals CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.party_members CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;


-- == 2. CREATE TABLES ==
-- Create all tables in the correct order to satisfy foreign key constraints.

CREATE TABLE IF NOT EXISTS public.stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);
COMMENT ON TABLE public.stats IS 'Stores the core D&D-style stats.';

INSERT INTO public.stats (id, name) VALUES
('STR', 'Strength'),
('DEX', 'Dexterity'),
('CON', 'Constitution'),
('INT', 'Intelligence'),
('WIS', 'Wisdom'),
('CHA', 'Charisma');

CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  motto TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'Lobby' NOT NULL
);
COMMENT ON TABLE public.parties IS 'Stores information about each party created.';
COMMENT ON COLUMN public.parties.status IS 'The current phase of the party (Lobby, Voting, ResultsReady).';

CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  is_leader BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'Joined' NOT NULL,
  adventurer_name TEXT,
  exp INTEGER DEFAULT 0 NOT NULL,
  strength INTEGER,
  dexterity INTEGER,
  constitution INTEGER,
  intelligence INTEGER,
  wisdom INTEGER,
  charisma INTEGER,
  character_class TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_party_user UNIQUE (party_id, user_id)
);
COMMENT ON TABLE public.party_members IS 'Stores information about each member within a party.';
COMMENT ON COLUMN public.party_members.status IS 'The current status of a party member (Joined, Voting, Finished).';

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    answer_options TEXT[] NOT NULL,
    stat_id TEXT REFERENCES public.stats(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.questions IS 'Stores the questions for the questionnaire.';
COMMENT ON COLUMN public.questions.question_type IS 'The type of question, used to determine when it is asked.';
COMMENT ON COLUMN public.questions.answer_options IS 'The possible answers for the question.';

CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    voter_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    subject_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    answer_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.answers IS 'Stores user answers to questionnaire questions.';
COMMENT ON COLUMN public.answers.voter_member_id IS 'The party member who is casting the vote/answer.';
COMMENT ON COLUMN public.answers.subject_member_id IS 'The party member who the answer is about. For self-assessment, this is the same as voter_member_id.';

CREATE TABLE IF NOT EXISTS public.name_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
    target_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    proposing_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    proposed_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
COMMENT ON TABLE public.name_proposals IS 'Stores proposed adventurer names for party members during a naming event.';
COMMENT ON COLUMN public.name_proposals.is_active IS 'Identifies the current active naming event for a user.';

CREATE TABLE IF NOT EXISTS public.name_proposal_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES public.name_proposals(id) ON DELETE CASCADE NOT NULL,
    voter_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (proposal_id, voter_member_id)
);
COMMENT ON TABLE public.name_proposal_votes IS 'Tracks votes for proposed adventurer names.';
COMMENT ON COLUMN public.name_proposal_votes.voter_member_id IS 'The party member who cast the vote.';

CREATE TABLE IF NOT EXISTS public.party_motto_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
    proposing_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    proposed_motto TEXT NOT NULL,
    votes INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.party_motto_proposals IS 'Stores proposed mottos for the party.';


-- == IMPORTANT NOTE ON SECURITY DEFINER ==
-- The `create_party_with_leader` function uses `SECURITY DEFINER`. This is a critical security-related setting.
--
-- What it does:
-- `SECURITY DEFINER` makes the function execute with the permissions of the user who *defined* the function (the "owner"),
-- not the user who is *calling* it. In Supabase, this is typically a superuser role.
--
-- Why it's necessary here:
-- This function needs to perform multiple actions in a single transaction:
--   1. INSERT a new row into the `parties` table.
--   2. INSERT a new row into the `party_members` table.
--   3. SELECT the newly created party data to return it.
--
-- The problem arises with Row-Level Security (RLS). Our RLS policy on `parties` states that a user can only read a party's details if they are a member of it.
-- When the function runs, the transaction is not fully committed until the very end. This means that when the final `SELECT` statement runs inside the function,
-- the calling user is not *yet* officially a member of the party, so RLS blocks the read, causing the function to fail.
--
-- By using `SECURITY DEFINER`, the function temporarily bypasses the calling user's RLS policies for the duration of its execution,
-- allowing it to successfully insert the records and return the result.
--
-- Security Implications:
-- Because `SECURITY DEFINER` functions run with elevated privileges, they must be written very carefully to prevent misuse.
-- Any parameters passed to them should be handled securely to avoid SQL injection or unintended side effects.
-- In this case, the function is safe as it only uses the provided parameters for `INSERT` operations.
--
-- DO NOT REMOVE `SECURITY DEFINER` from this function without a deep understanding of the RLS implications.
-- == 3. CREATE FUNCTIONS ==

CREATE OR REPLACE FUNCTION public.create_party_with_leader(
  party_code TEXT,
  party_name TEXT,
  party_motto TEXT,
  leader_name TEXT,
  leader_email TEXT
)
RETURNS JSON AS $$
DECLARE
  new_party_id UUID;
  new_party JSON;
BEGIN
  INSERT INTO public.parties (code, name, motto)
  VALUES (party_code, party_name, party_motto)
  RETURNING id INTO new_party_id;

  INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, email)
  VALUES (new_party_id, auth.uid(), leader_name, true, leader_email);

  SELECT json_build_object('id', p.id, 'code', p.code, 'name', p.name, 'motto', p.motto)
  INTO new_party
  FROM public.parties p
  WHERE p.id = new_party_id;

  RETURN new_party;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_party_member(party_id_to_check UUID, user_id_to_check UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.party_members
    WHERE party_id = party_id_to_check AND user_id = user_id_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- == 4. ENABLE RLS & CREATE POLICIES ==

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_motto_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to create parties" ON public.parties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to read parties they are a member of" ON public.parties FOR SELECT TO authenticated USING (is_party_member(id, auth.uid()));

CREATE POLICY "Allow users to be added to parties" ON public.party_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to see members of their own parties" ON public.party_members FOR SELECT TO authenticated USING (is_party_member(party_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Allow user to update their own adventurer name" ON public.party_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all users to read questions" ON public.questions FOR SELECT USING (true);

CREATE POLICY "Allow members to see answers in their party" ON public.answers FOR SELECT USING (is_party_member((SELECT party_id FROM party_members WHERE id = voter_member_id), auth.uid()));
CREATE POLICY "Allow members to insert their own answers" ON public.answers FOR INSERT WITH CHECK (voter_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));

CREATE POLICY "Allow members to see proposals in their party" ON public.name_proposals FOR SELECT USING (is_party_member(party_id, auth.uid()));
CREATE POLICY "Allow members to insert proposals in their party" ON public.name_proposals FOR INSERT WITH CHECK (proposing_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));

CREATE POLICY "Allow members to see votes in their party" ON public.name_proposal_votes FOR SELECT USING ((SELECT is_party_member(party_id, auth.uid()) FROM name_proposals WHERE id = proposal_id));
CREATE POLICY "Allow members to cast votes in their party" ON public.name_proposal_votes FOR INSERT WITH CHECK (voter_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));

CREATE POLICY "Allow members to see motto proposals in their party" ON public.party_motto_proposals FOR SELECT USING (is_party_member(party_id, auth.uid()));
CREATE POLICY "Allow members to insert motto proposals in their party" ON public.party_motto_proposals FOR INSERT WITH CHECK (proposing_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));


-- == 5. SEED DEBUG DATA ==
-- This section seeds a debug party for immediate testing after a reset.
-- NOTE: This requires a user to exist in the `auth.users` table with the
-- specific UUID '00000000-0000-0000-0000-000000000001'.
-- You can create this user manually in the Supabase dashboard if they do not exist.

DO $$
DECLARE
  debug_party_id UUID;
  debug_user_id UUID := 'fcd61a1f-9393-414b-8048-65a2f3ca8095';
BEGIN
  -- Create the debug party, ensuring the code is unique
  INSERT INTO public.parties (code, name, motto)
  VALUES ('DEBUG1', 'The Great Debuggers', 'Occidere omnia insectorum')
  ON CONFLICT (code) DO NOTHING
  RETURNING id INTO debug_party_id;

  -- Create the debug party leader if the party was created
  IF debug_party_id IS NOT NULL THEN
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader)
    VALUES (debug_party_id, debug_user_id, 'David Bugg', true)
    ON CONFLICT (party_id, user_id) DO NOTHING;
  END IF;
END $$;
