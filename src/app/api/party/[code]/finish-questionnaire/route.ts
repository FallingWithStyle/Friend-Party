import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { member_id: memberId, assessment_type: assessmentType } = await request.json();
  const { code } = await params;

  try {
    const statusToUpdate = assessmentType === 'self-assessment' ? 'SelfAssessmentCompleted' : 'PeerAssessmentCompleted';

    const { error: updateError } = await supabase
      .from('party_members')
      .update({ assessment_status: statusToUpdate })
      .eq('id', memberId);

    if (updateError) {
      throw updateError;
    }

    // Check if all members are finished
    const { data: partyData, error: partyError } = await supabase
      .from('parties')
      .select('id')
      .eq('code', code)
      .single();

    if (partyError) {
      throw partyError;
    }

    // After updating member status, recalculate party status as the minimum of all member statuses
    // Fetch all member statuses
    const { data: allMembers, error: allMembersError } = await supabase
      .from('party_members')
      .select('status')
      .eq('party_id', partyData.id);

    if (allMembersError) {
      throw allMembersError;
    }

    // Define status order
    const statusOrder = ['Lobby', 'Self Assessment', 'Peer Assessment', 'Results'];
    // Find the minimum status among all members
    let minStatusIndex = statusOrder.length - 1;
    for (const m of allMembers) {
      const idx = statusOrder.indexOf(m.status);
      if (idx !== -1 && idx < minStatusIndex) {
        minStatusIndex = idx;
      }
    }
    const newPartyStatus = statusOrder[minStatusIndex];

    // Update party status if needed
    await supabase
      .from('parties')
      .update({ status: newPartyStatus })
      .eq('id', partyData.id);

    if (assessmentType === 'self-assessment') {
      const { count: unfinishedCount, error: countError } = await supabase
        .from('party_members')
        .select('*', { count: 'exact', head: true })
        .eq('party_id', partyData.id)
        .eq('is_npc', false)
        .neq('assessment_status', 'SelfAssessmentCompleted');

      if (countError) {
        throw countError;
      }

      if (unfinishedCount === 0) {
        await supabase
          .from('parties')
          .update({ status: 'Peer Assessment' })
          .eq('id', partyData.id);
      }
    } else if (assessmentType === 'peer-assessment') {
      const { count: unfinishedCount, error: countError } = await supabase
        .from('party_members')
        .select('*', { count: 'exact', head: true })
        .eq('party_id', partyData.id)
        .eq('is_npc', false)
        .neq('assessment_status', 'PeerAssessmentCompleted');

      if (countError) {
        throw countError;
      }

      // If all non-NPC members have completed peer assessment, mark Results and invoke calculation
      if (unfinishedCount === 0) {
        const { error: statusErr } = await supabase
          .from('parties')
          .update({ status: 'Results' })
          .eq('id', partyData.id);
        if (statusErr) {
          console.error('Failed to set party status to Results:', statusErr);
        }

        // Trigger calculation and also set ResultsReady when function completes
        supabase.functions.invoke('calculate-results', {
          body: { party_id: partyData.id },
        }).then(async ({ error: invokeError }) => {
          if (invokeError) {
            console.error('Error invoking calculate-results function:', invokeError);
            return;
          }
          try {
            const { error: readyErr } = await supabase
              .from('parties')
              .update({ status: 'ResultsReady' })
              .eq('id', partyData.id);
            if (readyErr) {
              console.warn('Non-fatal: failed to set ResultsReady after calc:', readyErr);
            }
          } catch (e) {
            console.warn('Non-fatal: ResultsReady update threw after calc:', e);
          }
        });
      }
    }

    // Recompute Party Morale after assessment status change
    try {
      // 1) Members and completion rate
      const { data: pmRows } = await supabase
        .from('party_members')
        .select('id, is_npc, assessment_status')
        .eq('party_id', partyData.id);

      const nonNpc = (pmRows ?? []).filter((m: any) => !m.is_npc);
      const finished = nonNpc.filter(
        (m: any) => (m.assessment_status ?? '') === 'PeerAssessmentCompleted'
      );
      const completionRate = nonNpc.length ? finished.length / nonNpc.length : 0;

      // 2) Active proposals and proposal rate
      const { data: activeProps } = await supabase
        .from('party_motto_proposals')
        .select('id')
        .eq('party_id', partyData.id)
        .eq('active', true);

      const activeProposalIds = (activeProps ?? []).map((p: any) => p.id);
      const proposalRate = nonNpc.length ? Math.min(activeProposalIds.length / nonNpc.length, 1) : 0;

      // 3) Voting rate (distinct non-NPC voters who voted on any active proposal)
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

      // 4) Morale score and level based on tunables (PRD FR21–FR24)
      const morale = (completionRate + votingRate + proposalRate) / 3;
      const MORALE_HIGH_THRESHOLD = 0.66;
      const MORALE_LOW_THRESHOLD = 0.33;

      let level: 'Low' | 'Neutral' | 'High' = 'Neutral';
      if (morale >= MORALE_HIGH_THRESHOLD) level = 'High';
      else if (morale < MORALE_LOW_THRESHOLD) level = 'Low';

      await supabase
        .from('parties')
        .update({ morale_score: morale, morale_level: level })
        .eq('id', partyData.id);
    } catch (e) {
      console.warn('finish-questionnaire: updateMorale skipped', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update status', details: message },
      { status: 500 }
    );
  }
}