import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/party/[code]/vote-motto
// body: { proposal_id: string | null, proposal_text?: string }
// - proposal_id null -> unvote
// - When proposal_id is provided but might be stale/optimistic, proposal_text is used to resolve to canonical id.
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> } | { params: { code: string } }
) {
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));
  const proposalId = body?.proposal_id ?? null;
  // Single normalized proposal_text
  const proposalTextFromBody: string | null =
    typeof body?.proposal_text === 'string' && body.proposal_text.trim().length > 0
      ? body.proposal_text.trim()
      : null;

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

  // If proposalId provided, validate it belongs to this party and is active.
  // If not found by id (legacy/new schema drift or optimistic id), or when id is absent, attempt resolution by exact text match in party.
  let resolvedProposalId: string | null = null;

  // Normalized fetch by id that tolerates legacy schema (missing columns) and RLS aliasing.
  const fetchProposalNormalized = async (id: string) => {
    // Try new columns first
    const resNew = await supabase
      .from('party_motto_proposals')
      .select('id, party_id, text, active, is_finalized')
      .eq('id', id)
      .maybeSingle();

    if (!resNew.error && resNew.data) {
      const p = resNew.data as any;
      return {
        id: p.id,
        party_id: p.party_id,
        text: p.text ?? null,
        active: p.active ?? true,
        is_finalized: !!p.is_finalized,
      };
    }
    // If error is unknown column, try legacy columns
    if (resNew.error && resNew.error.code === '42703') {
      const resLegacy = await supabase
        .from('party_motto_proposals')
        .select('id, party_id, proposed_motto, votes, created_at')
        .eq('id', id)
        .maybeSingle();
      if (!resLegacy.error && resLegacy.data) {
        const p = resLegacy.data as any;
        return {
          id: p.id,
          party_id: p.party_id,
          text: p.proposed_motto ?? null,
          // Legacy schema had no active/is_finalized; assume active and not finalized
          active: true,
          is_finalized: false,
        };
      }
      // fallthrough to return null on other legacy errors
    }
    return null;
  };

  const resolveByText = async (text: string | null) => {
    if (!text) return null;
    // Try new schema text column
    const byTextNew = await supabase
      .from('party_motto_proposals')
      .select('id, active, is_finalized')
      .eq('party_id', party.id)
      .eq('text', text)
      .limit(1)
      .maybeSingle();
    let chosen: any = (!byTextNew.error && byTextNew.data) ? byTextNew.data : null;

    if (!chosen) {
      // Try legacy column proposed_motto
      const byTextLegacy = await supabase
        .from('party_motto_proposals')
        .select('id')
        .eq('party_id', party.id)
        .eq('proposed_motto', text)
        .limit(1)
        .maybeSingle();
      if (!byTextLegacy.error && byTextLegacy.data) {
        // Re-fetch normalized by id to get active/final flags tolerantly
        const norm = await fetchProposalNormalized(byTextLegacy.data.id);
        if (!norm) return null;
        if (!norm.active || norm.is_finalized) return 'CLOSED';
        return norm.id as string;
      }
    } else {
      // Validate chosen using tolerant fetch to avoid column-drift issues
      const norm = await fetchProposalNormalized(chosen.id);
      if (!norm) return null;
      if (!norm.active || norm.is_finalized) return 'CLOSED';
      return norm.id as string;
    }

    return null;
  };

  if (proposalId) {
    // Resolve and validate via tolerant fetch
    const norm = await fetchProposalNormalized(proposalId);
    if (norm && norm.party_id === party.id) {
      if (!norm.active || norm.is_finalized) {
        return NextResponse.json({ error: 'Voting is closed for this proposal' }, { status: 400 });
      }
      resolvedProposalId = norm.id;
    } else {
      // Attempt resolution by text when id was not resolvable
      const textResolved = await resolveByText(proposalTextFromBody);
      if (textResolved === 'CLOSED') {
        return NextResponse.json({ error: 'Voting is closed for this proposal' }, { status: 400 });
      }
      if (!textResolved) {
        return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
      }
      resolvedProposalId = textResolved;
    }
  } else {
    // No id provided. If text is provided, allow vote-by-text during optimistic windows.
    if (proposalTextFromBody) {
      const textResolved = await resolveByText(proposalTextFromBody);
      if (textResolved === 'CLOSED') {
        return NextResponse.json({ error: 'Voting is closed for this proposal' }, { status: 400 });
      }
      if (!textResolved) {
        return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
      }
      resolvedProposalId = textResolved;
    }
    // else: keep as null to indicate explicit unvote
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

    // Pull active proposals with counts, tolerate legacy schema by falling back
    let proposals: any[] = [];
    const resNew = await supabase
      .from('party_motto_proposals')
      .select('id, text, vote_count, active, is_finalized')
      .eq('party_id', party.id)
      .eq('active', true);

    if (!resNew.error && Array.isArray(resNew.data)) {
      proposals = resNew.data;
    } else if (resNew.error && resNew.error.code === '42703') {
      // Legacy columns path
      const resLegacy = await supabase
        .from('party_motto_proposals')
        .select('id, proposed_motto, votes, party_id')
        .eq('party_id', party.id);
      if (!resLegacy.error && Array.isArray(resLegacy.data)) {
        proposals = resLegacy.data.map((p: any) => ({
          id: p.id,
          text: p.proposed_motto ?? null,
          vote_count: typeof p.votes === 'number' ? p.votes : 0,
          active: true,
          is_finalized: false,
          party_id: p.party_id,
        }));
      } else {
        return;
      }
    } else {
      return;
    }
    if (!proposals || proposals.length === 0) return;

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
  const { data: proposalIdRows } = await supabase
    .from('party_motto_proposals')
    .select('id')
    .eq('party_id', party.id);

  const candidateIds = (proposalIdRows ?? []).map(p => p.id);
  const { data: existingVotes, error: existErr } = await supabase
    .from('party_motto_votes')
    .select('id, proposal_id')
    .in('proposal_id', candidateIds.length > 0 ? candidateIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('voter_member_id', meMember.id);

  if (existErr) {
    return NextResponse.json({ error: 'Failed to fetch existing vote' }, { status: 500 });
  }
  // Compute target id once; ensure only one declaration
  const targetResolvedId = resolvedProposalId ?? proposalId;

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
    const targetId = targetResolvedId;
    if (!targetId) {
      return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
    }
    if (current.proposal_id !== targetId) {
      const { error: updErr } = await supabase
        .from('party_motto_votes')
        .update({ proposal_id: targetId })
        .eq('id', current.id);
      if (updErr) {
        return NextResponse.json({ error: 'Failed to switch vote' }, { status: 500 });
      }
    }
    await tryAutoFinalize();
    return NextResponse.json({ ok: true, proposalId: targetId });
  }

  // Otherwise insert a new vote
  {
    const targetId = targetResolvedId;
    if (!targetId) {
      return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
    }
    const { error: insErr } = await supabase
      .from('party_motto_votes')
      .insert({
        proposal_id: targetId,
        voter_member_id: meMember.id,
      });

    if (insErr) {
      console.error('vote-motto insert error:', insErr);
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
    }

    await tryAutoFinalize();
    return NextResponse.json({ ok: true, proposalId: targetId });
  }
}