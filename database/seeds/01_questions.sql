-- This script is idempotent. It will first delete all existing questions
-- and then re-seed the table from a clean slate.

-- Clear existing data
DELETE FROM public.questions;

-- Self-Assessment Questions
INSERT INTO public.questions (question_text, question_type, answer_options) VALUES
('You find a mysterious, glowing potion. What do you do?', 'self-assessment', '[{"text": "Drink it immediately", "stat": "CON"}, {"text": "Try to identify it first", "stat": "INT"}, {"text": "Offer it to a friend to test", "stat": "CHA"}]'),
('When planning a group trip, what role do you take?', 'self-assessment', '[{"text": "The one with the detailed spreadsheet", "stat": "INT"}, {"text": "Handle the long drives and heavy lifting", "stat": "CON"}, {"text": "The one who convinces everyone to go somewhere completely different", "stat": "CHA"}]'),
('A heated debate breaks out at a dinner party. How do you react?', 'self-assessment', '[{"text": "Mediate to find common ground", "stat": "WIS"}, {"text": "Use facts and logic to win", "stat": "INT"}, {"text": "Create a diversion with a hilarious story", "stat": "CHA"}]'),
('Your team is facing a tight deadline. What''s your approach?', 'self-assessment', '[{"text": "Staying up all night to get it done", "stat": "CON"}, {"text": "Finding a clever shortcut", "stat": "INT"}, {"text": "Keeping morale high with snacks and encouragement", "stat": "CHA"}]'),
('You''re given a complex gadget with no instructions. What''s your first move?', 'self-assessment', '[{"text": "Carefully tinker with the mechanisms to see how they respond", "stat": "DEX"}, {"text": "Read the manual cover-to-cover", "stat": "INT"}, {"text": "Try to build something even better with the parts", "stat": "INT"}]'),
('When you enter a room, what do you tend to do?', 'self-assessment', '[{"text": "Command attention naturally", "stat": "CHA"}, {"text": "Blend into the background", "stat": "DEX"}, {"text": "Observe quietly from a corner", "stat": "WIS"}]'),
('What does your ideal weekend involve?', 'self-assessment', '[{"text": "A strenuous mountain hike", "stat": "STR"}, {"text": "A competitive board game tournament", "stat": "INT"}, {"text": "A relaxing day with a good book", "stat": "WIS"}]'),
('If you had to survive in the wilderness, what would be your greatest asset?', 'self-assessment', '[{"text": "Your physical endurance", "stat": "CON"}, {"text": "Your knowledge of edible plants", "stat": "INT"}, {"text": "Your ability to befriend a bear", "stat": "CHA"}]'),
('You''re offered a choice of one superpower. Which do you choose?', 'self-assessment', '[{"text": "Super strength", "stat": "STR"}, {"text": "The ability to read minds", "stat": "INT"}, {"text": "The power of flight", "stat": "DEX"}]'),
('When assembling furniture, what''s your style?', 'self-assessment', '[{"text": "Follow the instructions perfectly", "stat": "INT"}, {"text": "Improvise when a piece doesn''t fit", "stat": "DEX"}, {"text": "Rely on intuition to adjust the design without instructions", "stat": "WIS"}]'),
('Who is more likely to successfully negotiate with a grumpy troll?', 'self-assessment', '[{"text": "The one with a silver tongue", "stat": "CHA"}, {"text": "The one with a compelling argument", "stat": "INT"}, {"text": "The one who listens carefully to find common ground", "stat": "WIS"}]'),
('When lost in a dense forest, who would you trust more to lead the way out?', 'self-assessment', '[{"text": "The one with a keen sense of direction", "stat": "WIS"}, {"text": "The one who seems to have an encyclopedic knowledge of nature", "stat": "INT"}, {"text": "The one with surefooted agility over rough terrain", "stat": "DEX"}]'),
('If a priceless artifact is protected by a maze of laser beams, who is more likely to get through unscathed?', 'self-assessment', '[{"text": "The nimble acrobat", "stat": "DEX"}, {"text": "The clever strategist who finds the off switch", "stat": "INT"}, {"text": "The one who trusts keen instincts to time movements", "stat": "WIS"}]'),
('A friendly tavern brawl breaks out. Who would you rather have on your side?', 'self-assessment', '[{"text": "The person who can take a punch", "stat": "CON"}, {"text": "The person who can end the fight with a single, intimidating glare", "stat": "CHA"}, {"text": "The powerhouse who can clear a path", "stat": "STR"}]'),
('Faced with a cryptic, ancient riddle, who is more likely to solve it?', 'self-assessment', '[{"text": "The one who pores over dusty tomes for the answer", "stat": "INT"}, {"text": "The one who has a sudden, brilliant flash of insight", "stat": "WIS"}, {"text": "The one who refuses to give up and tests every possibility", "stat": "CON"}]'),
('When the party is ambushed by goblins, who is more likely to have the perfect, unexpected item in their backpack to save the day?', 'self-assessment', '[{"text": "The meticulous planner", "stat": "INT"}, {"text": "The bold improviser", "stat": "DEX"}, {"text": "The one whose instincts always pack the right essentials", "stat": "WIS"}]'),
('At a royal ball, who is more likely to charm the entire court?', 'self-assessment', '[{"text": "The one with the most dazzling dance moves", "stat": "DEX"}, {"text": "The one with the most captivating stories", "stat": "CHA"}, {"text": "The one who knows every noble''s name and etiquette rule", "stat": "INT"}]'),
('A rickety rope bridge spans a deep chasm. Who is more likely to test it first?', 'self-assessment', '[{"text": "The strong one who cautiously puts weight on the planks and reinforces them", "stat": "STR"}, {"text": "The one who finds a safer way around", "stat": "WIS"}, {"text": "The surefooted one who balances across safely", "stat": "DEX"}]'),
('If the party is captured, who is more likely to devise the escape plan?', 'self-assessment', '[{"text": "The meticulous planner who accounts for every detail", "stat": "INT"}, {"text": "The bold improviser who creates chaos", "stat": "DEX"}, {"text": "The smooth talker who convinces a guard to help", "stat": "CHA"}]'),
('Who is the better storyteller around the campfire?', 'self-assessment', '[{"text": "The one who weaves epic tales of heroism", "stat": "CHA"}, {"text": "The one who shares insightful parables and lessons that guide choices", "stat": "WIS"}, {"text": "The scholar who recounts accurate legends", "stat": "INT"}]'),
('You''re hauling supplies through a swamp. What''s your role?', 'self-assessment', '[{"text": "Carry the heaviest packs", "stat": "STR"}, {"text": "Set a steady pace and keep everyone hydrated", "stat": "CON"}, {"text": "Scout ahead to find firm ground", "stat": "WIS"}]'),
('A narrow mountain ledge must be traversed. What do you do?', 'self-assessment', '[{"text": "Inch along with precise footwork", "stat": "DEX"}, {"text": "Anchor a rope and belay everyone across", "stat": "STR"}, {"text": "Advise a safer route after watching the wind and rock", "stat": "WIS"}]'),
('The campfire is dwindling in a storm. How do you help?', 'self-assessment', '[{"text": "Keep it alive through the night", "stat": "CON"}, {"text": "Tell inspiring tales to keep spirits high", "stat": "CHA"}, {"text": "Rig a windbreak with tarp and stakes", "stat": "DEX"}]'),
('A boulder blocks the cave entrance. What''s your move?', 'self-assessment', '[{"text": "Muscle it aside with leverage", "stat": "STR"}, {"text": "Chip away and take breaks until it moves", "stat": "CON"}, {"text": "Listen for a vent shaft and guide the group to it", "stat": "WIS"}]'),
('A poisoned needle trap pricks your finger. What next?', 'self-assessment', '[{"text": "Grit your teeth and press on", "stat": "CON"}, {"text": "Use steady hands to extract the needle and bandage", "stat": "DEX"}, {"text": "Calmly assess symptoms before acting", "stat": "WIS"}]'),
('You''re asked to represent the party at a town hall. What''s your approach?', 'self-assessment', '[{"text": "Deliver a rousing, persuasive speech", "stat": "CHA"}, {"text": "Read the room and speak to concerns with care", "stat": "WIS"}, {"text": "Stand long hours without wavering to show commitment", "stat": "CON"}]'),
('A raging river blocks your path. How do you cross?', 'self-assessment', '[{"text": "Swim across with powerful strokes", "stat": "STR"}, {"text": "Lash together a quick raft and ferry loads", "stat": "DEX"}, {"text": "Find a shallow ford after studying the currents", "stat": "WIS"}]'),
('You draw the long night watch. What''s your style?', 'self-assessment', '[{"text": "Stay awake and alert until dawn", "stat": "CON"}, {"text": "Notice distant shapes and subtle sounds", "stat": "WIS"}, {"text": "Pace a precise, quiet patrol route", "stat": "DEX"}]'),
('The door is barred from the other side. What do you try?', 'self-assessment', '[{"text": "Shoulder-charge to break it", "stat": "STR"}, {"text": "Work the hinges quietly", "stat": "DEX"}, {"text": "Counsel patience and wait for a shift change", "stat": "WIS"}]'),
('Market negotiations have soured. How do you respond?', 'self-assessment', '[{"text": "Charm the merchant back to friendly terms", "stat": "CHA"}, {"text": "Keep your cool and steadily restate your offer", "stat": "CON"}, {"text": "Read their tells and adjust your approach", "stat": "WIS"}]'),
('An ogre challenges you to a friendly contest. What do you do?', 'self-assessment', '[{"text": "Arm-wrestle them with a grin", "stat": "STR"}, {"text": "Talk them into calling it a draw over a drink", "stat": "CHA"}, {"text": "Calculate leverage and body mechanics to win fairly", "stat": "INT"}]'),
('A delicate antique lock needs opening. What''s your approach?', 'self-assessment', '[{"text": "Pick the lock with feather-light hands", "stat": "DEX"}, {"text": "Study the mechanism and diagram it first", "stat": "INT"}, {"text": "Sense when the tumblers align by feel", "stat": "WIS"}]'),
('Your party must march all day to reach the gates by dusk. Your contribution?', 'self-assessment', '[{"text": "Keep a steady pace and carry spare water for others", "stat": "CON"}, {"text": "Sing travel songs to keep spirits high", "stat": "CHA"}, {"text": "Read the sun and shadows to time rest breaks", "stat": "WIS"}]'),
('A stone door sealed with ancient runes blocks the path. What''s your move?', 'self-assessment', '[{"text": "Muscle the slab with a lever", "stat": "STR"}, {"text": "Parse the inscription to find the release", "stat": "INT"}, {"text": "Discern the safe sequence by intuition", "stat": "WIS"}]'),
('The tavern floor is slick, and you''re carrying eight foaming mugs.', 'self-assessment', '[{"text": "Glide through with perfect balance", "stat": "DEX"}, {"text": "Hold steady the whole way without spilling", "stat": "CON"}, {"text": "Charm your way to borrowed coasters and a clear path", "stat": "CHA"}]'),
('A sudden blizzard rolls in on the pass. How do you help the group?', 'self-assessment', '[{"text": "Endure the cold and keep moving", "stat": "CON"}, {"text": "Scout the wind lines to find shelter", "stat": "WIS"}, {"text": "Build a snow wall and haul extra wood for a fire", "stat": "STR"}]'),
('A royal audit demands your records by morning.', 'self-assessment', '[{"text": "Crunch the paperwork with meticulous accuracy", "stat": "INT"}, {"text": "Smooth things over with the officials", "stat": "CHA"}, {"text": "Stand in line for hours while staying composed", "stat": "CON"}]'),
('A teammate dangles from a cliff, rope slipping.', 'self-assessment', '[{"text": "Haul them up hand-over-hand", "stat": "STR"}, {"text": "Tie and adjust knots at speed", "stat": "DEX"}, {"text": "Brace the anchor and hold steady under load", "stat": "CON"}]'),
('A suspicious chest might be a mimic. What do you do?', 'self-assessment', '[{"text": "Notice the telltale drip and false wood grain", "stat": "WIS"}, {"text": "Prod it lightly with a ten-foot pole", "stat": "DEX"}, {"text": "Let it bite the gauntlet while you pin it", "stat": "CON"}]'),
('Midnight negotiations with a rival guild begin.', 'self-assessment', '[{"text": "Charm the room and build rapport", "stat": "CHA"}, {"text": "Track every concession and clause", "stat": "INT"}, {"text": "Sense the moment to pause and adjourn", "stat": "WIS"}]'),
('A heavy portcullis is jammed.', 'self-assessment', '[{"text": "Heave it up together", "stat": "STR"}, {"text": "Find the sweet spot with the pry bar", "stat": "DEX"}, {"text": "Brace it while others pass through", "stat": "CON"}]'),
('An arcane riddle resets on every mistake.', 'self-assessment', '[{"text": "Deduce the correct pattern", "stat": "INT"}, {"text": "Persist through retries without frustration", "stat": "CON"}, {"text": "Negotiate a hint from the guardian", "stat": "CHA"}]'),
('The stew tastes... suspicious.', 'self-assessment', '[{"text": "Recognize the herbs and off-notes", "stat": "WIS"}, {"text": "Sample a tiny spoonful and tough it out", "stat": "CON"}, {"text": "Convince a gourmand to offer feedback", "stat": "CHA"}]'),
('A festival dares visitors to cross a rope for prizes.', 'self-assessment', '[{"text": "Cross with catlike poise", "stat": "DEX"}, {"text": "Hype the crowd with a bow mid-way", "stat": "CHA"}, {"text": "Carry a balancing pole like a pro", "stat": "STR"}]'),
('You face a very lifelike basilisk statue.', 'self-assessment', '[{"text": "Discern it''s just stone from the chisel marks", "stat": "WIS"}, {"text": "Reassure the group with confident words", "stat": "CHA"}, {"text": "Hold the pose without blinking for a full minute", "stat": "CON"}]'),
('Hauling treasure through a cramped tunnel.', 'self-assessment', '[{"text": "Shoulder the heaviest chests", "stat": "STR"}, {"text": "Angle the load to avoid snags", "stat": "DEX"}, {"text": "Make several trips without complaint", "stat": "CON"}]'),
('Dinner for fifty hungry adventurers is due in an hour.', 'self-assessment', '[{"text": "Scale and time the recipe precisely", "stat": "INT"}, {"text": "Chop and plate with speed and precision", "stat": "DEX"}, {"text": "Win them over with presentation and banter", "stat": "CHA"}]'),
('A haunted library whispers your name.', 'self-assessment', '[{"text": "Tune out distractions and stay vigilant", "stat": "WIS"}, {"text": "Pull an all-nighter to finish the reading", "stat": "CON"}, {"text": "Decode an ominous cipher", "stat": "INT"}]'),
('A storm fells an ancient oak across the road and a line of wagons forms behind you. What do you do?', 'self-assessment', '[{"text": "Plant your feet and roll the trunk aside", "stat": "STR"}, {"text": "Slip under the branches to scout a bypass route", "stat": "DEX"}, {"text": "Rig a quick block-and-tackle to move it safely", "stat": "INT"}]'),
('A rusted portcullis sags mid-raise; you must hold it while the party squeezes through.', 'self-assessment', '[{"text": "Press it up with raw strength", "stat": "STR"}, {"text": "Hold steady and control your breathing", "stat": "CON"}, {"text": "Time the lifts so everyone passes safely", "stat": "WIS"}]'),
('A produce cart breaks loose and barrels downhill toward a crowded market.', 'self-assessment', '[{"text": "Plant your feet and stop it", "stat": "STR"}, {"text": "Leap aboard and grab the reins", "stat": "DEX"}, {"text": "Clear the path with commanding shouts", "stat": "CHA"}]'),
('An iron door''s hinges are seized with rust in a damp corridor.', 'self-assessment', '[{"text": "Bust the pins with leverage", "stat": "STR"}, {"text": "Oil and work the mechanism methodically", "stat": "INT"}, {"text": "Tap precisely where it frees", "stat": "DEX"}]'),
('Fishing at dusk, a giant river eel yanks your line toward the rapids.', 'self-assessment', '[{"text": "Reel and wrestle it in", "stat": "STR"}, {"text": "Hold your breath and keep calm", "stat": "CON"}, {"text": "Tie a quick securing knot", "stat": "DEX"}]'),
('Fresh rockslide debris chokes the mountain trail just as night falls.', 'self-assessment', '[{"text": "Lift the big stones out of the way", "stat": "STR"}, {"text": "Pace yourself to avoid exhaustion", "stat": "CON"}, {"text": "Rally volunteers to form a line", "stat": "CHA"}]'),
('An ally twists an ankle miles from camp and needs carrying.', 'self-assessment', '[{"text": "Fireman-carry them to safety", "stat": "STR"}, {"text": "Carry them for miles without stopping", "stat": "CON"}, {"text": "Choose the smoothest path", "stat": "WIS"}]'),
('Breaking camp before dawn as rain begins to fall.', 'self-assessment', '[{"text": "Pack fast with tidy bundles", "stat": "DEX"}, {"text": "Checklists to ensure nothing is left", "stat": "INT"}, {"text": "Haul the heaviest poles and canvas", "stat": "STR"}]'),
('At the midsummer festival, a roaring crowd blocks your view of the stage.', 'self-assessment', '[{"text": "Hoist a friend up to see", "stat": "STR"}, {"text": "Weave through with nimble steps", "stat": "DEX"}, {"text": "Start a chant to open a lane", "stat": "CHA"}]'),
('After a thunderstorm, your wagon is axle-deep in mud.', 'self-assessment', '[{"text": "Push while everyone else pulls", "stat": "STR"}, {"text": "Build quick traction mats from branches", "stat": "INT"}, {"text": "Keep pushing through the rain", "stat": "CON"}]'),
('At the fighters'' guild, sparring partners line up for drills.', 'self-assessment', '[{"text": "Overpower with solid strikes", "stat": "STR"}, {"text": "Dance out of reach and counter", "stat": "DEX"}, {"text": "Wait for the perfect opening", "stat": "WIS"}]'),
('The bell tower needs its heaviest bell hauled into place before sundown.', 'self-assessment', '[{"text": "Haul on the rope with force", "stat": "STR"}, {"text": "Keep a steady, unbroken rhythm", "stat": "CON"}, {"text": "Rig a simple pulley advantage", "stat": "INT"}]'),
('Tug-of-war at the harvest fair draws a cheering crowd.', 'self-assessment', '[{"text": "Anchor the line as the strongest", "stat": "STR"}, {"text": "Rally the team with cheers", "stat": "CHA"}, {"text": "Dig in and endure the pull", "stat": "CON"}]'),
('In a trapped corridor, stone walls begin to grind inward.', 'self-assessment', '[{"text": "Pry the walls apart", "stat": "STR"}, {"text": "Slip in and disable the latch", "stat": "DEX"}, {"text": "Spot the counterweight mechanism", "stat": "INT"}]'),
('On the training field, you''re asked to hold the shield wall against a charge.', 'self-assessment', '[{"text": "Brace and drive forward", "stat": "STR"}, {"text": "Absorb the impact without faltering", "stat": "CON"}, {"text": "Call cadence to keep formation", "stat": "CHA"}]'),
('During the river fair, a log-rolling contest begins on a fast current.', 'self-assessment', '[{"text": "Balance with quick footwork", "stat": "DEX"}, {"text": "Steady the log with a pole", "stat": "STR"}, {"text": "Read the currents for stable spots", "stat": "WIS"}]'),
('In the smithy, you must hoist a heavy anvil onto the workbench.', 'self-assessment', '[{"text": "Lift and set it cleanly", "stat": "STR"}, {"text": "Control breathing and posture", "stat": "CON"}, {"text": "Guide it into perfect position", "stat": "DEX"}]'),
('The winter festival hosts a giant snowball contest on packed snow.', 'self-assessment', '[{"text": "Push the biggest snowball", "stat": "STR"}, {"text": "Keep rolling without tiring", "stat": "CON"}, {"text": "Trade good-natured jabs to distract rivals", "stat": "CHA"}]'),
('At low tide, a fishing boat sits beached on wet sand.', 'self-assessment', '[{"text": "Drag from the prow with power", "stat": "STR"}, {"text": "Set up rollers from driftwood", "stat": "INT"}, {"text": "Pull steadily on the line", "stat": "CON"}]'),
('In the village square, a prize-winning pig slips its pen and bolts.', 'self-assessment', '[{"text": "Lasso with a quick throw", "stat": "DEX"}, {"text": "Hold it still once caught", "stat": "STR"}, {"text": "Soothe it to stop thrashing", "stat": "WIS"}]');

-- Question Count Per Stat (self-assessment) — 68 questions total:
-- STR: 36 | DEX: 35 | CON: 36 | INT: 33 | WIS: 34 | CHA: 30

-- Peer assessment differs from self-assessment:
-- - answer_options is empty ({}). Players select which party member best fits.
-- - stat_id marks the ability the question assesses for the chosen member.
INSERT INTO public.questions (question_text, question_type, answer_options, stat_id) VALUES
-- STR (10)
('Who would you bet on to win a no-holds-barred arm-wrestling tournament?', 'peer-assessment', '{}', 'STR'),
('When the battle gets intense, who is the first person to jump in front of a friend to protect them?', 'peer-assessment', '{}', 'STR'),
('Who in the party could lift a fallen portcullis to free an ally?', 'peer-assessment', '{}', 'STR'),
('During a siege, who would carry two shields at once to guard others?', 'peer-assessment', '{}', 'STR'),
('Who would you pick to break down a barred door when seconds matter?', 'peer-assessment', '{}', 'STR'),
('When the wagon is stuck, who supplies the raw muscle to push it free?', 'peer-assessment', '{}', 'STR'),
('In a tug-of-war, who would anchor your team at the back?', 'peer-assessment', '{}', 'STR'),
('If a friend is injured, who can carry them the farthest without rest?', 'peer-assessment', '{}', 'STR'),
('Faced with a heavy drawbridge crank, who turns it fastest?', 'peer-assessment', '{}', 'STR'),
('Who could hold a charging boar long enough for others to react?', 'peer-assessment', '{}', 'STR'),

-- DEX (10)
('You need to retrieve a key from a sleeping guard''s belt. Who do you send on this delicate mission?', 'peer-assessment', '{}', 'DEX'),
('Who would be the best at a game of "the floor is lava" across a treacherous, crumbling ruin?', 'peer-assessment', '{}', 'DEX'),
('Who threads a needle through a maze of tripwires without setting them off?', 'peer-assessment', '{}', 'DEX'),
('Crossing a slick rooftop, who keeps perfect footing?', 'peer-assessment', '{}', 'DEX'),
('Who can pick a delicate lock in the least amount of time?', 'peer-assessment', '{}', 'DEX'),
('Who snatches a falling artifact before it hits the floor?', 'peer-assessment', '{}', 'DEX'),
('On a narrow ledge, who moves the most surely?', 'peer-assessment', '{}', 'DEX'),
('Who can disarm a pressure plate with the steadiest hands?', 'peer-assessment', '{}', 'DEX'),
('Who throws the most accurate dagger at a distant target?', 'peer-assessment', '{}', 'DEX'),
('Who weaves through a crowd to deliver a message fastest?', 'peer-assessment', '{}', 'DEX'),

-- CON (10)
('Who is most likely to be the last one standing after eating an impossibly spicy bowl of chili from a goblin food cart?', 'peer-assessment', '{}', 'CON'),
('Who is the most likely to say "I''ve got a bad feeling about this," and then do it anyway?', 'peer-assessment', '{}', 'CON'),
('In the face of a terrifying, multi-headed hydra, who is the most likely to remain completely calm and composed?', 'peer-assessment', '{}', 'CON'),
('Who can march the longest without slowing the group?', 'peer-assessment', '{}', 'CON'),
('After a sleepless night, who still performs at their best?', 'peer-assessment', '{}', 'CON'),
('Who endures freezing rain without complaint?', 'peer-assessment', '{}', 'CON'),
('Who shrugs off a nasty goblin brew and keeps going?', 'peer-assessment', '{}', 'CON'),
('In a sandstorm, who stays steady and unshaken?', 'peer-assessment', '{}', 'CON'),
('Who stands guard all night and remains alert at dawn?', 'peer-assessment', '{}', 'CON'),
('Who resists poison the best during a risky feast?', 'peer-assessment', '{}', 'CON'),

-- INT (10)
('You''re about to enter a complex dungeon filled with traps. Who would you ask to map out the safest route?', 'peer-assessment', '{}', 'INT'),
('You find a book written in a forgotten language. Who in the party would be the most likely to decipher it?', 'peer-assessment', '{}', 'INT'),
('A wagon''s wheel breaks. Who is most likely to rig up a clever, unconventional solution to get it moving again?', 'peer-assessment', '{}', 'INT'),
('Who is most likely to have their pockets filled with random, seemingly useless items that turn out to be exactly what you need?', 'peer-assessment', '{}', 'INT'),
('Who deciphers a complex cipher fastest?', 'peer-assessment', '{}', 'INT'),
('Who would you ask to plan the safest heist route?', 'peer-assessment', '{}', 'INT'),
('Who recalls obscure lore that solves a puzzle?', 'peer-assessment', '{}', 'INT'),
('Who optimizes the camp layout for speed and safety?', 'peer-assessment', '{}', 'INT'),
('Who reverse-engineers a strange device to reveal its function?', 'peer-assessment', '{}', 'INT'),
('Who chooses the best formation against an unfamiliar foe?', 'peer-assessment', '{}', 'INT'),

-- WIS (10)
('Who has the sharpest eyes and would be the first to spot a hidden ambush from a mile away?', 'peer-assessment', '{}', 'WIS'),
('When faced with a morally ambiguous choice, who would people look to for guidance?', 'peer-assessment', '{}', 'WIS'),
('Who would be the best at identifying which of the strange, glowing mushrooms in the cave are safe to eat?', 'peer-assessment', '{}', 'WIS'),
('Who spots an ambush before anyone else?', 'peer-assessment', '{}', 'WIS'),
('Who reads animal tracks most accurately?', 'peer-assessment', '{}', 'WIS'),
('Who senses a storm coming and suggests shelter in time?', 'peer-assessment', '{}', 'WIS'),
('Who notices the hidden shrine most travelers miss?', 'peer-assessment', '{}', 'WIS'),
('Who best judges whether a stranger is trustworthy?', 'peer-assessment', '{}', 'WIS'),
('Who hears the faint sound of distant drums first?', 'peer-assessment', '{}', 'WIS'),
('Who discerns the safest path across a bog?', 'peer-assessment', '{}', 'WIS'),

-- CHA (10)
('An angry dragon is blocking your path. Who would you send to negotiate a peaceful solution?', 'peer-assessment', '{}', 'CHA'),
('If the party needed to create a distraction in a crowded town square, who would put on the most convincing and entertaining performance?', 'peer-assessment', '{}', 'CHA'),
('Who could calm down an angry owlbear just by talking to it?', 'peer-assessment', '{}', 'CHA'),
('Who could bargain a stingy merchant down to the best possible price for a legendary sword?', 'peer-assessment', '{}', 'CHA'),
('Even in the darkest of dungeons, who keeps everyone''s spirits high with jokes and laughter?', 'peer-assessment', '{}', 'CHA'),
('When chaos erupts and no one knows what to do, who naturally steps up to take command and give orders?', 'peer-assessment', '{}', 'CHA'),
('Who persuades a guard to let the party pass without papers?', 'peer-assessment', '{}', 'CHA'),
('Who rallies a panicked crowd into orderly lines?', 'peer-assessment', '{}', 'CHA'),
('Who brokers peace between rival gangs?', 'peer-assessment', '{}', 'CHA'),
('Who talks a merchant into throwing in a bonus for free?', 'peer-assessment', '{}', 'CHA');

-- Question Count Per Stat (peer-assessment) — 60 questions total:
-- STR: 10 | DEX: 10 | CON: 10 | INT: 10 | WIS: 10 | CHA: 10