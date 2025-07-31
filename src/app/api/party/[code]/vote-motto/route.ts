import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/party/[code]/vote-motto
// body: { proposal_id: string }  -> upsert/set vote to this proposal
// Special case: { proposal_id: null } to remove vote (unvote)
// Change: after any vote mutation, auto-finalize if a proposal has majority of eligible voters.
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> } | { params: { code: string } }
) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const proposalId = body?.proposal_id ?? null;

  // Await dynamic params for Next.js App Router compliance
  const p = (context as any).params;
  const { code } = typeof p?.then === 'function' ? await (p as Promise<{ code: string }>) : (p as { code: string });

  // Resolve auth
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve party from code
  const { data: party, error: partyErr } = await supabase
    .from('parties')
    .select('id, motto')
    .eq('code', code)
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

  // Helper to compute eligible voter count (non-NPC members in this party)
  const getEligibleVoterCount = async (): Promise<number> => {
    const { data: members, error } = await supabase
      .from('party_members')
      .select('id, is_npc')
      .eq('party_id', party.id);
    if (error || !members) return 0;
    return members.filter((m: any) => !m.is_npc).length;
  };

  // Helper to try auto-finalize when any proposal gains strict majority
  const tryAutoFinalize = async () => {
    // If already has motto, skip
    if (party.motto) return;

    // Pull active proposals with counts
    const { data: proposals, error: propErr2 } = await supabase
      .from('party_motto_proposals')
      .select('id, text, vote_count, active, is_finalized')
      .eq('party_id', party.id)
      .eq('active', true);

    if (propErr2 || !proposals || proposals.length === 0) return;

    // Compute threshold: > half of eligible voters
    const eligible = await getEligibleVoterCount();
    if (eligible <= 0) return;
    const threshold = Math.floor(eligible / 2) + 1;

    // Find any proposal meeting majority
    const winner = proposals.find(p => (p.vote_count ?? 0) >= threshold);
    if (!winner) return;

    // Idempotency: ensure not already finalized/party already set
    if (winner.is_finalized) return;

    // Perform updates
    const { error: partyUpdErr } = await supabase
      .from('parties')
      .update({ motto: winner.text })
      .eq('id', party.id);
    if (partyUpdErr) return;

    const { error: markFinalErr } = await supabase
      .from('party_motto_proposals')
      .update({ is_finalized: true })
      .eq('id', winner.id);
    if (markFinalErr) return;

    const { error: deactivateErr } = await supabase
      .from('party_motto_proposals')
      .update({ active: false })
      .eq('party_id', party.id);
    if (deactivateErr) return;
  };

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
      const { error: delErr } = await supabase
        .from('party_motto_votes')
        .delete()
        .in('id', existingVotes.map(v => v.id));
      if (delErr) {
        return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
      }
    }
    // After mutation, attempt auto-finalize (will no-op if no majority)
    await tryAutoFinalize();
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
    await tryAutoFinalize();
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

  await tryAutoFinalize();
  return NextResponse.json({ ok: true, proposalId });
}