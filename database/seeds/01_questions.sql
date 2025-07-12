-- This script is idempotent. It will first delete all existing questions
-- and then re-seed the table from a clean slate.

-- Clear existing data
DELETE FROM public.questions;

-- Self-Assessment Questions
INSERT INTO public.questions (question_text, question_type, answer_options) VALUES
('You find a mysterious, glowing potion. What do you do?', 'self-assessment', '{"Drink it immediately", "Try to identify it first", "Offer it to a friend to test"}'),
('When planning a group trip, what role do you take?', 'self-assessment', '{"The one with the detailed spreadsheet", "The one who just shows up", "The one who convinces everyone to go somewhere completely different"}'),
('A heated debate breaks out at a dinner party. How do you react?', 'self-assessment', '{"Mediate to find common ground", "Use facts and logic to win", "Create a diversion with a hilarious story"}'),
('Your team is facing a tight deadline. What''s your approach?', 'self-assessment', '{"Staying up all night to get it done", "Finding a clever shortcut", "Keeping morale high with snacks and encouragement"}'),
('You''re given a complex gadget with no instructions. What''s your first move?', 'self-assessment', '{"Start pressing buttons randomly", "Read the manual cover-to-cover", "Try to build something even better with the parts"}'),
('When you enter a room, what do you tend to do?', 'self-assessment', '{"Command attention naturally", "Blend into the background", "Observe quietly from a corner"}'),
('What does your ideal weekend involve?', 'self-assessment', '{"A strenuous mountain hike", "A competitive board game tournament", "A relaxing day with a good book"}'),
('If you had to survive in the wilderness, what would be your greatest asset?', 'self-assessment', '{"Your physical endurance", "Your knowledge of edible plants", "Your ability to befriend a bear"}'),
('You''re offered a choice of one superpower. Which do you choose?', 'self-assessment', '{"Super strength", "The ability to read minds", "The power of flight"}'),
('When assembling furniture, what''s your style?', 'self-assessment', '{"Follow the instructions perfectly", "Improvise when a piece doesn''t fit", "End up with a unique creation and some leftover screws"}'),
('Who is more likely to successfully negotiate with a grumpy troll?', 'self-assessment', '{"The one with a silver tongue", "The one with a compelling argument"}'),
('When lost in a dense forest, who would you trust more to lead the way out?', 'self-assessment', '{"The one with a keen sense of direction", "The one who seems to have an encyclopedic knowledge of nature"}'),
('If a priceless artifact is protected by a maze of laser beams, who is more likely to get through unscathed?', 'self-assessment', '{"The nimble acrobat", "The clever strategist who finds the off switch"}'),
('A friendly tavern brawl breaks out. Who would you rather have on your side?', 'self-assessment', '{"The person who can take a punch", "The person who can end the fight with a single, intimidating glare"}'),
('Faced with a cryptic, ancient riddle, who is more likely to solve it?', 'self-assessment', '{"The one who pores over dusty tomes for the answer", "The one who has a sudden, brilliant flash of insight"}'),
('When the party is ambushed by goblins, who is more likely to have the perfect, unexpected item in their backpack to save the day?', 'self-assessment', '{"The meticulous planner", "The bold improviser"}'),
('At a royal ball, who is more likely to charm the entire court?', 'self-assessment', '{"The one with the most dazzling dance moves", "The one with the most captivating stories"}'),
('A rickety rope bridge spans a deep chasm. Who is more likely to test it first?', 'self-assessment', '{"The one who tests it first", "The one who finds a safer way around"}'),
('If the party is captured, who is more likely to devise the escape plan?', 'self-assessment', '{"The meticulous planner who accounts for every detail", "The bold improviser who creates chaos"}'),
('Who is the better storyteller around the campfire?', 'self-assessment', '{"The one who weaves epic tales of heroism", "The one who tells spine-chilling ghost stories"}');

-- Peer-Assessment Questions
INSERT INTO public.questions (question_text, question_type, answer_options) VALUES
('An angry dragon is blocking your path. Who in the party would you send to negotiate a peaceful solution?', 'peer-assessment', '{}'),
('You''re about to enter a complex dungeon filled with traps. Who do you ask to map out the safest route?', 'peer-assessment', '{}'),
('Who in the party would you bet on to win a no-holds-barred arm-wrestling tournament?', 'peer-assessment', '{}'),
('Who is most likely to be the last one standing after eating an impossibly spicy bowl of chili from a goblin food cart?', 'peer-assessment', '{}'),
('If the party needed to create a distraction in a crowded town square, who would put on the most convincing and entertaining performance?', 'peer-assessment', '{}'),
('Who has the sharpest eyes and would be the first to spot a hidden ambush from a mile away?', 'peer-assessment', '{}'),
('Who is the most likely to say "I''ve got a bad feeling about this," and then do it anyway?', 'peer-assessment', '{}'),
('You find a book written in a forgotten language. Who in the party would be the most likely to decipher it?', 'peer-assessment', '{}'),
('When the battle gets intense, who is the first person to jump in front of a friend to protect them?', 'peer-assessment', '{}'),
('You need to retrieve a key from a sleeping guard''s belt. Who do you send on this delicate mission?', 'peer-assessment', '{}'),
('Who in the party could calm down an angry owlbear just by talking to it?', 'peer-assessment', '{}'),
('When faced with a morally ambiguous choice, who does the party look to for guidance?', 'peer-assessment', '{}'),
('Who could bargain a stingy merchant down to the best possible price for a legendary sword?', 'peer-assessment', '{}'),
('In the face of a terrifying, multi-headed hydra, who is the most likely to remain completely calm and composed?', 'peer-assessment', '{}'),
('The party''s wagon has a broken wheel. Who is most likely to rig up a clever, unconventional solution to get it moving again?', 'peer-assessment', '{}'),
('Even in the darkest of dungeons, who keeps everyone''s spirits high with jokes and laughter?', 'peer-assessment', '{}'),
('Who would be the best at a game of "the floor is lava" across a treacherous, crumbling ruin?', 'peer-assessment', '{}'),
('Who is most likely to have their pockets filled with random, seemingly useless items that turn out to be exactly what you need?', 'peer-assessment', '{}'),
('When chaos erupts and no one knows what to do, who naturally steps up to take command and give orders?', 'peer-assessment', '{}'),
('Who would be the best at identifying which of the strange, glowing mushrooms in the cave are safe to eat?', 'peer-assessment', '{}');