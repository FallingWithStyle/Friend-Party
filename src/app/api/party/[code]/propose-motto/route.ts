import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { computeMoraleScore, resolveMoraleLevel } from '@/lib/morale';
import type { PartyMemberRow } from '@/types/db';

// Explicitly use the Node.js runtime to allow request.json() and Next headers/cookies
export const runtime = 'nodejs';

// POST /api/party/[code]/propose-motto
// body: { text: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const supabase = await createClient();

    // Parse body safely
    const body = (await request.json().catch(() => ({}))) as { text?: string };
    const rawText = typeof body?.text === 'string' ? body.text : '';
    const text = rawText.trim();

    if (!text) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    // Dynamic route param
    const { code } = (await params) as { code: string };

    // Resolve authed user
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve party by code
    const { data: party, error: partyErr } = await supabase
      .from('parties')
      .select('id')
      .eq('code', code)
      .single();

    if (partyErr || !party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // Resolve member in this party
    const { data: meMember, error: meErr } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', party.id)
      .eq('user_id', userResp.user.id)
      .single();

    if (meErr || !meMember) {
      return NextResponse.json({ error: 'Not a member of this party' }, { status: 403 });
    }

    // Insert proposal using normalized columns only
    const { data: inserted, error: insErr } = await supabase
      .from('party_motto_proposals')
      .insert({
        party_id: party.id,
        proposed_by_member_id: meMember.id,
        text,
      })
      .select('id, party_id, proposed_by_member_id, text, vote_count, is_finalized, active, created_at')
      .single();

    if (insErr) {
      console.error('propose-motto insert error:', insErr);
      return NextResponse.json({ error: 'Failed to propose motto' }, { status: 500 });
    }

    const proposal = inserted;

    // Update Party Morale after proposal creation (participation-based) with hysteresis
    try {
      // 1) Members and completion rate
      const { data: pmRows } = await supabase
        .from('party_members')
        .select('id, is_npc, assessment_status')
        .eq('party_id', party.id);

      const nonNpc = (pmRows ?? []).filter((m: PartyMemberRow) => !m.is_npc);
      const finished = nonNpc.filter(
        (m: PartyMemberRow) => (m.assessment_status ?? '') === 'PeerAssessmentCompleted'
      );
      const completionRate = nonNpc.length ? finished.length / nonNpc.length : 0;

      // 2) Active proposals and proposal rate
      const { data: activeProps } = await supabase
        .from('party_motto_proposals')
        .select('id')
        .eq('party_id', party.id)
        .eq('active', true);

      const activeProposalIds = (activeProps ?? []).map((p: { id: string }) => p.id);
      const proposalRate = nonNpc.length ? Math.min(activeProposalIds.length / nonNpc.length, 1) : 0;

      // 3) Voting rate (distinct non-NPC voters on any active proposal)
      let votingRate = 0;
      if (activeProposalIds.length > 0) {
        const { data: votes } = await supabase
          .from('party_motto_votes')
          .select('voter_member_id')
          .in('proposal_id', activeProposalIds);

        const voters = new Set((votes ?? []).map((v: { voter_member_id: string }) => v.voter_member_id));
        const nonNpcIds = new Set(nonNpc.map((m: PartyMemberRow) => m.id));
        const eligibleVotersVoted = Array.from(voters).filter((id) => nonNpcIds.has(id as string)).length;
        votingRate = nonNpc.length ? eligibleVotersVoted / nonNpc.length : 0;
      }

      // Centralized scoring + hysteresis level resolution using defaults (no behavior change)
      const morale = computeMoraleScore({ completionRate, votingRate, proposalRate });

      let previousLevel: 'Low' | 'Neutral' | 'High' | null = null;
      try {
        const { data: prevParty } = await supabase
          .from('parties')
          .select('morale_level')
          .eq('id', party.id)
          .maybeSingle();
        previousLevel = (prevParty?.morale_level as unknown as 'Low' | 'Neutral' | 'High' | null) ?? null;
      } catch {}

      const nextLevel = resolveMoraleLevel(morale, previousLevel);

      await supabase
        .from('parties')
        .update({ morale_score: morale, morale_level: nextLevel })
        .eq('id', party.id);
    } catch (moraleErr) {
      console.warn('propose-motto: updateMorale skipped:', moraleErr);
    }

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (e) {
    console.error('propose-motto unhandled error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}