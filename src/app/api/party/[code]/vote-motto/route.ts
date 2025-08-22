import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeMoraleScore, resolveMoraleLevel, MORALE_HIGH_THRESHOLD, MORALE_LOW_THRESHOLD } from '@/lib/morale';
import type { PartyMemberRow, MottoProposalRow, MottoVoteRow } from '@/types/db';

// POST /api/party/[code]/vote-motto
// body: { proposal_id: string | null, proposal_text?: string }
// - proposal_id null -> unvote
// - proposal_text supported only for normalized column "text"
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const body = (await request.json().catch(() => ({}))) as { proposal_id?: string | null; proposal_text?: string };
  const proposalId = body?.proposal_id ?? null;
  const proposalTextFromBody: string | null =
    typeof body?.proposal_text === 'string' && body.proposal_text.trim().length > 0
      ? body.proposal_text.trim()
      : null;

  // Dynamic route param
  const { code } = (await params) as { code: string };

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

  // Use normalized columns only
  let resolvedProposalId: string | null = null;

  const fetchProposalNormalized = async (id: string) => {
    const res = await supabase
      .from('party_motto_proposals')
      .select('id, party_id, text, active, is_finalized')
      .eq('id', id)
      .maybeSingle();

    if (res.error || !res.data) return null;
    const p = res.data as MottoProposalRow;
    return {
      id: p.id,
      party_id: p.party_id,
      text: String(p.text ?? ''),
      active: !!p.active,
      is_finalized: !!p.is_finalized,
    };
  };

  const resolveByText = async (text: string | null) => {
    if (!text) return null;
    const byText = await supabase
      .from('party_motto_proposals')
      .select('id, active, is_finalized')
      .eq('party_id', party.id)
      .eq('text', text)
      .limit(1)
      .maybeSingle();

    if (byText.error || !byText.data) return null;
    if (!byText.data.active || byText.data.is_finalized) return 'CLOSED';
    return byText.data.id as string;
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
    return members.filter((m: PartyMemberRow) => !m.is_npc).length;
  };

  // Helper to try auto-finalize when any proposal gains strict majority
  const tryAutoFinalize = async () => {
    // If already has motto, skip
    if (party.motto) return;

    // Pull active proposals with counts, tolerate legacy schema by falling back
    type MottoProposal = { id: string; text: string; vote_count?: number | null; active?: boolean | null; is_finalized?: boolean | null };
    let proposals: MottoProposal[] = [];
    const resNew = await supabase
      .from('party_motto_proposals')
      .select('id, text, vote_count, active, is_finalized, created_at')
      .eq('party_id', party.id)
      .eq('active', true);

    if (!resNew.error && Array.isArray(resNew.data)) {
      proposals = resNew.data;
    } else {
      return;
    }
    if (!proposals || proposals.length === 0) return;

    // Compute threshold: > half of eligible voters
    const eligible = await getEligibleVoterCount();
    if (eligible <= 0) return;
    const threshold = Math.floor(eligible / 2) + 1;

    // Find any proposal meeting majority
    const winner = proposals.find((p: MottoProposal) => (p.vote_count ?? 0) >= threshold);
    if (winner) {
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

      return;
    }

    // No strict majority winner; apply Party Morale tie-break with Leader vote (FR21–FR24)
    const maxCount = Math.max(0, ...proposals.map((p) => p.vote_count ?? 0));
    const tied = proposals.filter((p) => (p.vote_count ?? 0) === maxCount && maxCount > 0);

    if (tied.length >= 2) {
      // Determine leader member id
      const { data: leaderRow } = await supabase
        .from('party_members')
        .select('id')
        .eq('party_id', party.id)
        .eq('is_leader', true)
        .maybeSingle();
      const leaderMemberId: string | null = leaderRow?.id ?? null;
      if (!leaderMemberId) return;

      // Leader's vote among tied proposals (if any)
      const tiedIds = tied.map((p) => p.id);
      const { data: leaderVotes } = await supabase
        .from('party_motto_votes')
        .select('proposal_id')
        .in('proposal_id', tiedIds)
        .eq('voter_member_id', leaderMemberId)
        .limit(1);
      const leaderChoiceId: string | null =
        leaderVotes && leaderVotes.length > 0 ? (leaderVotes[0].proposal_id as string) : null;
      if (!leaderChoiceId) return;

      // Tunables are imported at top (centralized)

      // Compute Party Morale score [0..1] based on participation signals (centralized)
      const { data: pmRows } = await supabase
        .from('party_members')
        .select('id, is_npc, assessment_status')
        .eq('party_id', party.id);
      const nonNpc = (pmRows ?? []).filter((m: PartyMemberRow) => !m.is_npc);
      const finished = nonNpc.filter((m: PartyMemberRow) => (m.assessment_status ?? '') === 'PeerAssessmentCompleted');
      const completionRate = nonNpc.length ? finished.length / nonNpc.length : 0;

      const { data: allVotes } = await supabase
        .from('party_motto_votes')
        .select('voter_member_id, proposal_id');

      let votingRate = 0;
      if (allVotes && allVotes.length > 0) {
        const proposalIds = proposals.map((p) => p.id);
        const voters = new Set(
          allVotes
            .filter((v: MottoVoteRow) => proposalIds.includes(v.proposal_id))
            .map((v: MottoVoteRow) => v.voter_member_id)
        );
        const nonNpcIds = new Set(nonNpc.map((m: PartyMemberRow) => m.id));
        const eligibleVotersVoted = Array.from(voters).filter((id) => nonNpcIds.has(id)).length;
        votingRate = nonNpc.length ? eligibleVotersVoted / nonNpc.length : 0;
      }

      const proposalRate = nonNpc.length ? Math.min(proposals.length / nonNpc.length, 1) : 0;

      // Use centralized defaults for thresholds (feature behavior unchanged)
      const hi = MORALE_HIGH_THRESHOLD;
      const lo = MORALE_LOW_THRESHOLD;
      const morale = computeMoraleScore({ completionRate, votingRate, proposalRate });

      // Choose winner based on morale and leader's vote
      let chosen: { id: string; text: string; is_finalized?: boolean | null } | null = null;
      if (morale >= hi) {
        // High morale: leader's vote counts positively
        chosen = tied.find((p) => p.id === leaderChoiceId) ?? null;
      } else if (morale < lo) {
        // Low morale: leader's vote counts negatively -> pick an opposing tied option
        chosen = tied.find((p) => p.id !== leaderChoiceId) ?? null;
      }
      // For neutral morale band, do not break tie (no-op)

      if (chosen && !chosen.is_finalized) {
        // Finalize chosen per tie-break
        const { error: partyUpdErr } = await supabase
          .from('parties')
          .update({ motto: chosen.text })
          .eq('id', party.id);
        if (partyUpdErr) return;

        const { error: markFinalErr } = await supabase
          .from('party_motto_proposals')
          .update({ is_finalized: true })
          .eq('id', chosen.id);
        if (markFinalErr) return;

        const { error: deactivateErr } = await supabase
          .from('party_motto_proposals')
          .update({ active: false })
          .eq('party_id', party.id);
        if (deactivateErr) return;
      }
    }
  };

  // Persist Party Morale after voting/proposals/assessment changes
  const updateMorale = async () => {
    try {
      // Members and completion
      const { data: pmRows } = await supabase
        .from('party_members')
        .select('id, is_npc, assessment_status')
        .eq('party_id', party.id);

      const nonNpc = (pmRows ?? []).filter((m: PartyMemberRow) => !m.is_npc);
      const finished = nonNpc.filter((m: PartyMemberRow) => (m.assessment_status ?? '') === 'PeerAssessmentCompleted');
      const completionRate = nonNpc.length ? finished.length / nonNpc.length : 0;

      // Active proposals
      const { data: activeProps } = await supabase
        .from('party_motto_proposals')
        .select('id, active')
        .eq('party_id', party.id)
        .eq('active', true);

      const activeProposalIds = (activeProps ?? []).map((p: { id: string }) => p.id);
      const proposalRate = nonNpc.length ? Math.min(activeProposalIds.length / nonNpc.length, 1) : 0;

      // Voting rate (distinct non-NPC voters who voted on any active proposal)
      let votingRate = 0;
      if (activeProposalIds.length > 0) {
        const { data: votes } = await supabase
          .from('party_motto_votes')
          .select('voter_member_id')
          .in('proposal_id', activeProposalIds);

        const voters = new Set((votes ?? []).map((v: { voter_member_id: string }) => v.voter_member_id));
        const nonNpcIds = new Set(nonNpc.map((m: PartyMemberRow) => m.id));
        const eligibleVotersVoted = Array.from(voters).filter((id) => nonNpcIds.has(id)).length;
        votingRate = nonNpc.length ? eligibleVotersVoted / nonNpc.length : 0;
      }

      // Use centralized scorer (same as earlier)
      const morale = (completionRate + votingRate + proposalRate) / 3;

      // Resolve previous morale level and apply hysteresis using centralized helper
      let previousLevel: 'Low' | 'Neutral' | 'High' | null = null;
      try {
        const { data: prevParty } = await supabase
          .from('parties')
          .select('morale_level')
          .eq('id', party.id)
          .maybeSingle();
        previousLevel = (prevParty?.morale_level as 'Low' | 'Neutral' | 'High' | null) ?? null;
      } catch {}

      // Determine effective level with hysteresis and persist
      // Resolve with hysteresis using centralized constants (no behavior change)
      const nextLevel = resolveMoraleLevel(morale, previousLevel);

      await supabase
        .from('parties')
        .update({ morale_score: morale, morale_level: nextLevel })
        .eq('id', party.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('updateMorale skipped:', msg);
    }
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
    await updateMorale();
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
    await updateMorale();
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
    await updateMorale();
    return NextResponse.json({ ok: true, proposalId: targetId });
  }
}