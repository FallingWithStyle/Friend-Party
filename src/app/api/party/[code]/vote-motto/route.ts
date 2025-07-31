import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/party/[code]/vote-motto
// body: { proposal_id: string }  -> upsert/set vote to this proposal
// Special case: { proposal_id: null } to remove vote (unvote)
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const proposalId = body?.proposal_id ?? null;

  // Resolve auth
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve party from code
  const { data: party, error: partyErr } = await supabase
    .from('parties')
    .select('id')
    .eq('code', params.code)
    .single();

  if (partyErr || !party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Resolve member
  const { data: meMember, error: meErr } = await supabase
    .from('party_members')
    .select('id')
    .eq('party_id', party.id)
    .eq('user_id', userResp.user.id)
    .single();

  if (meErr || !meMember) {
    return NextResponse.json({ error: 'Not a member of this party' }, { status: 403 });
  }

  // If proposalId provided, validate it belongs to this party and is active
  if (proposalId) {
    const { data: proposal, error: propErr } = await supabase
      .from('party_motto_proposals')
      .select('id, party_id, active, is_finalized')
      .eq('id', proposalId)
      .single();

    if (propErr || !proposal || proposal.party_id !== party.id) {
      return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
    }
    if (!proposal.active || proposal.is_finalized) {
      return NextResponse.json({ error: 'Voting is closed for this proposal' }, { status: 400 });
    }
  }

  // Fetch any existing vote for this member across proposals in this party
  const { data: existingVotes, error: existErr } = await supabase
    .from('party_motto_votes')
    .select('id, proposal_id')
    .in('proposal_id',
      (
        await supabase
          .from('party_motto_proposals')
          .select('id')
          .eq('party_id', party.id)
      ).data?.map(p => p.id) ?? []
    )
    .eq('voter_member_id', meMember.id);

  if (existErr) {
    return NextResponse.json({ error: 'Failed to fetch existing vote' }, { status: 500 });
  }

  // If unvoting (proposalId == null), delete existing vote if any
  if (!proposalId) {
    if (existingVotes && existingVotes.length > 0) {
      // Delete all existing votes for safety (should be at most one due to unique constraint)
      const { error: delErr } = await supabase
        .from('party_motto_votes')
        .delete()
        .in('id', existingVotes.map(v => v.id));
      if (delErr) {
        return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, proposalId: null });
  }

  // If there is an existing vote on a different proposal, update to the new proposal
  if (existingVotes && existingVotes.length > 0) {
    const current = existingVotes[0];
    if (current.proposal_id !== proposalId) {
      const { error: updErr } = await supabase
        .from('party_motto_votes')
        .update({ proposal_id: proposalId })
        .eq('id', current.id);
      if (updErr) {
        return NextResponse.json({ error: 'Failed to switch vote' }, { status: 500 });
      }
    }
    // If same proposal, it's idempotent
    return NextResponse.json({ ok: true, proposalId });
  }

  // Otherwise insert a new vote
  const { error: insErr } = await supabase
    .from('party_motto_votes')
    .insert({
      proposal_id: proposalId,
      voter_member_id: meMember.id,
    });

  if (insErr) {
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proposalId });
}