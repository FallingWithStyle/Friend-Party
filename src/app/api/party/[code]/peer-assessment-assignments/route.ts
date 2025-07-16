import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { logDebug } from '@/lib/debug';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { code } = await params;
  logDebug('API: peer-assessment-assignments', { code });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logDebug('API: peer-assessment-assignments', 'Unauthorized access attempt.');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  logDebug('API: peer-assessment-assignments', { userId: user.id });

  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code)
    .single();

  if (partyError || !party) {
    logDebug('API: peer-assessment-assignments', 'Party not found or error.', { code, partyError });
    return new NextResponse(JSON.stringify({ error: 'Party not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  logDebug('API: peer-assessment-assignments', { partyId: party.id });

  const { data: member, error: memberError } = await supabase
    .from('party_members')
    .select('id')
    .eq('party_id', party.id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !member) {
    logDebug('API: peer-assessment-assignments', 'Member not found or error.', { userId: user.id, partyId: party.id, memberError });
    return new NextResponse(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
    });
  }
  logDebug('API: peer-assessment-assignments', { memberId: member.id });

  const { data: assignments, error: assignmentsError } = await supabase
    .from('peer_assessment_assignments')
    .select('question_id, subject_member_id')
    .eq('party_id', party.id)
    .eq('assessor_member_id', member.id);

  if (assignmentsError) {
    logDebug('API: peer-assessment-assignments', 'Error fetching assignments.', { error: assignmentsError });
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch assignments', details: assignmentsError.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!assignments || assignments.length === 0) {
    logDebug('API: peer-assessment-assignments', 'No assignments found for member', { memberId: member.id });
  } else {
    logDebug('API: peer-assessment-assignments', `Found ${assignments.length} assignments for member`, { memberId: member.id });
  }

  return NextResponse.json(assignments);
}