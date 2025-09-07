import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { code: _code } = (await params) as { code: string };

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

  // 1. Get the selected proposal details
  const { data: proposal, error: proposalError } = await supabase
    .from('friendparty.name_proposals')
    .select('party_id, target_member_id, proposed_name')
    .eq('id', proposal_id)
    .single();

  if (proposalError || !proposal) {
    return new NextResponse(JSON.stringify({ error: 'Proposal not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Get the current user's party member details
  const { data: member, error: memberError } = await supabase
    .from('friendparty.party_members')
    .select('id, is_leader')
    .eq('user_id', user.id)
    .eq('party_id', proposal.party_id)
    .single();

  if (memberError || !member) {
    return new NextResponse(
      JSON.stringify({ error: 'Requesting user not found in this party' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 3. Server-side Tie-breaking Validation
  // Fetch all active proposals for this naming event to calculate votes.
  const { data: activeProposals, error: proposalsError } = await supabase
    .from('friendparty.name_proposals')
    .select('id')
    .eq('party_id', proposal.party_id)
    .eq('target_member_id', proposal.target_member_id)
    .eq('is_active', true);

  if (proposalsError || !activeProposals || activeProposals.length === 0) {
    return new NextResponse(JSON.stringify({ error: 'Could not find active proposals for validation.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const proposalIds = activeProposals.map(p => p.id);

  // Fetch all votes for the active proposals
  const { data: votes, error: votesError } = await supabase
    .from('friendparty.name_proposal_votes')
    .select('proposal_id')
    .in('proposal_id', proposalIds);

  if (votesError) {
    return new NextResponse(JSON.stringify({ error: 'Could not fetch votes for validation.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Calculate vote counts
  const voteCounts = (votes || []).reduce((acc, vote) => {
    const key = vote.proposal_id;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Determine winners and check for a tie
  const maxVotes = Math.max(0, ...Object.values(voteCounts));
  const winningProposalIds = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);

  const isTie = winningProposalIds.length > 1;
  const isSelectedProposalInTie = winningProposalIds.includes(String(proposal_id));

  // Enforce tie-breaking rule: must be a tie, and the selected proposal must be part of it.
  if (!isTie || !isSelectedProposalInTie) {
    return new NextResponse(
      JSON.stringify({ error: 'Finalization is only permitted to break a tie among the top-voted names.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Authorization Check: Allow if user is the target member OR the party leader
  const isTargetMember = member.id === proposal.target_member_id;
  const isPartyLeader = member.is_leader;

  if (!isTargetMember && !isPartyLeader) {
    return new NextResponse(
      JSON.stringify({ error: 'You are not authorized to finalize the name.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 5. Update the adventurer's name
  const { error: updateNameError } = await supabase
    .from('friendparty.party_members')
    .update({ adventurer_name: proposal.proposed_name })
    .eq('id', proposal.target_member_id);

  if (updateNameError) {
    console.error('Error updating adventurer name:', updateNameError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to update adventurer name', details: updateNameError.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 6. Deactivate all proposals for this naming event
  const { error: deactivateProposalsError } = await supabase
    .from('friendparty.name_proposals')
    .update({ is_active: false })
    .eq('party_id', proposal.party_id)
    .eq('target_member_id', proposal.target_member_id)
    .eq('is_active', true);

  if (deactivateProposalsError) {
    // This is not a critical failure; the name was set. Log it and proceed.
    console.error('Error deactivating proposals:', deactivateProposalsError);
  }

  return NextResponse.json({ success: true, new_name: proposal.proposed_name });
}