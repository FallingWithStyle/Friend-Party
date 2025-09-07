-- FriendParty Initialization Script
-- This script is designed to be idempotent and can be run multiple times.

-- == 1. CLEAN SLATE ==
-- Drop all policies, functions, and tables to ensure a clean environment.
-- Note: Dropping is done in reverse order of creation to respect dependencies.

-- Drop Policies
DROP POLICY IF EXISTS "Allow members to see their own assessment assignments" ON public.peer_assessment_assignments;
DROP POLICY IF EXISTS "Allow members to insert their own assessment assignments" ON public.peer_assessment_assignments;
DROP POLICY IF EXISTS "Allow members to insert their own answers" ON public.answers;
DROP POLICY IF EXISTS "Allow members to see answers in their party" ON public.answers;
DROP POLICY IF EXISTS "Allow all users to read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow members to insert motto proposals in their party" ON public.party_motto_proposals;
DROP POLICY IF EXISTS "Allow members to see motto proposals in their party" ON public.party_motto_proposals;
-- Guard DROPs for party_motto_votes only if the table exists to avoid 42P01 during init
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='party_motto_votes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "pm_motto_votes_select" ON public.party_motto_votes';
    EXECUTE 'DROP POLICY IF EXISTS "pm_motto_votes_insert" ON public.party_motto_votes';
    EXECUTE 'DROP POLICY IF EXISTS "pm_motto_votes_update" ON public.party_motto_votes';
    EXECUTE 'DROP POLICY IF EXISTS "pm_motto_votes_delete" ON public.party_motto_votes';
  END IF;
END $$;
DROP POLICY IF EXISTS "pm_motto_update_leader" ON public.party_motto_proposals;
DROP POLICY IF EXISTS "Allow members to cast votes in their party" ON public.name_proposal_votes;
DROP POLICY IF EXISTS "Allow members to see votes in their party" ON public.name_proposal_votes;
DROP POLICY IF EXISTS "Allow members to insert proposals in their party" ON public.name_proposals;
DROP POLICY IF EXISTS "Allow members to see proposals in their party" ON public.name_proposals;
DROP POLICY IF EXISTS "Allow user to update their own adventurer name" ON public.party_members;
DROP POLICY IF EXISTS "Allow user to update their own assessment status" ON public.party_members;
DROP POLICY IF EXISTS "Allow users to see members of their own parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow users to be added to parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow public read for parties" ON public.parties;
DROP POLICY IF EXISTS "Allow users to read parties they are a member of" ON public.parties;
DROP POLICY IF EXISTS "Allow authenticated users to create parties" ON public.parties;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.profiles;

-- Drop Functions
DROP FUNCTION IF EXISTS public.is_party_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_party_with_leader(text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.generate_peer_assessment_distribution(uuid);

-- Drop Tables
DROP TABLE IF EXISTS public.dragons_hoard_hoard CASCADE;
DROP TABLE IF EXISTS public.dragons_hoard_votes CASCADE;
DROP TABLE IF EXISTS public.dragons_hoard_matchups CASCADE;
DROP TABLE IF EXISTS public.dragons_hoard_loot CASCADE;
DROP TABLE IF EXISTS public.dragons_hoard_prompts CASCADE;
DROP TABLE IF EXISTS public.minigame_rewards CASCADE;
DROP TABLE IF EXISTS public.minigame_participants CASCADE;
DROP TABLE IF EXISTS public.minigame_sessions CASCADE;
DROP TABLE IF EXISTS public.minigame_config CASCADE;
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.name_proposal_votes CASCADE;
DROP TABLE IF EXISTS public.party_motto_votes CASCADE;
DROP TABLE IF EXISTS public.party_motto_proposals CASCADE;
DROP TABLE IF EXISTS public.name_proposals CASCADE;
DROP TABLE IF EXISTS public.peer_assessment_assignments CASCADE;
DROP TABLE IF EXISTS public.party_members CASCADE;
DROP TABLE IF EXISTS public.parties CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.stats CASCADE;


-- == 2. CREATE TABLES ==
CREATE TABLE IF NOT EXISTS public.stats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);
COMMENT ON TABLE public.stats IS 'Stores the core D&D-style stats.';

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information including names.';

CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  motto TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'Lobby' NOT NULL
);
COMMENT ON TABLE public.parties IS 'Stores information about each party created.';
COMMENT ON COLUMN public.parties.status IS 'The current phase of the party (Lobby, Self Assessment, Peer Assessment, Results).';

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
  class TEXT,
  assessment_status TEXT DEFAULT 'NotStarted' NOT NULL,
  is_npc BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_party_user UNIQUE (party_id, user_id)
);
COMMENT ON TABLE public.party_members IS 'Stores information about each member within a party.';
COMMENT ON COLUMN public.party_members.status IS 'The current status of a party member (Joined, Voting, Finished).';

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    answer_options JSONB NOT NULL,
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
    proposed_by_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    "text" TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.party_motto_proposals IS 'Motto proposals for a party along with aggregated vote_count and finalization flags.';
COMMENT ON COLUMN public.party_motto_proposals.text IS 'The proposed motto text.';
COMMENT ON COLUMN public.party_motto_proposals.vote_count IS 'Cached count of votes, maintained via triggers.';
COMMENT ON COLUMN public.party_motto_proposals.is_finalized IS 'True if this proposal was chosen as the final party motto.';
COMMENT ON COLUMN public.party_motto_proposals.active IS 'False if proposals are closed; used to disable further voting when finalized.';

-- Helpful uniqueness to avoid duplicate identical proposals by same member while active
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

-- Votes table for party motto proposals (normalized)
CREATE TABLE IF NOT EXISTS public.party_motto_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES public.party_motto_proposals(id) ON DELETE CASCADE NOT NULL,
    voter_member_id UUID REFERENCES public.party_members(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (proposal_id, voter_member_id)
);
COMMENT ON TABLE public.party_motto_votes IS 'Tracks votes for proposed party mottos.';
COMMENT ON COLUMN public.party_motto_votes.voter_member_id IS 'The party member who cast the vote.';

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

-- == MINIGAME FRAMEWORK TABLES ==

-- Minigame configuration table
CREATE TABLE IF NOT EXISTS public.minigame_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_type VARCHAR(50) NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(minigame_type, config_key)
);
COMMENT ON TABLE public.minigame_config IS 'Configuration settings for different minigame types';
COMMENT ON COLUMN public.minigame_config.minigame_type IS 'Type of minigame (e.g., dragons_hoard, changeling)';
COMMENT ON COLUMN public.minigame_config.config_key IS 'Configuration key name';
COMMENT ON COLUMN public.minigame_config.config_value IS 'Configuration value as JSON';

-- Minigame sessions table
CREATE TABLE IF NOT EXISTS public.minigame_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  minigame_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  game_data JSONB,
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR 
    (status != 'completed' AND completed_at IS NULL)
  )
);
COMMENT ON TABLE public.minigame_sessions IS 'Tracks individual minigame sessions for any minigame type';
COMMENT ON COLUMN public.minigame_sessions.minigame_type IS 'Type of minigame being played';
COMMENT ON COLUMN public.minigame_sessions.status IS 'Current status of the minigame session';
COMMENT ON COLUMN public.minigame_sessions.game_data IS 'Minigame-specific data stored as JSON';

-- Minigame participants table
CREATE TABLE IF NOT EXISTS public.minigame_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.minigame_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  left_at TIMESTAMPTZ,
  participant_data JSONB,
  UNIQUE(session_id, user_id)
);
COMMENT ON TABLE public.minigame_participants IS 'Tracks who participated in each minigame session';
COMMENT ON COLUMN public.minigame_participants.participant_data IS 'Minigame-specific participant data as JSON';

-- Minigame rewards table
CREATE TABLE IF NOT EXISTS public.minigame_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.minigame_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL,
  reward_data JSONB NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.minigame_rewards IS 'Tracks rewards awarded to users from minigames';
COMMENT ON COLUMN public.minigame_rewards.reward_type IS 'Type of reward (xp, achievement, avatar_part, etc.)';
COMMENT ON COLUMN public.minigame_rewards.reward_data IS 'Reward-specific data as JSON';

-- == DRAGON'S HOARD MINIGAME TABLES ==

-- Dragon's Hoard prompts table
CREATE TABLE IF NOT EXISTS public.dragons_hoard_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.dragons_hoard_prompts IS 'Prompts for Dragon''s Hoard loot creation';
COMMENT ON COLUMN public.dragons_hoard_prompts.category IS 'Prompt category (cursed_items, goblin_market, dragon_secrets, cooking_weapons)';
COMMENT ON COLUMN public.dragons_hoard_prompts.prompt_text IS 'The prompt text with placeholders for player names';

-- Dragon's Hoard loot table
CREATE TABLE IF NOT EXISTS public.dragons_hoard_loot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.minigame_sessions(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.dragons_hoard_prompts(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.dragons_hoard_loot IS 'Loot items created by players in Dragon''s Hoard';
COMMENT ON COLUMN public.dragons_hoard_loot.creator_id IS 'User who created this loot item';
COMMENT ON COLUMN public.dragons_hoard_loot.prompt_id IS 'Prompt that inspired this loot item';

-- Dragon's Hoard matchups table
CREATE TABLE IF NOT EXISTS public.dragons_hoard_matchups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.minigame_sessions(id) ON DELETE CASCADE,
  loot_a_id UUID NOT NULL REFERENCES public.dragons_hoard_loot(id) ON DELETE CASCADE,
  loot_b_id UUID NOT NULL REFERENCES public.dragons_hoard_loot(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  CONSTRAINT different_loot CHECK (loot_a_id != loot_b_id)
);
COMMENT ON TABLE public.dragons_hoard_matchups IS 'Head-to-head matchups between loot items';
COMMENT ON COLUMN public.dragons_hoard_matchups.round_number IS 'Round number for this matchup';
COMMENT ON COLUMN public.dragons_hoard_matchups.status IS 'Current status of the matchup';

-- Dragon's Hoard votes table
CREATE TABLE IF NOT EXISTS public.dragons_hoard_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id UUID NOT NULL REFERENCES public.dragons_hoard_matchups(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for_loot_id UUID NOT NULL REFERENCES public.dragons_hoard_loot(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(matchup_id, voter_id)
);
COMMENT ON TABLE public.dragons_hoard_votes IS 'Votes cast in Dragon''s Hoard matchups';
COMMENT ON COLUMN public.dragons_hoard_votes.voted_for_loot_id IS 'Loot item that received the vote';

-- Dragon's Hoard hoard table (persistent collection)
CREATE TABLE IF NOT EXISTS public.dragons_hoard_hoard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  loot_id UUID NOT NULL REFERENCES public.dragons_hoard_loot(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(party_id, loot_id)
);
COMMENT ON TABLE public.dragons_hoard_hoard IS 'Persistent collection of winning loot items for each party';
COMMENT ON COLUMN public.dragons_hoard_hoard.party_id IS 'Party that owns this hoard';
COMMENT ON COLUMN public.dragons_hoard_hoard.loot_id IS 'Winning loot item added to the hoard';

-- == 3. CREATE FUNCTIONS ==
CREATE OR REPLACE FUNCTION public.create_party_with_leader(
  p_party_code TEXT,
  p_party_name TEXT,
  p_party_motto TEXT,
  p_leader_name TEXT,
  p_leader_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  new_party_id UUID;
  new_party JSON;
BEGIN
  INSERT INTO public.parties (code, name, motto)
  VALUES (p_party_code, p_party_name, p_party_motto)
  RETURNING id INTO new_party_id;

  INSERT INTO public.party_members (party_id, user_id, first_name, is_leader)
  VALUES (new_party_id, p_leader_user_id, p_leader_name, true);

  SELECT json_build_object(
    'id', p.id,
    'code', p.code,
    'name', p.name,
    'motto', p.motto,
    'user_id', p_leader_user_id
  )
  INTO new_party
  FROM public.parties p
  WHERE p.id = new_party_id;

  RETURN new_party;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_peer_assessment_distribution(p_party_id UUID)
RETURNS void AS $$
DECLARE
    members UUID[];
    questions_to_assign UUID[];
    assessor UUID;
    subject UUID;
    q_id UUID;
    assignments_created BOOLEAN;
BEGIN
    -- Check if assignments have already been created for this party
    SELECT EXISTS (
        SELECT 1
        FROM public.peer_assessment_assignments
        WHERE party_id = p_party_id
    ) INTO assignments_created;

    IF assignments_created THEN
        RAISE NOTICE 'Peer assessment assignments have already been generated for party %.', p_party_id;
        RETURN;
    END IF;

    -- Get all members of the party
    SELECT array_agg(id) INTO members
    FROM public.party_members
    WHERE party_id = p_party_id;

    -- Get all peer-assessment questions
    SELECT array_agg(id) INTO questions_to_assign
    FROM public.questions
    WHERE question_type = 'peer-assessment';

    -- Loop through each question and create assignments
    FOREACH q_id IN ARRAY questions_to_assign
    LOOP
        -- For each member, assign them to assess every other member
        FOREACH assessor IN ARRAY members
        LOOP
            FOREACH subject IN ARRAY members
            LOOP
                -- A member does not assess themselves in peer-assessment
                IF assessor <> subject THEN
                    INSERT INTO public.peer_assessment_assignments
                        (party_id, question_id, assessor_member_id, subject_member_id)
                    VALUES
                        (p_party_id, q_id, assessor, subject)
                    ON CONFLICT DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.generate_peer_assessment_distribution(UUID) IS 'Generates a round-robin distribution of peer assessment assignments for a given party, ensuring each member assesses every other member for each peer-assessment question.';

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
ALTER TABLE public.party_motto_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_assessment_assignMENTS ENABLE ROW LEVEL SECURITY;

-- Policies for public.parties
CREATE POLICY "Allow authenticated users to create parties" ON public.parties FOR INSERT TO authenticated WITH CHECK (true);
-- Tighten SELECT to members-only for consistency with UI expectations
DROP POLICY IF EXISTS "Allow users to read parties they are a member of" ON public.parties;
CREATE POLICY "Allow users to read parties they are a member of" ON public.parties FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.party_members pm WHERE pm.party_id = parties.id AND pm.user_id = auth.uid())
);

-- Policies for public.profiles
CREATE POLICY "Allow authenticated users to read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Policies for public.party_members
CREATE POLICY "Allow users to be added to parties" ON public.party_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow users to see members of their own parties" ON public.party_members FOR SELECT TO authenticated USING (is_party_member(party_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Allow user to update their own adventurer name" ON public.party_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user to update their own assessment status" ON public.party_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for public.questions
CREATE POLICY "Allow all users to read questions" ON public.questions FOR SELECT USING (true);

-- Policies for public.answers
CREATE POLICY "Allow members to see answers in their party" ON public.answers FOR SELECT USING (is_party_member((SELECT party_id FROM party_members WHERE id = voter_member_id), auth.uid()));
CREATE POLICY "Allow members to insert their own answers" ON public.answers FOR INSERT WITH CHECK (voter_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));

-- Policies for public.name_proposals
CREATE POLICY "Allow members to see proposals in their party" ON public.name_proposals FOR SELECT USING (is_party_member(party_id, auth.uid()));
CREATE POLICY "Allow members to insert proposals in their party" ON public.name_proposals FOR INSERT WITH CHECK (proposing_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));

-- Policies for public.name_proposal_votes
CREATE POLICY "Allow members to see votes in their party" ON public.name_proposal_votes FOR SELECT USING ((SELECT is_party_member(party_id, auth.uid()) FROM name_proposals WHERE id = proposal_id));
CREATE POLICY "Allow members to cast votes in their party" ON public.name_proposal_votes FOR INSERT WITH CHECK (voter_member_id IN (SELECT id FROM party_members WHERE user_id = auth.uid()));

-- Policies for public.party_motto_proposals
DROP POLICY IF EXISTS "Allow members to see motto proposals in their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to see motto proposals in their party" ON public.party_motto_proposals
FOR SELECT TO authenticated USING (
  is_party_member(party_id, auth.uid())
);

DROP POLICY IF EXISTS "Allow members to insert motto proposals in their party" ON public.party_motto_proposals;
CREATE POLICY "Allow members to insert motto proposals in their party" ON public.party_motto_proposals
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.id = public.party_motto_proposals.proposed_by_member_id
      AND pm.party_id = public.party_motto_proposals.party_id
      AND pm.user_id = auth.uid()
  )
);

-- Optional: leader-only updates for finalize/deactivate when not using service role
DROP POLICY IF EXISTS "pm_motto_update_leader" ON public.party_motto_proposals;
CREATE POLICY "pm_motto_update_leader" ON public.party_motto_proposals
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.party_id = public.party_motto_proposals.party_id
      AND pm.user_id = auth.uid()
      AND pm.is_leader = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.party_id = public.party_motto_proposals.party_id
      AND pm.user_id = auth.uid()
      AND pm.is_leader = true
  )
);

-- Policies for public.party_motto_votes (create only if table exists)
-- Votes RLS (normalized)
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
    JOIN public.party_members me ON me.party_id = p_new.party_id
    WHERE public.party_motto_votes.proposal_id = p_new.id
      AND public.party_motto_votes.voter_member_id = me.id
      AND me.user_id = auth.uid()
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

-- Policies for public.peer_assessment_assignments
CREATE POLICY "Allow members to see their own assessment assignments" ON public.peer_assessment_assignments FOR SELECT TO authenticated USING (assessor_member_id IN (SELECT id FROM public.party_members WHERE user_id = auth.uid()));
CREATE POLICY "Allow members to insert their own assessment assignments" ON public.peer_assessment_assignments FOR INSERT TO authenticated WITH CHECK (assessor_member_id IN (SELECT id FROM public.party_members WHERE user_id = auth.uid()));

-- Enable RLS for minigame tables
ALTER TABLE public.minigame_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minigame_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minigame_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minigame_rewards ENABLE ROW LEVEL SECURITY;

-- Enable RLS for Dragon's Hoard tables
ALTER TABLE public.dragons_hoard_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dragons_hoard_loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dragons_hoard_matchups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dragons_hoard_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dragons_hoard_hoard ENABLE ROW LEVEL SECURITY;

-- Policies for public.minigame_config
CREATE POLICY "Allow all users to read minigame config" ON public.minigame_config FOR SELECT USING (true);

-- Policies for public.minigame_sessions
CREATE POLICY "Allow party members to see minigame sessions" ON public.minigame_sessions FOR SELECT TO authenticated USING (
  is_party_member(party_id, auth.uid())
);
CREATE POLICY "Allow party members to create minigame sessions" ON public.minigame_sessions FOR INSERT TO authenticated WITH CHECK (
  is_party_member(party_id, auth.uid())
);
CREATE POLICY "Allow party members to update minigame sessions" ON public.minigame_sessions FOR UPDATE TO authenticated USING (
  is_party_member(party_id, auth.uid())
);

-- Policies for public.minigame_participants
CREATE POLICY "Allow party members to see minigame participants" ON public.minigame_participants FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow users to join minigame sessions" ON public.minigame_participants FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow users to update their own participation" ON public.minigame_participants FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid()
);

-- Policies for public.minigame_rewards
CREATE POLICY "Allow users to see their own minigame rewards" ON public.minigame_rewards FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow system to create minigame rewards" ON public.minigame_rewards FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);

-- Policies for public.dragons_hoard_prompts
CREATE POLICY "Allow all users to read Dragon's Hoard prompts" ON public.dragons_hoard_prompts FOR SELECT USING (is_active = true);

-- Policies for public.dragons_hoard_loot
CREATE POLICY "Allow party members to see Dragon's Hoard loot" ON public.dragons_hoard_loot FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow users to create Dragon's Hoard loot" ON public.dragons_hoard_loot FOR INSERT TO authenticated WITH CHECK (
  creator_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);

-- Policies for public.dragons_hoard_matchups
CREATE POLICY "Allow party members to see Dragon's Hoard matchups" ON public.dragons_hoard_matchups FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow party members to create Dragon's Hoard matchups" ON public.dragons_hoard_matchups FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow party members to update Dragon's Hoard matchups" ON public.dragons_hoard_matchups FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    WHERE ms.id = session_id AND is_party_member(ms.party_id, auth.uid())
  )
);

-- Policies for public.dragons_hoard_votes
CREATE POLICY "Allow party members to see Dragon's Hoard votes" ON public.dragons_hoard_votes FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    JOIN public.dragons_hoard_matchups dm ON dm.session_id = ms.id
    WHERE dm.id = matchup_id AND is_party_member(ms.party_id, auth.uid())
  )
);
CREATE POLICY "Allow users to vote in Dragon's Hoard" ON public.dragons_hoard_votes FOR INSERT TO authenticated WITH CHECK (
  voter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.minigame_sessions ms 
    JOIN public.dragons_hoard_matchups dm ON dm.session_id = ms.id
    WHERE dm.id = matchup_id AND is_party_member(ms.party_id, auth.uid())
  )
);

-- Policies for public.dragons_hoard_hoard
CREATE POLICY "Allow party members to see Dragon's Hoard collection" ON public.dragons_hoard_hoard FOR SELECT TO authenticated USING (
  is_party_member(party_id, auth.uid())
);
CREATE POLICY "Allow system to add to Dragon's Hoard collection" ON public.dragons_hoard_hoard FOR INSERT TO authenticated WITH CHECK (
  is_party_member(party_id, auth.uid())
);

-- == 5. SEED INITIAL DATA ==

INSERT INTO public.dragons_hoard_prompts (prompt_text, category) VALUES
-- Goblin Market (20 prompts)
('The most useless item you could buy at a goblin market.', 'goblin_market'),
('A goblin market stall sells this surprisingly inconvenient item.', 'goblin_market'),
('A goblin market item that has a very specific, mysterious purpose.', 'goblin_market'),
('A goblin market sells an item that was clearly made by someone who misunderstood the assignment.', 'goblin_market'),
('A trap in a goblin market alley that makes absolutely no sense.', 'goblin_market'),
('Something hidden under a goblin market table no one notices.', 'goblin_market'),
('A goblin market vendor insists this item is "very rare" but won''t explain why.', 'goblin_market'),
('An item at a goblin market that nobody knows how to use.', 'goblin_market'),
('Something a goblin enchanted for reasons no one remembers.', 'goblin_market'),
('A goblin market sells this item that defies all expectations.', 'goblin_market'),
('A goblin market has this confusing bargain bin item.', 'goblin_market'),
('A goblin vendor hides this bizarre item from customers.', 'goblin_market'),
('A cursed goblin trinket that behaves strangely.', 'goblin_market'),
('The weirdest "common" item at a goblin market.', 'goblin_market'),
('A magical snack sold by goblins with unusual effects.', 'goblin_market'),
('A goblin market item that nobody would ever want—but someone buys it.', 'goblin_market'),
('An ordinary object in a goblin market that is secretly magical.', 'goblin_market'),
('A goblin sells this object claiming it''s "ancient and powerful."', 'goblin_market'),
('Something a goblin uses as a disguise for their loot.', 'goblin_market'),
('An item at a goblin market that makes absolutely no sense.', 'goblin_market'),

-- Dragon's Hoard (20 prompts)
('A dragon''s hoard contains this embarrassing object.', 'dragons_hoard'),
('The most ridiculous decoration in a dragon''s hoard.', 'dragons_hoard'),
('The most awkwardly magical item in a dragon''s hoard.', 'dragons_hoard'),
('An object in a dragon''s private collection with an unexpected magical effect.', 'dragons_hoard'),
('A dragon uses this to prank other dragons.', 'dragons_hoard'),
('A gemstone in a dragon''s hoard with a totally unexpected property.', 'dragons_hoard'),
('A magical creature hoards this for sentimental reasons.', 'dragons_hoard'),
('An object a dragon treasures for mysterious reasons.', 'dragons_hoard'),
('The strangest gem a dragon refuses to part with.', 'dragons_hoard'),
('A dragon accidentally enchanted this as a joke.', 'dragons_hoard'),
('Something a dragon considers an utterly useless treasure.', 'dragons_hoard'),
('A cursed object hidden in a dragon''s hoard.', 'dragons_hoard'),
('An oddly shaped treasure a dragon refuses to sell.', 'dragons_hoard'),
('An item a dragon keeps for its bizarre smell or texture.', 'dragons_hoard'),
('A dragon''s hoard contains a treasure that seems alive.', 'dragons_hoard'),
('A dragon secretly collects mundane items in elaborate ways.', 'dragons_hoard'),
('A dragon uses this item as a puzzle for intruders.', 'dragons_hoard'),
('A dragon keeps an item purely because it''s ridiculous.', 'dragons_hoard'),
('A magical object in a dragon''s hoard that changes form constantly.', 'dragons_hoard'),
('Something in a dragon''s hoard that clearly does nothing… or does it?', 'dragons_hoard'),

-- Wizard's Tower / Spellbook Collection (15 prompts)
('The strangest item a wizard collects as part of their hobby.', 'wizards_tower'),
('An object a wizard keeps that inspires curiosity and confusion.', 'wizards_tower'),
('An object in a wizard''s collection that does something confusing.', 'wizards_tower'),
('A magical item in a wizard''s spellbook collection that does something confusing.', 'wizards_tower'),
('A wizard''s failed experiment now worshipped as art.', 'wizards_tower'),
('A wizard''s failed experiment is now a fashionable hat.', 'wizards_tower'),
('A confusing potion label in a wizard''s tower.', 'wizards_tower'),
('A magical scroll with instructions for an oddly specific task.', 'wizards_tower'),
('A magical scroll that seems ordinary but has a surprising effect when read.', 'wizards_tower'),
('An enchanted object that has a completely useless power.', 'wizards_tower'),
('Something a wizard enchanted for reasons no one remembers.', 'wizards_tower'),
('A wizard''s spellbook contains a magical object nobody expected.', 'wizards_tower'),
('A wizard collects an item that defies all logic.', 'wizards_tower'),
('A wizard''s hoard contains an item that constantly changes.', 'wizards_tower'),
('A magical item a wizard treasures for mysterious reasons.', 'wizards_tower'),

-- Rogue's Hideout (10 prompts)
('A rogue''s hideout has a trap disguised as this ordinary object.', 'rogues_hideout'),
('A rogue''s hideout contains this completely unnecessary gadget.', 'rogues_hideout'),
('A rogue''s hideout contains this item that makes no sense as a trap.', 'rogues_hideout'),
('A rogue''s hideout has this completely normal item that somehow triggers all the other traps.', 'rogues_hideout'),
('An ordinary object in a rogue''s hideout that is secretly magical.', 'rogues_hideout'),
('A rogue keeps an item purely for amusement.', 'rogues_hideout'),
('A trap disguised as something mundane in a rogue''s hideout.', 'rogues_hideout'),
('Something a rogue uses to confuse intruders.', 'rogues_hideout'),
('A rogue keeps this bizarre item locked away for no reason.', 'rogues_hideout'),
('A rogue''s hoard contains an item that behaves unpredictably.', 'rogues_hideout'),

-- Cursed Tomb / Haunted Locations (10 prompts)
('Something a cursed tomb refuses to let you take.', 'cursed_tomb'),
('A cursed tomb contains this item nobody expected to be magical.', 'cursed_tomb'),
('A cursed tomb contains this item that everyone expected to be magical but isn''t.', 'cursed_tomb'),
('A haunted item a necromancer treasures for mysterious reasons.', 'cursed_tomb'),
('A cursed object in a tomb with a strange effect.', 'cursed_tomb'),
('Something in a tomb that seems ordinary but is secretly cursed.', 'cursed_tomb'),
('A haunted relic in a tomb nobody understands.', 'cursed_tomb'),
('An object in a cursed tomb that constantly changes.', 'cursed_tomb'),
('A tomb contains a treasure that defies all logic.', 'cursed_tomb'),
('A cursed item in a tomb that acts strangely when touched.', 'cursed_tomb'),

-- Pirate / Underwater Loot (10 prompts)
('Something a mermaid hoards in a sunken treasure chest.', 'pirate_underwater'),
('A mermaid keeps this completely useless treasure for decoration.', 'pirate_underwater'),
('A mermaid hoards this ridiculous luxury item.', 'pirate_underwater'),
('An item in a sunken chest that behaves oddly underwater.', 'pirate_underwater'),
('Something a mermaid treasures that no one would expect.', 'pirate_underwater'),
('A pirate''s chest contains an item with a very strange or unexpected use.', 'pirate_underwater'),
('A pirate''s chest contains an item that looks valuable but is completely worthless.', 'pirate_underwater'),
('A pirate''s chest contains this item that''s completely impossible to use.', 'pirate_underwater'),
('An item in a pirate''s chest that seems ordinary but has a bizarre effect.', 'pirate_underwater'),
('A pirate hides a strange object in a chest to confuse thieves.', 'pirate_underwater'),

-- Giant / Forest / Druid Loot (5 prompts)
('Something a giant uses as furniture in their cave.', 'giant_forest'),
('A giant accidentally turned this into a weapon.', 'giant_forest'),
('A giant accidentally enchanted this as a toy.', 'giant_forest'),
('A forest druid grows this as a "practical" item.', 'giant_forest'),
('A druid keeps this mysterious object in their forest hut.', 'giant_forest'),

-- Knight Armory / Tavern (10 prompts)
('A weapon in a knight''s armory that does something very weird.', 'knight_tavern'),
('A sword with a very unusual or surprising effect when used.', 'knight_tavern'),
('The weakest weapon in a knight''s collection.', 'knight_tavern'),
('A weapon that does something completely unexpected.', 'knight_tavern'),
('A knight accidentally enchanted this weapon for bizarre results.', 'knight_tavern'),
('Something hidden under a tavern table no one notices.', 'knight_tavern'),
('Something a tavern patron left behind that everyone assumes is trash.', 'knight_tavern'),
('Something a tavern owner hides behind the bar.', 'knight_tavern'),
('A tavern has an object that behaves oddly when touched.', 'knight_tavern'),
('An item in a tavern that everyone ignores but is secretly magical.', 'knight_tavern');

INSERT INTO public.stats (id, name) VALUES
('STR', 'Strength'),
('DEX', 'Dexterity'),
('CON', 'Constitution'),
('INT', 'Intelligence'),
('WIS', 'Wisdom'),
('CHA', 'Charisma')
ON CONFLICT (id) DO NOTHING;


-- == 6. SEED DEBUG DATA ==
-- This section seeds a debug party for immediate testing after a reset.
-- NOTE: This requires a user to exist in the `auth.users` table with the
-- specific UUID 'fcd61a1f-9393-414b-8048-65a2f3ca8095'.
-- You can create this user manually in the Supabase dashboard if they do not exist.
DO $$
DECLARE
  debug_party_id UUID;
  debug_user_id UUID := 'fcd61a1f-9393-414b-8048-65a2f3ca8095';
  david_bugg_user_id UUID := '11111111-2222-3333-4444-555555555555';
BEGIN
  -- Create the debug party, ensuring the code is unique
  INSERT INTO public.parties (code, name, motto)
  VALUES ('DEBUG1', 'The Randoms', 'Occidere omnia insectorum')
  ON CONFLICT (code) DO NOTHING;

  -- Always resolve debug_party_id so subsequent statements are idempotent and scoped
  SELECT id INTO debug_party_id FROM public.parties WHERE code = 'DEBUG1' LIMIT 1;

  -- Create the debug party leader if the party was created
  IF debug_party_id IS NOT NULL THEN
    -- Ensure a distinct auth user exists for David Bugg (or leave NULL if you prefer NPC without account)
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('11111111-2222-3333-4444-555555555555', 'david.bugg@test.com', crypt('password123', gen_salt('bf')), 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- Make David Bugg an NPC leader but with his own user_id to avoid using Patrick's
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (debug_party_id, '11111111-2222-3333-4444-555555555555', 'David Bugg', true, 'Joined', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc;

    -- Seed leader-proposed motto for DEBUG1 (idempotent; remove nested DO usage)
    PERFORM 1 FROM public.party_motto_proposals pmp
    WHERE pmp.party_id = debug_party_id
      AND pmp.proposed_by_member_id = (
        SELECT pm.id FROM public.party_members pm
        WHERE pm.party_id = debug_party_id AND pm.is_leader = TRUE
        ORDER BY pm.created_at LIMIT 1
      );

    IF NOT FOUND THEN
      INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
      SELECT p.id, pm.id, p.motto
      FROM public.parties p
      JOIN public.party_members pm ON pm.party_id = p.id AND pm.is_leader = TRUE
      WHERE p.id = debug_party_id
        AND p.motto IS NOT NULL
        AND length(trim(p.motto)) > 0
      ON CONFLICT DO NOTHING;
    END IF;

    -- Seed leader-proposed motto for DEBUG1 (idempotent; no nested DO scope)
    PERFORM 1 FROM public.party_motto_proposals pmp
    WHERE pmp.party_id = debug_party_id
      AND pmp.proposed_by_member_id = (
        SELECT pm.id FROM public.party_members pm
        WHERE pm.party_id = debug_party_id AND pm.is_leader = TRUE
        ORDER BY pm.created_at LIMIT 1
      );

    IF NOT FOUND THEN
      INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
      SELECT debug_party_id, pm.id, p.motto
      FROM public.parties p
      JOIN public.party_members pm ON pm.party_id = p.id AND pm.is_leader = TRUE
      WHERE p.id = debug_party_id
        AND p.motto IS NOT NULL
        AND length(trim(p.motto)) > 0
      ON CONFLICT DO NOTHING;
    END IF;

    -- Leader motto proposal seed for DEBUG1 (idempotent)
    IF debug_party_id IS NOT NULL THEN
      PERFORM 1 FROM public.party_motto_proposals
      WHERE party_id = debug_party_id AND proposed_by_member_id IN (
        SELECT id FROM public.party_members WHERE party_id = debug_party_id AND is_leader = TRUE LIMIT 1
      );
      IF NOT FOUND THEN
        INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
        SELECT debug_party_id, pm.id, p.motto
        FROM public.parties p
        JOIN public.party_members pm ON pm.party_id = p.id AND pm.is_leader = TRUE
        WHERE p.id = debug_party_id
          AND p.motto IS NOT NULL
          AND length(trim(p.motto)) > 0
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    -- Seed leader-proposed motto for DEBUG1 if not present (counts as leader's proposal)
    -- Use variables from the outer DO block; do not open a nested DO scope
    DECLARE
      v_exists BOOLEAN;
      v_leader_id UUID;
    BEGIN
      SELECT id INTO v_leader_id
      FROM public.party_members
      WHERE party_id = debug_party_id AND is_leader = TRUE
      ORDER BY created_at LIMIT 1;

      IF v_leader_id IS NOT NULL AND
         (SELECT COUNT(1) FROM public.party_motto_proposals WHERE party_id = debug_party_id AND proposed_by_member_id = v_leader_id) = 0 THEN

        SELECT EXISTS(
          SELECT 1 FROM public.party_motto_proposals
          WHERE party_id = debug_party_id
            AND "text" = (SELECT motto FROM public.parties WHERE id = debug_party_id)
        ) INTO v_exists;

        IF NOT v_exists THEN
          INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
          SELECT debug_party_id, v_leader_id, motto
          FROM public.parties
          WHERE id = debug_party_id
            AND motto IS NOT NULL
            AND length(trim(motto)) > 0;
        END IF;
      END IF;
    END;

    -- Seed leader-proposed motto for DEBUG1 if not present (counts as leader's proposal)
    DECLARE
      v_exists BOOLEAN;
      v_leader_id UUID;
    BEGIN
      SELECT id INTO v_leader_id
      FROM public.party_members
      WHERE party_id = debug_party_id AND is_leader = TRUE
      ORDER BY created_at LIMIT 1;

      IF v_leader_id IS NOT NULL AND
         (SELECT COUNT(1) FROM public.party_motto_proposals WHERE party_id = debug_party_id AND proposed_by_member_id = v_leader_id) = 0 THEN
        SELECT EXISTS(
          SELECT 1 FROM public.party_motto_proposals
          WHERE party_id = debug_party_id
            AND "text" = (SELECT motto FROM public.parties WHERE id = debug_party_id)
        ) INTO v_exists;

        IF NOT v_exists THEN
          INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
          SELECT debug_party_id, v_leader_id, motto
          FROM public.parties
          WHERE id = debug_party_id
            AND motto IS NOT NULL
            AND length(trim(motto)) > 0;
        END IF;
      END IF;
     END;

    -- Add Patrick as a non-NPC member in DEBUG1 for testing
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (debug_party_id, 'fcd61a1f-9393-414b-8048-65a2f3ca8095', 'Patrick', false, 'Joined', 10, 10, 10, 10, 10, 10, FALSE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc;

    -- Seed an additional NPC (hireling) with neutral baseline 9s and no user_id
    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc, adventurer_name)
    VALUES (debug_party_id, NULL, 'Debug Hireling', 'Joined', 9, 9, 9, 9, 9, 9, TRUE, NULL)
    ON CONFLICT DO NOTHING;

    -- Add additional debug members with finished status and random stats
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'debug1@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'debug2@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'debug3@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (debug_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Random1', 'Finished', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc;

    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (debug_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Random2', 'Finished', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc;

    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (debug_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Random3', 'Finished', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc;

    -- Add self-assessment answers for DEBUG1 members (NPCs) with a wide spread, not uniform 9s across board.
    DECLARE
      debug1_member_ids UUID[];
      debug1_q_id UUID;
      debug1_answer_opts JSONB;
      debug1_member_id UUID;
    BEGIN
      -- Use only NPCs for Randoms; Patrick (player in DEBUG1) will be excluded by is_npc filter
      SELECT array_agg(id) INTO debug1_member_ids
      FROM public.party_members
      WHERE party_id = debug_party_id AND is_npc = TRUE;

      -- For each self-assessment question, insert one answer per NPC using varied weights per member
      -- We define three weight profiles and rotate them across NPCs to create a wide spread.
      -- profile A: STR-leaning
      -- profile B: DEX/CHA-leaning
      -- profile C: INT/WIS-leaning
      FOR debug1_q_id, debug1_answer_opts IN
        SELECT id, answer_options FROM public.questions WHERE question_type = 'self-assessment'
      LOOP
        FOREACH debug1_member_id IN ARRAY debug1_member_ids
        LOOP
          INSERT INTO public.answers (question_id, voter_member_id, subject_member_id, answer_value)
          SELECT debug1_q_id, debug1_member_id, debug1_member_id, (elem->>'stat')
          FROM jsonb_array_elements(debug1_answer_opts) elem
          WHERE (elem->>'stat') = (
            WITH ord AS (
              -- Deterministic but varied selector per member/question via hash modulo rotation
              SELECT (abs(('x'||substr(md5(debug1_member_id::text || debug1_q_id::text),1,8))::bit(32)::int)) % 3 AS pick
            ),
            weights AS (
              -- pick = 0 => Profile A (STR/CN), 1 => Profile B (DEX/CHA), 2 => Profile C (INT/WIS)
              SELECT unnest(ARRAY['STR','DEX','CON','INT','WIS','CHA']) AS stat,
                     CASE
                       WHEN (SELECT pick FROM ord) = 0 THEN unnest(ARRAY[5,2,4,1,2,3])  -- A: STR 5, CON 4, CHA 3, DEX 2, WIS 2, INT 1
                       WHEN (SELECT pick FROM ord) = 1 THEN unnest(ARRAY[2,5,2,1,2,4])  -- B: DEX 5, CHA 4, STR/WIS/CON 2, INT 1
                       ELSE                               unnest(ARRAY[1,2,2,5,4,2])  -- C: INT 5, WIS 4, DEX/CON/CHA 2, STR 1
                     END AS w
            ),
            series AS (
              SELECT stat FROM weights, generate_series(1, w)
            )
            SELECT stat FROM series ORDER BY random() LIMIT 1
          )
          ON CONFLICT DO NOTHING;
        END LOOP;
      END LOOP;
    END;
  END IF;
END $$;


-- == 7. SEED ADDITIONAL MOCK DATA ==
DO $$
DECLARE
  fellowship_party_id UUID;
  patrick_user_id UUID := 'fcd61a1f-9393-414b-8048-65a2f3ca8095'; -- Re-using debug user for Patrick
  gandalf_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  frodo_user_id UUID   := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
  samwise_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';

  patrick_member_id UUID;
  gandalf_member_id UUID;
  frodo_member_id UUID;
  samwise_member_id UUID;

  q_id UUID;
  q_text TEXT;
  answer_opts TEXT[];
  member_ids UUID[];
  member_id UUID;
BEGIN
  -- Create the 'Fellowship' party
  INSERT INTO public.parties (code, name, motto)
  VALUES ('FELLOW', 'The Fellowship', 'Not all those who wander are lost')
  ON CONFLICT (code) DO NOTHING
  RETURNING id INTO fellowship_party_id;

  -- If the party was created, add members
  IF fellowship_party_id IS NOT NULL THEN
    -- Add mock users to auth.users. This is necessary for the foreign key constraint.
    -- In a real app, users are created via the auth flow. Using placeholder passwords.
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES
      (gandalf_user_id, 'gandalf@middleearth.com', crypt('password123', gen_salt('bf')), 'authenticated'),
      (frodo_user_id, 'frodo@middleearth.com', crypt('password123', gen_salt('bf')), 'authenticated'),
      (samwise_user_id, 'samwise@middleearth.com', crypt('password123', gen_salt('bf')), 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    -- Add Patrick (as leader, player)
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (fellowship_party_id, patrick_user_id, 'Patrick', true, 'Joined', 10, 10, 10, 10, 10, 10, FALSE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO patrick_member_id;

    -- Seed leader-proposed motto as their single proposal if not already present (Fellowship)
    PERFORM 1 FROM public.party_motto_proposals
    WHERE party_id = fellowship_party_id AND proposed_by_member_id = patrick_member_id;

    IF NOT FOUND THEN
      INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
      SELECT fellowship_party_id, patrick_member_id, motto
      FROM public.parties
      WHERE id = fellowship_party_id
        AND motto IS NOT NULL
        AND length(trim(motto)) > 0
      ON CONFLICT DO NOTHING;
    END IF;

    -- Seed leader-proposed motto as their single proposal if not already present
    DECLARE
      v_exists BOOLEAN;
    BEGIN
      IF (SELECT COUNT(1) FROM public.party_motto_proposals WHERE party_id = fellowship_party_id AND proposed_by_member_id = patrick_member_id) = 0 THEN
        SELECT EXISTS(
          SELECT 1 FROM public.party_motto_proposals
          WHERE party_id = fellowship_party_id
            AND "text" = (SELECT motto FROM public.parties WHERE id = fellowship_party_id)
        ) INTO v_exists;

        IF NOT v_exists THEN
          INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
          SELECT fellowship_party_id, patrick_member_id, motto
          FROM public.parties
          WHERE id = fellowship_party_id
            AND motto IS NOT NULL
            AND length(trim(motto)) > 0;
        END IF;
      END IF;
     END;

    -- Add Gandalf as NPC
    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (fellowship_party_id, gandalf_user_id, 'Gandalf', 'Joined', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO gandalf_member_id;

    -- Add Frodo as NPC
    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (fellowship_party_id, frodo_user_id, 'Frodo', 'Joined', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO frodo_member_id;

    -- Add Samwise as NPC
    INSERT INTO public.party_members (party_id, user_id, first_name, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (fellowship_party_id, samwise_user_id, 'Samwise', 'Joined', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO samwise_member_id;

    -- Implement weighted self-assessment seeding for Fellowship NPCs (Patrick is player; others are NPCs)
    -- Narrative weight profiles (higher number = more likely to be chosen):
    -- Gandalf: WIS 5, INT 4, CHA 3, DEX 2, CON 2, STR 1
    -- Frodo  : CHA 4, WIS 3, DEX 3, CON 3, STR 2, INT 2
    -- Samwise: CON 5, STR 3, WIS 3, DEX 2, CHA 2, INT 2

    -- Helper to pick a stat from question answer_options by index
    -- We will compute a weighted index between 1..6 for each question, mapping to a stat id, then find the option matching it.
    FOR q_id, answer_opts IN
      SELECT id, answer_options FROM public.questions WHERE question_type = 'self-assessment'
    LOOP
      -- Gandalf weighted pick
      PERFORM
      (
        WITH weights AS (
          SELECT unnest(ARRAY['STR','DEX','CON','INT','WIS','CHA']) AS stat,
                 unnest(ARRAY[1,2,2,4,5,3]) AS w
        ),
        series AS (
          SELECT stat
          FROM weights, generate_series(1, w)
        )
        SELECT 1
        FROM LATERAL (
          SELECT stat FROM series ORDER BY random() LIMIT 1
        ) pick
        CROSS JOIN LATERAL (
          SELECT (elem->>'stat') AS opt_stat
          FROM jsonb_array_elements(answer_opts) elem
        ) opts
        WHERE opts.opt_stat = pick.stat
      );
      INSERT INTO public.answers (question_id, voter_member_id, subject_member_id, answer_value)
      SELECT q_id, gandalf_member_id, gandalf_member_id, (elem->>'stat')
      FROM jsonb_array_elements(answer_opts) elem
      WHERE (elem->>'stat') = (
        WITH weights AS (
          SELECT unnest(ARRAY['STR','DEX','CON','INT','WIS','CHA']) AS stat,
                 unnest(ARRAY[1,2,2,4,5,3]) AS w
        ),
        series AS (
          SELECT stat FROM weights, generate_series(1, w)
        )
        SELECT stat FROM series ORDER BY random() LIMIT 1
      )
      ON CONFLICT DO NOTHING;

      -- Frodo weighted pick
      INSERT INTO public.answers (question_id, voter_member_id, subject_member_id, answer_value)
      SELECT q_id, frodo_member_id, frodo_member_id, (elem->>'stat')
      FROM jsonb_array_elements(answer_opts) elem
      WHERE (elem->>'stat') = (
        WITH weights AS (
          SELECT unnest(ARRAY['STR','DEX','CON','INT','WIS','CHA']) AS stat,
                 unnest(ARRAY[2,3,3,2,3,4]) AS w
        ),
        series AS (
          SELECT stat FROM weights, generate_series(1, w)
        )
        SELECT stat FROM series ORDER BY random() LIMIT 1
      )
      ON CONFLICT DO NOTHING;

      -- Samwise weighted pick
      INSERT INTO public.answers (question_id, voter_member_id, subject_member_id, answer_value)
      SELECT q_id, samwise_member_id, samwise_member_id, (elem->>'stat')
      FROM jsonb_array_elements(answer_opts) elem
      WHERE (elem->>'stat') = (
        WITH weights AS (
          SELECT unnest(ARRAY['STR','DEX','CON','INT','WIS','CHA']) AS stat,
                 unnest(ARRAY[3,2,5,2,3,2]) AS w
        ),
        series AS (
          SELECT stat FROM weights, generate_series(1, w)
        )
        SELECT stat FROM series ORDER BY random() LIMIT 1
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

  END IF;
END $$;

-- == 8. ADD TEST PARTY WITH COMPLETED VOTING ==
DO $$
DECLARE
  test_party_id UUID;
  patrick_user_id UUID := 'fcd61a1f-9393-414b-8048-65a2f3ca8095'; -- Re-using debug user for Patrick
  member1_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
  member2_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15';
  member3_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16';
  member4_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17';

  patrick_member_id UUID;
  member1_id UUID;
  member2_id UUID;
  member3_id UUID;
  member4_id UUID;

  q_id UUID;
  answer_opts TEXT[];
  member_ids UUID[];
  member_id UUID;
BEGIN
  -- Create the test party
  INSERT INTO public.parties (code, name, motto, status)
  VALUES ('DEBUG2', 'The Zeros', 'Testing is fun!', 'Lobby')
  ON CONFLICT (code) DO NOTHING
  RETURNING id INTO test_party_id;

  -- If the party was created, add members with zero stats
  IF test_party_id IS NOT NULL THEN
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (test_party_id, 'fcd61a1f-9393-414b-8048-65a2f3ca8095', 'Patrick', true, 'Joined', 10, 10, 10, 10, 10, 10, FALSE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc;

    -- Add mock users to auth.users for DEBUG2 additional members
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'finisher1@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'finisher2@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'finisher3@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'finisher4@test.com', crypt('password123', gen_salt('bf')), 'authenticated') ON CONFLICT (id) DO NOTHING;

    -- Add other members with zero stats
    INSERT INTO public.party_members (party_id, user_id, first_name, status, adventurer_name, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (test_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Zero1', 'Finished', 'Zero 1', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO member1_id;

    INSERT INTO public.party_members (party_id, user_id, first_name, status, adventurer_name, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (test_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Zero2', 'Finished', 'Zero 2', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO member2_id;

    INSERT INTO public.party_members (party_id, user_id, first_name, status, adventurer_name, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (test_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Zero3', 'Finished', 'Zero 3', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO member3_id;

    INSERT INTO public.party_members (party_id, user_id, first_name, status, adventurer_name, strength, dexterity, constitution, intelligence, wisdom, charisma, is_npc)
    VALUES (test_party_id, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Zero4', 'Finished', 'Zero 4', 9, 9, 9, 9, 9, 9, TRUE)
    ON CONFLICT (party_id, user_id) DO UPDATE SET is_npc = EXCLUDED.is_npc
    RETURNING id INTO member4_id;

    -- All members in this test party are NPCs; skip self-assessment seeding
    member_ids := ARRAY[patrick_member_id, member1_id, member2_id, member3_id, member4_id];

    FOR q_id, answer_opts IN
      SELECT id, answer_options FROM public.questions WHERE question_type = 'self-assessment'
    LOOP
      FOREACH member_id IN ARRAY member_ids
      LOOP
        INSERT INTO public.answers (question_id, voter_member_id, subject_member_id, answer_value)
        VALUES (q_id, member_id, member_id, (answer_opts[1 + floor(random() * jsonb_array_length(answer_opts))::int]->>'stat'))
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  END IF; -- Closing the main IF for DEBUG2
END $$; -- Closing the last DO block

-- == 9. SEED "Hardy Party" ==
DO $$
DECLARE
  hardy_party_id UUID;
  leader_email TEXT := 'patrickandrewregan@gmail.com';
  member_email TEXT := 'patrickandrewregan+test@gmail.com';

  leader_user_id UUID;
  member_user_id UUID;

  leader_member_id UUID;
  member_member_id UUID;

  -- Reuse David Bugg NPC from DEBUG1
  david_user_id UUID := '11111111-2222-3333-4444-555555555555';
  david_member_id UUID;
BEGIN
  -- Ensure auth users exist
  INSERT INTO auth.users (id, email, encrypted_password, role)
  SELECT gen_random_uuid(), leader_email, crypt('password123', gen_salt('bf')), 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = leader_email);

  INSERT INTO auth.users (id, email, encrypted_password, role)
  SELECT gen_random_uuid(), member_email, crypt('password123', gen_salt('bf')), 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = member_email);

  -- Resolve user ids
  SELECT id INTO leader_user_id FROM auth.users WHERE email = leader_email LIMIT 1;
  SELECT id INTO member_user_id FROM auth.users WHERE email = member_email LIMIT 1;

  -- Create party
  INSERT INTO public.parties (code, name, motto, status)
  VALUES ('PARTAY', 'Hardy Party', 'Party hard, party hardy', 'Lobby')
  ON CONFLICT (code) DO NOTHING
  RETURNING id INTO hardy_party_id;

  IF hardy_party_id IS NOT NULL THEN
    -- Leader
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, is_npc)
    VALUES (hardy_party_id, leader_user_id, 'Patrick', true, 'Joined', FALSE)
    ON CONFLICT (party_id, user_id) DO NOTHING
    RETURNING id INTO leader_member_id;

    -- Member
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, is_npc)
    VALUES (hardy_party_id, member_user_id, 'TestPatrick', false, 'Joined', FALSE)
    ON CONFLICT (party_id, user_id) DO NOTHING
    RETURNING id INTO member_member_id;

    -- Ensure David Bugg auth user exists (from DEBUG1) and add as NPC
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES (david_user_id, 'david.bugg@test.com', crypt('password123', gen_salt('bf')), 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, is_npc)
    VALUES (hardy_party_id, david_user_id, 'David Bugg', false, 'Joined', TRUE)
    ON CONFLICT (party_id, user_id) DO NOTHING
    RETURNING id INTO david_member_id;

    -- Leader's initial motto counts as their single proposal
    IF leader_member_id IS NOT NULL THEN
      PERFORM 1 FROM public.party_motto_proposals
      WHERE party_id = hardy_party_id AND proposed_by_member_id = leader_member_id;

      IF NOT FOUND THEN
        INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
        SELECT hardy_party_id, leader_member_id, motto
        FROM public.parties
        WHERE id = hardy_party_id
          AND motto IS NOT NULL
          AND length(trim(motto)) > 0
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
END $$;

-- == 9. SEED "Hardy Party" ==
DO $$
DECLARE
  hardy_party_id UUID;
  leader_email TEXT := 'patrickandrewregan@gmail.com';
  member_email TEXT := 'patrickandrewregan+test@gmail.com';

  leader_user_id UUID;
  member_user_id UUID;

  leader_member_id UUID;
  member_member_id UUID;

  -- Reuse David Bugg NPC from DEBUG1
  david_user_id UUID := '11111111-2222-3333-4444-555555555555';
  david_member_id UUID;
BEGIN
  -- Ensure auth users exist (simple placeholder password for seed)
  INSERT INTO auth.users (id, email, encrypted_password, role)
  SELECT gen_random_uuid(), leader_email, crypt('password123', gen_salt('bf')), 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = leader_email);

  INSERT INTO auth.users (id, email, encrypted_password, role)
  SELECT gen_random_uuid(), member_email, crypt('password123', gen_salt('bf')), 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = member_email);

  -- Resolve user ids
  SELECT id INTO leader_user_id FROM auth.users WHERE email = leader_email LIMIT 1;
  SELECT id INTO member_user_id FROM auth.users WHERE email = member_email LIMIT 1;

  -- Create party
  INSERT INTO public.parties (code, name, motto, status)
  VALUES ('PARTAY', 'Hardy Party', 'Party hard, party hardy', 'Lobby')
  ON CONFLICT (code) DO NOTHING
  RETURNING id INTO hardy_party_id;

  IF hardy_party_id IS NOT NULL THEN
    -- Insert leader
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, is_npc)
    VALUES (hardy_party_id, leader_user_id, 'Patrick', true, 'Joined', FALSE)
    ON CONFLICT (party_id, user_id) DO NOTHING
    RETURNING id INTO leader_member_id;

    -- Insert second party member
    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, is_npc)
    VALUES (hardy_party_id, member_user_id, 'TestPatrick', false, 'Joined', FALSE)
    ON CONFLICT (party_id, user_id) DO NOTHING
    RETURNING id INTO member_member_id;

    -- Ensure David Bugg auth user exists (from DEBUG1 seed) and add as NPC
    INSERT INTO auth.users (id, email, encrypted_password, role)
    VALUES (david_user_id, 'david.bugg@test.com', crypt('password123', gen_salt('bf')), 'authenticated')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.party_members (party_id, user_id, first_name, is_leader, status, is_npc)
    VALUES (hardy_party_id, david_user_id, 'David Bugg', false, 'Joined', TRUE)
    ON CONFLICT (party_id, user_id) DO NOTHING
    RETURNING id INTO david_member_id;

    -- Leader's initial motto counts as their single proposal (if not already present)
    IF leader_member_id IS NOT NULL THEN
      PERFORM 1 FROM public.party_motto_proposals
      WHERE party_id = hardy_party_id AND proposed_by_member_id = leader_member_id;

      IF NOT FOUND THEN
        INSERT INTO public.party_motto_proposals (party_id, proposed_by_member_id, "text")
        SELECT hardy_party_id, leader_member_id, motto
        FROM public.parties
        WHERE id = hardy_party_id
          AND motto IS NOT NULL
          AND length(trim(motto)) > 0
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

  END IF;
END $$;
