-- Create Avatar System Tables
-- This migration creates the tables for the avatar system

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.user_avatars CASCADE;
DROP TABLE IF EXISTS public.user_avatar_parts CASCADE;
DROP TABLE IF EXISTS public.avatar_parts CASCADE;

-- Create avatar_parts table
CREATE TABLE IF NOT EXISTS public.avatar_parts (
    part_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'head', 'skin', 'eyes', 'accessories', 'backgrounds', 'effects'
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    unlock_requirements JSONB, -- Requirements for unlocking this part (e.g., achievements, special events)
    is_default BOOLEAN DEFAULT FALSE NOT NULL, -- Whether this is a default starter part
    is_premium BOOLEAN DEFAULT FALSE NOT NULL, -- Whether this is a premium part
    sort_order INTEGER DEFAULT 0 NOT NULL, -- For ordering parts in UI
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.avatar_parts IS 'Stores available avatar parts that users can unlock and equip';
COMMENT ON COLUMN public.avatar_parts.type IS 'Type of avatar part: head, skin, eyes, accessories, backgrounds, effects';
COMMENT ON COLUMN public.avatar_parts.unlock_requirements IS 'JSONB object containing requirements for unlocking this part';

-- Create user_avatar_parts table
CREATE TABLE IF NOT EXISTS public.user_avatar_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, part_id)
);

COMMENT ON TABLE public.user_avatar_parts IS 'Tracks which avatar parts each user has unlocked';

-- Create user_avatars table
CREATE TABLE IF NOT EXISTS public.user_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    head_part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE SET NULL,
    skin_part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE SET NULL,
    eyes_part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE SET NULL,
    accessories_part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE SET NULL,
    backgrounds_part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE SET NULL,
    effects_part_id UUID REFERENCES public.avatar_parts(part_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id)
);

COMMENT ON TABLE public.user_avatars IS 'Tracks currently equipped avatar configuration for each user';

-- Enable RLS
ALTER TABLE public.avatar_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Avatar parts are publicly readable
CREATE POLICY "Allow all users to read avatar parts" ON public.avatar_parts FOR SELECT USING (true);

-- Users can only see their own avatar parts and avatars
CREATE POLICY "Allow users to read their own avatar parts" ON public.user_avatar_parts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to read their own avatars" ON public.user_avatars FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update their own avatars
CREATE POLICY "Allow users to update their own avatars" ON public.user_avatars FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own avatars" ON public.user_avatars FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Only service role can manage avatar parts and user avatar parts (for unlocking)
CREATE POLICY "Allow service role to manage avatar parts" ON public.avatar_parts FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role to manage user avatar parts" ON public.user_avatar_parts FOR ALL TO service_role USING (true);

-- Seed initial avatar parts (idempotent)
INSERT INTO public.avatar_parts (part_id, type, name, image_url, is_default, is_premium, sort_order, unlock_requirements) VALUES
-- Default head shapes
('11111111-1111-1111-1111-111111111111', 'head', 'Human', '/avatars/heads/human.svg', true, false, 1, NULL),
('11111111-1111-1111-1111-111111111112', 'head', 'Elf', '/avatars/heads/elf.svg', true, false, 2, NULL),
('11111111-1111-1111-1111-111111111113', 'head', 'Dwarf', '/avatars/heads/dwarf.svg', true, false, 3, NULL),
('11111111-1111-1111-1111-111111111114', 'head', 'Halfling', '/avatars/heads/halfling.svg', true, false, 4, NULL),
('11111111-1111-1111-1111-111111111115', 'head', 'Orc', '/avatars/heads/orc.svg', false, false, 5, NULL),
('11111111-1111-1111-1111-111111111116', 'head', 'Tiefling', '/avatars/heads/tiefling.svg', false, false, 6, NULL),
('11111111-1111-1111-1111-111111111117', 'head', 'Gnome', '/avatars/heads/gnome.svg', false, false, 7, NULL),
('11111111-1111-1111-1111-111111111118', 'head', 'Dragonborn', '/avatars/heads/dragonborn.svg', false, false, 8, NULL),
('11111111-1111-1111-1111-111111111119', 'head', 'Half-Orc', '/avatars/heads/half-orc.svg', false, false, 9, NULL),
('11111111-1111-1111-1111-11111111111a', 'head', 'Aasimar', '/avatars/heads/aasimar.svg', false, false, 10, NULL),

-- Default skin colors
('22222222-2222-2222-2222-222222222221', 'skin', 'Light', '/avatars/skins/light.svg', true, false, 1, NULL),
('22222222-2222-2222-2222-222222222222', 'skin', 'Medium', '/avatars/skins/medium.svg', true, false, 2, NULL),
('22222222-2222-2222-2222-222222222223', 'skin', 'Dark', '/avatars/skins/dark.svg', true, false, 3, NULL),
('22222222-2222-2222-2222-222222222224', 'skin', 'Tan', '/avatars/skins/tan.svg', true, false, 4, NULL),
('22222222-2222-2222-2222-222222222225', 'skin', 'Green', '/avatars/skins/green.svg', false, false, 5, NULL),
('22222222-2222-2222-2222-222222222226', 'skin', 'Red', '/avatars/skins/red.svg', false, false, 6, NULL),
('22222222-2222-2222-2222-222222222227', 'skin', 'Blue', '/avatars/skins/blue.svg', false, false, 7, NULL),
('22222222-2222-2222-2222-222222222228', 'skin', 'Purple', '/avatars/skins/purple.svg', false, false, 8, NULL),
('22222222-2222-2222-2222-222222222229', 'skin', 'Gray', '/avatars/skins/gray.svg', false, false, 9, NULL),
('22222222-2222-2222-2222-22222222222a', 'skin', 'Pale', '/avatars/skins/pale.svg', false, false, 10, NULL),

-- Default eye colors
('33333333-3333-3333-3333-333333333331', 'eyes', 'Brown', '/avatars/eyes/brown.svg', true, false, 1, NULL),
('33333333-3333-3333-3333-333333333332', 'eyes', 'Blue', '/avatars/eyes/blue.svg', true, false, 2, NULL),
('33333333-3333-3333-3333-333333333333', 'eyes', 'Green', '/avatars/eyes/green.svg', true, false, 3, NULL),
('33333333-3333-3333-3333-333333333334', 'eyes', 'Hazel', '/avatars/eyes/hazel.svg', true, false, 4, NULL),
('33333333-3333-3333-3333-333333333335', 'eyes', 'Amber', '/avatars/eyes/amber.svg', false, false, 5, NULL),
('33333333-3333-3333-3333-333333333336', 'eyes', 'Violet', '/avatars/eyes/violet.svg', false, false, 6, NULL),
('33333333-3333-3333-3333-333333333337', 'eyes', 'Red', '/avatars/eyes/red.svg', false, false, 7, NULL),
('33333333-3333-3333-3333-333333333338', 'eyes', 'Gold', '/avatars/eyes/gold.svg', false, false, 8, NULL),
('33333333-3333-3333-3333-333333333339', 'eyes', 'Silver', '/avatars/eyes/silver.svg', false, false, 9, NULL),
('33333333-3333-3333-3333-33333333333a', 'eyes', 'Black', '/avatars/eyes/black.svg', false, false, 10, NULL),

-- Default accessories
('44444444-4444-4444-4444-444444444441', 'accessories', 'None', '/avatars/accessories/none.svg', true, false, 1, NULL),
('44444444-4444-4444-4444-444444444442', 'accessories', 'Glasses', '/avatars/accessories/glasses.svg', true, false, 2, NULL),
('44444444-4444-4444-4444-444444444443', 'accessories', 'Hat', '/avatars/accessories/hat.svg', true, false, 3, NULL),
('44444444-4444-4444-4444-444444444444', 'accessories', 'Bandana', '/avatars/accessories/bandana.svg', false, false, 4, NULL),
('44444444-4444-4444-4444-444444444445', 'accessories', 'Scarf', '/avatars/accessories/scarf.svg', false, false, 5, NULL),
('44444444-4444-4444-4444-444444444446', 'accessories', 'Mask', '/avatars/accessories/mask.svg', false, false, 6, NULL),
('44444444-4444-4444-4444-444444444447', 'accessories', 'Earrings', '/avatars/accessories/earrings.svg', false, false, 7, NULL),
('44444444-4444-4444-4444-444444444448', 'accessories', 'Necklace', '/avatars/accessories/necklace.svg', false, false, 8, NULL),
('44444444-4444-4444-4444-444444444449', 'accessories', 'Piercing', '/avatars/accessories/piercing.svg', false, false, 9, NULL),
('44444444-4444-4444-4444-44444444444a', 'accessories', 'Tattoo', '/avatars/accessories/tattoo.svg', false, false, 10, NULL),

-- Default backgrounds
('55555555-5555-5555-5555-555555555551', 'backgrounds', 'Plain', '/avatars/backgrounds/plain.svg', true, false, 1, NULL),
('55555555-5555-5555-5555-555555555552', 'backgrounds', 'Forest', '/avatars/backgrounds/forest.svg', true, false, 2, NULL),
('55555555-5555-5555-5555-555555555553', 'backgrounds', 'Castle', '/avatars/backgrounds/castle.svg', true, false, 3, NULL),
('55555555-5555-5555-5555-555555555554', 'backgrounds', 'Mountain', '/avatars/backgrounds/mountain.svg', false, false, 4, NULL),
('55555555-5555-5555-5555-555555555555', 'backgrounds', 'Ocean', '/avatars/backgrounds/ocean.svg', false, false, 5, NULL),
('55555555-5555-5555-5555-555555555556', 'backgrounds', 'Desert', '/avatars/backgrounds/desert.svg', false, false, 6, NULL),
('55555555-5555-5555-5555-555555555557', 'backgrounds', 'Cave', '/avatars/backgrounds/cave.svg', false, false, 7, NULL),
('55555555-5555-5555-5555-555555555558', 'backgrounds', 'Village', '/avatars/backgrounds/village.svg', false, false, 8, NULL),
('55555555-5555-5555-5555-555555555559', 'backgrounds', 'Temple', '/avatars/backgrounds/temple.svg', false, false, 9, NULL),
('55555555-5555-5555-5555-55555555555a', 'backgrounds', 'Tavern', '/avatars/backgrounds/tavern.svg', false, false, 10, NULL),

-- Default effects
('66666666-6666-6666-6666-666666666661', 'effects', 'None', '/avatars/effects/none.svg', true, false, 1, NULL),
('66666666-6666-6666-6666-666666666662', 'effects', 'Sparkle', '/avatars/effects/sparkle.svg', true, false, 2, NULL),
('66666666-6666-6666-6666-666666666663', 'effects', 'Glow', '/avatars/effects/glow.svg', false, false, 3, NULL),
('66666666-6666-6666-6666-666666666664', 'effects', 'Shadow', '/avatars/effects/shadow.svg', false, false, 4, NULL),
('66666666-6666-6666-6666-666666666665', 'effects', 'Aura', '/avatars/effects/aura.svg', false, false, 5, NULL),
('66666666-6666-6666-6666-666666666666', 'effects', 'Mist', '/avatars/effects/mist.svg', false, false, 6, NULL),
('66666666-6666-6666-6666-666666666667', 'effects', 'Lightning', '/avatars/effects/lightning.svg', false, false, 7, NULL),
('66666666-6666-6666-6666-666666666668', 'effects', 'Wind', '/avatars/effects/wind.svg', false, false, 8, NULL),
('66666666-6666-6666-6666-666666666669', 'effects', 'Earth', '/avatars/effects/earth.svg', false, false, 9, NULL),
('66666666-6666-6666-6666-66666666666a', 'effects', 'Water', '/avatars/effects/water.svg', false, false, 10, NULL),

-- Premium parts (unlocked through achievements)
-- Premium Accessories (10 total)
('77777777-7777-7777-7777-777777777771', 'accessories', 'Crown', '/avatars/accessories/crown.svg', false, true, 11, '{"achievement_id": "22222222-2222-2222-2222-222222222222"}'),
('77777777-7777-7777-7777-777777777772', 'accessories', 'Wizard Hat', '/avatars/accessories/wizard-hat.svg', false, true, 12, '{"achievement_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'),
('77777777-7777-7777-7777-777777777773', 'accessories', 'Warrior Helm', '/avatars/accessories/warrior-helm.svg', false, true, 13, '{"achievement_id": "99999999-9999-9999-9999-999999999999"}'),
('77777777-7777-7777-7777-777777777774', 'accessories', 'Rogue Mask', '/avatars/accessories/rogue-mask.svg', false, true, 14, '{"achievement_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'),
('77777777-7777-7777-7777-777777777775', 'accessories', 'Bard Hat', '/avatars/accessories/bard-hat.svg', false, true, 15, '{"achievement_id": "55555555-5555-5555-5555-555555555555"}'),
('77777777-7777-7777-7777-777777777776', 'accessories', 'Cleric Circlet', '/avatars/accessories/cleric-circlet.svg', false, true, 16, '{"achievement_id": "66666666-6666-6666-6666-666666666666"}'),
('77777777-7777-7777-7777-777777777777', 'accessories', 'Ranger Hood', '/avatars/accessories/ranger-hood.svg', false, true, 17, '{"achievement_id": "77777777-7777-7777-7777-777777777777"}'),
('77777777-7777-7777-7777-777777777778', 'accessories', 'Monk Headband', '/avatars/accessories/monk-headband.svg', false, true, 18, '{"achievement_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}'),
('77777777-7777-7777-7777-777777777779', 'accessories', 'Paladin Crown', '/avatars/accessories/paladin-crown.svg', false, true, 19, '{"achievement_id": "dddddddd-dddd-dddd-dddd-dddddddddddd"}'),
('77777777-7777-7777-7777-77777777777a', 'accessories', 'Sorcerer Tiara', '/avatars/accessories/sorcerer-tiara.svg', false, true, 20, '{"achievement_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"}'),

-- Premium Backgrounds (10 total)
('88888888-8888-8888-8888-888888888881', 'backgrounds', 'Dragon Lair', '/avatars/backgrounds/dragon-lair.svg', false, true, 11, '{"achievement_id": "44444444-4444-4444-4444-444444444444"}'),
('88888888-8888-8888-8888-888888888882', 'backgrounds', 'Mystic Library', '/avatars/backgrounds/mystic-library.svg', false, true, 12, '{"achievement_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'),
('88888888-8888-8888-8888-888888888883', 'backgrounds', 'Battle Arena', '/avatars/backgrounds/battle-arena.svg', false, true, 13, '{"achievement_id": "99999999-9999-9999-9999-999999999999"}'),
('88888888-8888-8888-8888-888888888884', 'backgrounds', 'Shadow Realm', '/avatars/backgrounds/shadow-realm.svg', false, true, 14, '{"achievement_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'),
('88888888-8888-8888-8888-888888888885', 'backgrounds', 'Celestial Palace', '/avatars/backgrounds/celestial-palace.svg', false, true, 15, '{"achievement_id": "55555555-5555-5555-5555-555555555555"}'),
('88888888-8888-8888-8888-888888888886', 'backgrounds', 'Underdark Cavern', '/avatars/backgrounds/underdark-cavern.svg', false, true, 16, '{"achievement_id": "66666666-6666-6666-6666-666666666666"}'),
('88888888-8888-8888-8888-888888888887', 'backgrounds', 'Feywild Grove', '/avatars/backgrounds/feywild-grove.svg', false, true, 17, '{"achievement_id": "77777777-7777-7777-7777-777777777777"}'),
('88888888-8888-8888-8888-888888888888', 'backgrounds', 'Elemental Plane', '/avatars/backgrounds/elemental-plane.svg', false, true, 18, '{"achievement_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}'),
('88888888-8888-8888-8888-888888888889', 'backgrounds', 'Astral Sea', '/avatars/backgrounds/astral-sea.svg', false, true, 19, '{"achievement_id": "dddddddd-dddd-dddd-dddd-dddddddddddd"}'),
('88888888-8888-8888-8888-88888888888a', 'backgrounds', 'Divine Realm', '/avatars/backgrounds/divine-realm.svg', false, true, 20, '{"achievement_id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"}'),

-- Premium Effects (10 total)
('99999999-9999-9999-9999-999999999991', 'effects', 'Fire', '/avatars/effects/fire.svg', false, true, 11, '{"achievement_id": "33333333-3333-3333-3333-333333333333"}'),
('99999999-9999-9999-9999-999999999992', 'effects', 'Ice', '/avatars/effects/ice.svg', false, true, 12, '{"achievement_id": "88888888-8888-8888-8888-888888888888"}'),
('99999999-9999-9999-9999-999999999993', 'effects', 'Lightning', '/avatars/effects/lightning.svg', false, true, 13, '{"achievement_id": "22222222-2222-2222-2222-222222222222"}'),
('99999999-9999-9999-9999-999999999994', 'effects', 'Shadow', '/avatars/effects/shadow.svg', false, true, 14, '{"achievement_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'),
('99999999-9999-9999-9999-999999999995', 'effects', 'Holy Light', '/avatars/effects/holy-light.svg', false, true, 15, '{"achievement_id": "99999999-9999-9999-9999-999999999999"}'),
('99999999-9999-9999-9999-999999999996', 'effects', 'Dark Magic', '/avatars/effects/dark-magic.svg', false, true, 16, '{"achievement_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'),
('99999999-9999-9999-9999-999999999997', 'effects', 'Nature Aura', '/avatars/effects/nature-aura.svg', false, true, 17, '{"achievement_id": "55555555-5555-5555-5555-555555555555"}'),
('99999999-9999-9999-9999-999999999998', 'effects', 'Arcane Energy', '/avatars/effects/arcane-energy.svg', false, true, 18, '{"achievement_id": "66666666-6666-6666-6666-666666666666"}'),
('99999999-9999-9999-9999-999999999999', 'effects', 'Divine Blessing', '/avatars/effects/divine-blessing.svg', false, true, 19, '{"achievement_id": "77777777-7777-7777-7777-777777777777"}'),
('99999999-9999-9999-9999-99999999999a', 'effects', 'Eldritch Power', '/avatars/effects/eldritch-power.svg', false, true, 20, '{"achievement_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}')
ON CONFLICT (part_id) DO NOTHING;
