import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const { code } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { proposal_id } = await request.json();

  if (!proposal_id) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing proposal_id' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 1. Get the proposal details to verify party and target member
  const { data: proposal, error: proposalError } = await supabase
    .from('name_proposals')
    .select('party_id, target_member_id')
    .eq('id', proposal_id)
    .single();

  if (proposalError || !proposal) {
    return new NextResponse(JSON.stringify({ error: 'Proposal not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Get the voter's party_member id and verify they are in the correct party
  const { data: voterMember, error: voterMemberError } = await supabase
    .from('party_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('party_id', proposal.party_id)
    .single();

  if (voterMemberError || !voterMember) {
    return new NextResponse(
      JSON.stringify({ error: 'Voter not found in this party' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 3. Check if the voter is the person being named
  if (voterMember.id === proposal.target_member_id) {
    return new NextResponse(
      JSON.stringify({ error: 'You cannot vote for your own name' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 4. Insert the vote. The DB unique constraint will prevent duplicate votes.
  const { data: newVote, error: insertError } = await supabase
    .from('name_proposal_votes')
    .insert({
      proposal_id,
      voter_member_id: voterMember.id,
    })
    .select()
    .single();

  if (insertError) {
    // Check for unique constraint violation (code 23505)
    if (insertError.code === '23505') {
        return new NextResponse(
            JSON.stringify({ error: 'You have already voted for this proposal.' }),
            {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
    console.error('Error inserting vote:', insertError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to cast vote', details: insertError.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.json(newVote);
}