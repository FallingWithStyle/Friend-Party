-- Create Achievement System Tables
-- This migration creates the tables for the achievement system

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.user_achievement_progress CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    achievement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- Icon identifier (e.g., 'trophy', 'star', 'medal')
    category TEXT NOT NULL, -- 'Party Participation', 'Social Interaction', 'Questionnaire Completion', 'Special Events'
    unlock_conditions JSONB NOT NULL, -- Conditions for unlocking this achievement
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.achievements IS 'Stores available achievements that users can unlock';
COMMENT ON COLUMN public.achievements.unlock_conditions IS 'JSONB object containing conditions for unlocking this achievement';

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(achievement_id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, achievement_id)
);

COMMENT ON TABLE public.user_achievements IS 'Tracks which achievements each user has earned';

-- Create user_achievement_progress table
CREATE TABLE IF NOT EXISTS public.user_achievement_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(achievement_id) ON DELETE CASCADE NOT NULL,
    progress_data JSONB NOT NULL, -- Current progress data (e.g., {"parties_joined": 3, "target": 5})
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, achievement_id)
);

COMMENT ON TABLE public.user_achievement_progress IS 'Tracks progress on multi-step achievements';

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievement_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Achievements are publicly readable
CREATE POLICY "Allow all users to read achievements" ON public.achievements FOR SELECT USING (true);

-- Users can only see their own achievements
CREATE POLICY "Allow users to read their own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can only see their own achievement progress
CREATE POLICY "Allow users to read their own achievement progress" ON public.user_achievement_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Only service role can insert/update achievements and user achievements (for awarding)
CREATE POLICY "Allow service role to manage achievements" ON public.achievements FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role to manage user achievements" ON public.user_achievements FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role to manage user achievement progress" ON public.user_achievement_progress FOR ALL TO service_role USING (true);

-- Seed initial achievements (idempotent with fixed UUIDs)
INSERT INTO public.achievements (achievement_id, name, description, icon, category, unlock_conditions) VALUES
-- Party Participation achievements
('11111111-1111-1111-1111-111111111111', 'First Party', 'Join your first party', 'party-popper', 'Party Participation', '{"type": "parties_joined", "target": 1}'),
('22222222-2222-2222-2222-222222222222', 'Party Leader', 'Create your first party', 'crown', 'Party Participation', '{"type": "parties_created", "target": 1}'),
('33333333-3333-3333-3333-333333333333', 'Social Butterfly', 'Join 5 parties', 'butterfly', 'Party Participation', '{"type": "parties_joined", "target": 5}'),
('44444444-4444-4444-4444-444444444444', 'Party Master', 'Create 3 parties', 'star', 'Party Participation', '{"type": "parties_created", "target": 3}'),

-- Social Interaction achievements
('55555555-5555-5555-5555-555555555555', 'Name Giver', 'Propose an adventurer name', 'edit', 'Social Interaction', '{"type": "names_proposed", "target": 1}'),
('66666666-6666-6666-6666-666666666666', 'Motto Master', 'Propose a party motto', 'quote', 'Social Interaction', '{"type": "mottos_proposed", "target": 1}'),
('77777777-7777-7777-7777-777777777777', 'Vote Caster', 'Cast your first vote', 'check-circle', 'Social Interaction', '{"type": "votes_cast", "target": 1}'),
('88888888-8888-8888-8888-888888888888', 'Consensus Builder', 'Cast 10 votes', 'users', 'Social Interaction', '{"type": "votes_cast", "target": 10}'),

-- Questionnaire Completion achievements
('99999999-9999-9999-9999-999999999999', 'Self Explorer', 'Complete your first self-assessment', 'user-check', 'Questionnaire Completion', '{"type": "self_assessments_completed", "target": 1}'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Peer Reviewer', 'Complete your first peer assessment', 'users-check', 'Questionnaire Completion', '{"type": "peer_assessments_completed", "target": 1}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Assessment Expert', 'Complete 5 assessments', 'award', 'Questionnaire Completion', '{"type": "total_assessments_completed", "target": 5}'),

-- Special Events achievements
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Hireling Recruiter', 'Convert a hireling to a party member', 'user-plus', 'Special Events', '{"type": "hirelings_converted", "target": 1}'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Results Viewer', 'View party results', 'eye', 'Special Events', '{"type": "results_viewed", "target": 1}'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Profile Complete', 'Complete your profile', 'user-circle', 'Special Events', '{"type": "profile_completed", "target": 1}')
ON CONFLICT (achievement_id) DO NOTHING;
