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

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update status', details: message },
      { status: 500 }
    );
  }
}