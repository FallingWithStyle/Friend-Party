import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { code } = (await params) as { code: string };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { target_member_id, proposed_name } = await request.json();

  if (!target_member_id || !proposed_name) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing target_member_id or proposed_name' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 1. Get the party_id from the party code
  const { data: party, error: partyError } = await supabase
    .from('friendparty.parties')
    .select('id')
    .eq('code', code)
    .single();

  if (partyError || !party) {
    return new NextResponse(JSON.stringify({ error: 'Party not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Get the proposing member's party_member id
  const { data: proposingMember, error: proposingMemberError } = await supabase
    .from('friendparty.party_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('party_id', party.id)
    .single();

  if (proposingMemberError || !proposingMember) {
    return new NextResponse(
      JSON.stringify({ error: 'Proposing member not found in this party' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 3. Insert the new name proposal
  const { data: newProposal, error: insertError } = await supabase
    .from('friendparty.name_proposals')
    .insert({
      party_id: party.id,
      target_member_id,
      proposing_member_id: proposingMember.id,
      proposed_name,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting name proposal:', insertError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to propose name', details: insertError.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Intentionally do NOT auto-cast a vote; proposer may choose to vote later.

  // Return the newly created proposal (client can optimistic-append; realtime will update counts)
  return NextResponse.json(newProposal);
}