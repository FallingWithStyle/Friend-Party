-- Create the 'parties' table
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'Lobby' NOT NULL -- e.g., Lobby, Voting, ResultsReady
);

-- Create the 'party_members' table
CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  is_leader BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'Joined' NOT NULL, -- e.g., Joined, Voting, Finished
  adventurer_name TEXT,
  exp INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add a unique constraint
ALTER TABLE public.party_members
ADD CONSTRAINT unique_party_user UNIQUE (party_id, user_id);

-- Enable Row Level Security (RLS) for both tables
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the 'parties' table
-- Allow anyone to create a new party
DROP POLICY IF EXISTS "Allow public insert for parties" ON public.parties;
CREATE POLICY "Allow public insert for parties" ON public.parties FOR INSERT WITH CHECK (true);
-- Allow anyone to read a party if they know the code
DROP POLICY IF EXISTS "Allow public read for parties" ON public.parties;
CREATE POLICY "Allow public read for parties" ON public.parties FOR SELECT USING (true);

-- Create RLS policies for the 'party_members' table
-- Allow anyone to join a party (insert a new member)
DROP POLICY IF EXISTS "Allow public insert for party_members" ON public.party_members;
CREATE POLICY "Allow public insert for party_members" ON public.party_members FOR INSERT WITH CHECK (true);
-- Allow members of a party to see other members
DROP POLICY IF EXISTS "Allow members to read other members in the same party" ON public.party_members;
CREATE POLICY "Allow members to read other members in the same party" ON public.party_members FOR SELECT USING (
  auth.email() IN (
    SELECT email FROM public.party_members WHERE party_id = party_members.party_id
  )
);
-- Allow a user to update their own adventurer name
DROP POLICY IF EXISTS "Allow user to update their own adventurer name" ON public.party_members;
CREATE POLICY "Allow user to update their own adventurer name" ON public.party_members FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Add comments to tables and columns for clarity
COMMENT ON TABLE public.parties IS 'Stores information about each party created.';
COMMENT ON TABLE public.party_members IS 'Stores information about each member within a party.';
COMMENT ON COLUMN public.parties.status IS 'The current phase of the party (Lobby, Voting, ResultsReady).';
COMMENT ON COLUMN public.party_members.status IS 'The current status of a party member (Joined, Voting, Finished).';

-- Create a function to handle creating a party and its leader in a single transaction
CREATE OR REPLACE FUNCTION public.create_party_and_leader(
  party_code TEXT,
  party_name TEXT,
  party_description TEXT,
  leader_name TEXT,
  leader_email TEXT
)
RETURNS JSON AS $$
DECLARE
  new_party_id UUID;
  new_party JSON;
BEGIN
  -- Insert the new party
  INSERT INTO public.parties (code, name, description)
  VALUES (party_code, party_name, party_description)
  RETURNING id INTO new_party_id;

  -- Insert the party leader
  INSERT INTO public.party_members (party_id, first_name, is_leader, email)
  VALUES (new_party_id, leader_name, true, leader_email);

  -- Return the newly created party details
  SELECT json_build_object('id', p.id, 'code', p.code, 'name', p.name, 'description', p.description)
  INTO new_party
  FROM public.parties p
  WHERE p.id = new_party_id;

  RETURN new_party;
END;
$$ LANGUAGE plpgsql;

-- Drop the old 'proposed_names' table if it exists
DROP TABLE IF EXISTS public.proposed_names CASCADE;

-- Create the 'name_proposals' table
CREATE TABLE name_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
    target_member_id UUID REFERENCES party_members(id) ON DELETE CASCADE NOT NULL,
    proposing_member_id UUID REFERENCES party_members(id) ON DELETE CASCADE NOT NULL,
    proposed_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Add comments to the 'name_proposals' table
COMMENT ON TABLE public.name_proposals IS 'Stores proposed adventurer names for party members during a naming event.';
COMMENT ON COLUMN public.name_proposals.is_active IS 'Identifies the current active naming event for a user.';


-- Enable RLS for 'name_proposals'
ALTER TABLE public.name_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for name_proposals
CREATE POLICY "Allow members to see proposals in their party"
ON public.name_proposals FOR SELECT
USING (
    party_id IN (
        SELECT party_id FROM party_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow members to insert proposals in their party"
ON public.name_proposals FOR INSERT
WITH CHECK (
    proposing_member_id IN (
        SELECT id FROM party_members WHERE user_id = auth.uid()
    )
);

-- Create the 'name_proposal_votes' table
CREATE TABLE name_proposal_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES name_proposals(id) ON DELETE CASCADE NOT NULL,
    voter_member_id UUID REFERENCES party_members(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (proposal_id, voter_member_id)
);

-- Add comments to the 'name_proposal_votes' table
COMMENT ON TABLE public.name_proposal_votes IS 'Tracks votes for proposed adventurer names.';
COMMENT ON COLUMN public.name_proposal_votes.voter_member_id IS 'The party member who cast the vote.';


-- Enable RLS for 'name_proposal_votes'
ALTER TABLE public.name_proposal_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for name_proposal_votes
CREATE POLICY "Allow members to see votes in their party"
ON public.name_proposal_votes FOR SELECT
USING (
    (SELECT party_id FROM name_proposals WHERE id = proposal_id) IN (
        SELECT party_id FROM party_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Allow members to cast votes in their party"
ON public.name_proposal_votes FOR INSERT
WITH CHECK (
    voter_member_id IN (
        SELECT id FROM party_members WHERE user_id = auth.uid()
    )
);