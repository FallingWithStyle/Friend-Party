import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Test NPC players - reusable across all minigames
const TEST_NPCS = [
  { name: 'Grimlock the Barbarian', stats: { str: 18, dex: 12, con: 16, int: 8, wis: 10, cha: 14 } },
  { name: 'Zara the Wizard', stats: { str: 8, dex: 14, con: 12, int: 18, wis: 16, cha: 10 } },
  { name: 'Rogar the Rogue', stats: { str: 12, dex: 18, con: 14, int: 16, wis: 12, cha: 8 } },
  { name: 'Thorin the Cleric', stats: { str: 14, dex: 10, con: 16, int: 12, wis: 18, cha: 14 } },
  { name: 'Luna the Ranger', stats: { str: 14, dex: 16, con: 14, int: 12, wis: 16, cha: 12 } }
];

// Minigame configurations
const MINIGAME_CONFIGS = {
  dragons_hoard: {
    name: 'Dragon\'s Hoard',
    description: 'Create cursed loot items and vote on the best ones',
    emoji: '🐉',
    defaultPartyName: 'Test Dragon Hoard Party',
    minPlayers: 2,
    maxPlayers: 6
  },
  changeling: {
    name: 'Changeling',
    description: 'A social deduction minigame (coming soon)',
    emoji: '🔄',
    defaultPartyName: 'Test Changeling Party',
    minPlayers: 4,
    maxPlayers: 8
  },
  // Add more minigames here as they're developed
};

export async function POST(request: NextRequest) {
  try {
    const { 
      minigameType = 'dragons_hoard',
      numPlayers = 4, 
      partyName 
    } = await request.json();

    // Validate minigame type
    const config = MINIGAME_CONFIGS[minigameType as keyof typeof MINIGAME_CONFIGS];
    if (!config) {
      return NextResponse.json(
        { error: `Unknown minigame type: ${minigameType}. Available: ${Object.keys(MINIGAME_CONFIGS).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate player count
    if (numPlayers < config.minPlayers || numPlayers > config.maxPlayers) {
      return NextResponse.json(
        { error: `Number of players must be between ${config.minPlayers} and ${config.maxPlayers} for ${config.name}` },
        { status: 400 }
      );
    }

    // Create a test party
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .insert({
        code: `TEST${Date.now().toString().slice(-4)}`,
        name: partyName || config.defaultPartyName,
        motto: `Testing ${config.name}!`
      })
      .select()
      .single();

    if (partyError) {
      throw new Error(`Failed to create party: ${partyError.message}`);
    }

    // Create NPC users for testing
    const npcUsers = [];
    for (let i = 0; i < numPlayers - 1; i++) {
      const npc = TEST_NPCS[i % TEST_NPCS.length];
      const userId = `test-npc-${Date.now()}-${i}`;
      
      // Create auth user
      const { error: authError } = await supabase.auth.admin.createUser({
        user_id: userId,
        email: `test-npc-${i}@dragonshoard.test`,
        password: 'testpassword123',
        email_confirm: true
      });

      if (authError) {
        console.warn(`Failed to create auth user for NPC ${i}:`, authError.message);
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: npc.name.split(' ')[0],
          last_name: npc.name.split(' ')[1] || '',
          display_name: npc.name
        });

      if (profileError) {
        console.warn(`Failed to create profile for NPC ${i}:`, profileError.message);
      }

      npcUsers.push({ id: userId, name: npc.name, stats: npc.stats });
    }

    // Add party members (including the current user as leader)
    const partyMembers = [
      {
        party_id: party.id,
        user_id: 'fcd61a1f-9393-414b-8048-65a2f3ca8095', // Your test user ID
        first_name: 'Test',
        last_name: 'Leader',
        is_leader: true,
        status: 'Joined',
        ...TEST_NPCS[0].stats
      },
      ...npcUsers.map((npc, index) => ({
        party_id: party.id,
        user_id: npc.id,
        first_name: npc.name.split(' ')[0],
        last_name: npc.name.split(' ')[1] || '',
        is_leader: false,
        status: 'Joined',
        is_npc: true,
        ...npc.stats
      }))
    ];

    const { error: membersError } = await supabase
      .from('party_members')
      .insert(partyMembers);

    if (membersError) {
      throw new Error(`Failed to create party members: ${membersError.message}`);
    }

    // Create a minigame session
    const { data: session, error: sessionError } = await supabase
      .from('minigame_sessions')
      .insert({
        party_id: party.id,
        minigame_type: minigameType,
        status: 'waiting_for_players'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create minigame session: ${sessionError.message}`);
    }

    // Add all players as participants
    const participants = partyMembers.map(member => ({
      session_id: session.id,
      user_id: member.user_id,
      participant_data: {
        display_name: member.first_name + (member.last_name ? ` ${member.last_name}` : ''),
        is_npc: member.is_npc || false
      }
    }));

    const { error: participantsError } = await supabase
      .from('minigame_participants')
      .insert(participants);

    if (participantsError) {
      throw new Error(`Failed to create minigame participants: ${participantsError.message}`);
    }

    return NextResponse.json({
      success: true,
      minigame: {
        type: minigameType,
        name: config.name,
        description: config.description,
        emoji: config.emoji
      },
      party: {
        id: party.id,
        code: party.code,
        name: party.name,
        motto: party.motto
      },
      session: {
        id: session.id,
        minigame_type: session.minigame_type,
        status: session.status
      },
      participants: participants.map(p => ({
        user_id: p.user_id,
        display_name: p.participant_data.display_name,
        is_npc: p.participant_data.is_npc
      })),
      testInfo: {
        partyUrl: `/party/${party.id}`,
        minigameUrl: `/party/${party.id}/minigame/${minigameType}`,
        totalPlayers: numPlayers,
        npcCount: numPlayers - 1,
        minPlayers: config.minPlayers,
        maxPlayers: config.maxPlayers
      }
    });

  } catch (error) {
    console.error('Minigame test setup error:', error);
    return NextResponse.json(
      { 
        error: `Failed to setup ${minigameType} test`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Minigame Test Endpoint',
    availableMinigames: Object.entries(MINIGAME_CONFIGS).map(([key, config]) => ({
      type: key,
      name: config.name,
      description: config.description,
      emoji: config.emoji,
      minPlayers: config.minPlayers,
      maxPlayers: config.maxPlayers
    })),
    usage: {
      method: 'POST',
      body: {
        minigameType: `Type of minigame (default: 'dragons_hoard'). Available: ${Object.keys(MINIGAME_CONFIGS).join(', ')}`,
        numPlayers: 'Number of players (varies by minigame)',
        partyName: 'Name for the test party (optional)'
      }
    },
    examples: {
      dragons_hoard: 'curl -X POST http://localhost:3000/api/test/dragons-hoard -H "Content-Type: application/json" -d \'{"minigameType": "dragons_hoard", "numPlayers": 4}\'',
      changeling: 'curl -X POST http://localhost:3000/api/test/dragons-hoard -H "Content-Type: application/json" -d \'{"minigameType": "changeling", "numPlayers": 6}\''
    }
  });
}
