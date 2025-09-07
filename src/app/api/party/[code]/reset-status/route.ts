import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { IS_DEBUG_MODE } from '@/lib/debug';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!IS_DEBUG_MODE) {
    return new NextResponse('Debug mode is not enabled.', { status: 403 });
  }

  const { code: partyCode } = (await params) as { code: string };
  const supabase = await createClient(); // Await the client creation

  try {
    const logFilePath = path.join(process.cwd(), 'party_log.txt');
    const timestamp = new Date().toISOString();
    const logMessage = `\n====================\nParty ${partyCode} reset at ${timestamp}\n`;
    await fs.appendFile(logFilePath, logMessage);

    // Get party ID
    const { data: partyData, error: partyError } = await supabase
      .from('friendparty.parties')
      .select('id')
      .eq('code', partyCode)
      .single();

    if (partyError || !partyData) {
      console.error('Error fetching party:', partyError);
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const partyId = partyData.id;

    // Delete related data
    // First, get all member IDs for the party to correctly delete answers and votes
    const { data: memberIdsData, error: memberIdsError } = await supabase
      .from('friendparty.party_members')
      .select('id')
      .eq('party_id', partyId);

    if (memberIdsError) {
      console.error('Error fetching member IDs:', memberIdsError);
      return NextResponse.json({ error: 'Failed to fetch member IDs' }, { status: 500 });
    }

    const memberIds = memberIdsData.map(m => m.id);

    if (memberIds.length > 0) {
      await supabase.from('friendparty.answers').delete().in('voter_member_id', memberIds);
      await supabase.from('friendparty.name_proposal_votes').delete().in('voter_member_id', memberIds);
      // Clear motto votes cast by these members (via voter_member_id)
      await supabase.from('friendparty.party_motto_votes').delete().in('voter_member_id', memberIds);
    }
    
    await supabase.from('friendparty.name_proposals').delete().eq('party_id', partyId);
    // Delete motto proposals (cascades will also remove votes if any remain)
    await supabase.from('friendparty.party_motto_proposals').delete().eq('party_id', partyId);
    await supabase.from('friendparty.peer_assessment_assignments').delete().eq('party_id', partyId);

    // Reset party members status
    const { error: memberUpdateError } = await supabase
      .from('friendparty.party_members')
      .update({ status: 'Lobby', adventurer_name: null, strength: null, dexterity: null, constitution: null, intelligence: null, wisdom: null, charisma: null, character_class: null, class: null, exp: 0 })
      .eq('party_id', partyId);

    if (memberUpdateError) {
      console.error('Error resetting party members status:', memberUpdateError);
      return NextResponse.json({ error: 'Failed to reset party members status' }, { status: 500 });
    }

    // Reset party status
    const { error: partyUpdateError } = await supabase
      .from('friendparty.parties')
      .update({ status: 'Lobby' })
      .eq('id', partyId);

    if (partyUpdateError) {
      console.error('Error resetting party status:', partyUpdateError);
      return NextResponse.json({ error: 'Failed to reset party status' }, { status: 500 });
    }

    return NextResponse.json({ message: `Party ${partyCode} reset successfully.` });
  } catch (error) {
    console.error('Error in reset-status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}