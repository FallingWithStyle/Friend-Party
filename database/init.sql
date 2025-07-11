-- Create the 'parties' table
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'Lobby' NOT NULL -- e.g., Lobby, Voting, ResultsReady
);

-- Create the 'party_members' table
CREATE TABLE public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  is_leader BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'Joined' NOT NULL, -- e.g., Joined, Voting, Finished
  adventurer_name TEXT,
  exp INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) for both tables
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the 'parties' table
-- Allow anyone to create a new party
CREATE POLICY "Allow public insert for parties" ON public.parties FOR INSERT WITH CHECK (true);
-- Allow anyone to read a party if they know the code
CREATE POLICY "Allow public read for parties" ON public.parties FOR SELECT USING (true);

-- Create RLS policies for the 'party_members' table
-- Allow anyone to join a party (insert a new member)
CREATE POLICY "Allow public insert for party_members" ON public.party_members FOR INSERT WITH CHECK (true);
-- Allow members of a party to see other members
CREATE POLICY "Allow members to read other members in the same party" ON public.party_members FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.party_members pm
    WHERE pm.party_id = party_members.party_id
  )
);
-- Allow a user to update their own adventurer name
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
  leader_name TEXT
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
  INSERT INTO public.party_members (party_id, first_name, is_leader)
  VALUES (new_party_id, leader_name, true);

  -- Return the newly created party details
  SELECT json_build_object('id', p.id, 'code', p.code, 'name', p.name, 'description', p.description)
  INTO new_party
  FROM public.parties p
  WHERE p.id = new_party_id;

  RETURN new_party;
END;
$$ LANGUAGE plpgsql;