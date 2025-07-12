-- This file contains the canonical Row Level Security (RLS) policies for the FriendParty application.
-- It should be used as the single source of truth for the database security configuration.

-- == CLEAN SLATE ==
-- Drop all policies and constraints to ensure a clean slate before applying the new ones.
DROP POLICY IF EXISTS "Allow public insert for party_members" ON public.party_members;
DROP POLICY IF EXISTS "Allow members to read other members in the same party" ON public.party_members;
DROP POLICY IF EXISTS "Allow user to update their own adventurer name" ON public.party_members;
DROP POLICY IF EXISTS "Allow authenticated users to join a party" ON public.party_members;
DROP POLICY IF EXISTS "Allow authenticated users to insert into party_members" ON public.party_members;
DROP POLICY IF EXISTS "Allow members to read party member data" ON public.party_members;
DROP POLICY IF EXISTS "Allow authenticated users to join parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow users to be added to parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow users to see members of their own parties" ON public.party_members;
DROP POLICY IF EXISTS "Allow authenticated users to read party member data" ON public.party_members;


DROP POLICY IF EXISTS "Allow members to read proposed names" ON public.proposed_names;
DROP POLICY IF EXISTS "Allow members to insert proposed names" ON public.proposed_names;

DROP POLICY IF EXISTS "Allow public insert for parties" ON public.parties;
DROP POLICY IF EXISTS "Allow public read for parties" ON public.parties;
DROP POLICY IF EXISTS "Allow authenticated users to create parties" ON public.parties;
DROP POLICY IF EXISTS "Allow users to read party data" ON public.parties;
DROP POLICY IF EXISTS "Allow users to read parties they are a member of" ON public.parties;
DROP POLICY IF EXISTS "Allow authenticated users to read party data" ON public.parties;


ALTER TABLE public.party_members DROP CONSTRAINT IF EXISTS unique_party_user;

DROP FUNCTION IF EXISTS is_member_of(uuid, uuid);
DROP FUNCTION IF EXISTS is_member_of(uuid);
DROP FUNCTION IF EXISTS is_party_member(uuid, uuid);


-- == CURRENT WORKING POLICIES ==

-- 1. Allow authenticated users to create new parties.
CREATE POLICY "Allow authenticated users to create parties"
ON public.parties FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Allow authenticated users to be added to the party_members table.
CREATE POLICY "Allow users to be added to parties"
ON public.party_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Allow users to read data from the parties table.
CREATE POLICY "Allow authenticated users to read party data"
ON public.parties FOR SELECT
TO authenticated
USING (true);

-- 4. Allow authenticated users to read party member data.
CREATE POLICY "Allow authenticated users to read party member data"
ON public.party_members FOR SELECT
TO authenticated
USING (true);