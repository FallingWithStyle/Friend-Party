import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Explicitly use the Node.js runtime to allow request.json() and Next headers/cookies
export const runtime = 'nodejs';

// POST /api/party/[code]/propose-motto
// body: { text: string }
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> } | { params: { code: string } }
) {
  try {
    const supabase = await createClient();

    // Parse body safely
    const body = await request.json().catch(() => ({} as any));
    const rawText = typeof body?.text === 'string' ? body.text : '';
    const text = rawText.trim();

    if (!text) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    // Await dynamic params for Next.js App Router compliance
    const p = (context as any).params;
    const { code } =
      typeof p?.then === 'function'
        ? await (p as Promise<{ code: string }>)
        : (p as { code: string });

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

      const nonNpc = (pmRows ?? []).filter((m: any) => !m.is_npc);
      const finished = nonNpc.filter(
        (m: any) => (m.assessment_status ?? '') === 'PeerAssessmentCompleted'
      );
      const completionRate = nonNpc.length ? finished.length / nonNpc.length : 0;

      // 2) Active proposals and proposal rate
      const { data: activeProps } = await supabase
        .from('party_motto_proposals')
        .select('id')
        .eq('party_id', party.id)
        .eq('active', true);

      const activeProposalIds = (activeProps ?? []).map((p: any) => p.id);
      const proposalRate = nonNpc.length ? Math.min(activeProposalIds.length / nonNpc.length, 1) : 0;

      // 3) Voting rate (distinct non-NPC voters on any active proposal)
      let votingRate = 0;
      if (activeProposalIds.length > 0) {
        const { data: votes } = await supabase
          .from('party_motto_votes')
          .select('voter_member_id')
          .in('proposal_id', activeProposalIds);

        const voters = new Set((votes ?? []).map((v: any) => v.voter_member_id));
        const nonNpcIds = new Set(nonNpc.map((m: any) => m.id));
        const eligibleVotersVoted = Array.from(voters).filter((id) => nonNpcIds.has(id as string)).length;
        votingRate = nonNpc.length ? eligibleVotersVoted / nonNpc.length : 0;
      }

      // Centralized scoring + hysteresis level resolution
      const { computeMoraleScore, resolveMoraleLevel, MORALE_HIGH_THRESHOLD, MORALE_LOW_THRESHOLD } = await import('@/lib/morale');
      const morale = computeMoraleScore({ completionRate, votingRate, proposalRate });

      let previousLevel: 'Low' | 'Neutral' | 'High' | null = null;
      try {
        const { data: prevParty } = await supabase
          .from('parties')
          .select('morale_level')
          .eq('id', party.id)
          .maybeSingle();
        previousLevel = (prevParty?.morale_level as any) ?? null;
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