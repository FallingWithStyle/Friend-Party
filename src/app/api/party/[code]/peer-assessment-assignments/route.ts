import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { logDebug } from '@/lib/debug';

/**
 * Self-healing GET endpoint:
 * If this assessor has zero assignments, generate them on-demand,
 * then return the fresh set. This removes timing coupling with the
 * separate "start-questionnaire" POST route.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { code } = await params;
  logDebug('[Assignments][GET] start', { code });

  // 1) Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logDebug('[Assignments][GET] unauthorized');
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2) Party by code
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code)
    .single();

  if (partyError || !party) {
    logDebug('[Assignments][GET] party-not-found', { code, partyError });
    return new NextResponse(JSON.stringify({ error: 'Party not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  logDebug('[Assignments][GET] party', { partyId: party.id });

  // 3) Assessor member (current user) in this party
  const { data: member, error: memberError } = await supabase
    .from('party_members')
    .select('id')
    .eq('party_id', party.id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !member) {
    logDebug('[Assignments][GET] member-not-found', { userId: user.id, partyId: party.id, memberError });
    return new NextResponse(JSON.stringify({ error: 'Member not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  logDebug('[Assignments][GET] assessor', { memberId: member.id });

  // 4) Fetch existing assignments for this assessor
  const { data: existing, error: existingErr } = await supabase
    .from('peer_assessment_assignments')
    .select('question_id, subject_member_id')
    .eq('party_id', party.id)
    .eq('assessor_member_id', member.id);

  if (existingErr) {
    logDebug('[Assignments][GET] fetch-assignments-error', { error: existingErr });
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch assignments', details: existingErr.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (existing && existing.length > 0) {
    logDebug('[Assignments][GET] found-existing', { count: existing.length });
    return NextResponse.json(existing);
  }

  // 5) Self-heal: generate assignments for this assessor
  logDebug('[Assignments][GET] self-heal-generate', { assessor_member_id: member.id });

  // 5a) Get all party members (including NPCs). Assessor will not assess self.
  const { data: members, error: membersError } = await supabase
    .from('party_members')
    .select('id')
    .eq('party_id', party.id);

  if (membersError) {
    logDebug('[Assignments][GET] members-error', { error: membersError });
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch party members', details: membersError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5b) Get all peer-assessment questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id')
    .eq('question_type', 'peer-assessment');

  if (questionsError) {
    logDebug('[Assignments][GET] questions-error', { error: questionsError });
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch questions', details: questionsError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 5c) Build the Cartesian list for this assessor, excluding self
  const toInsert: Array<{
    party_id: string;
    question_id: string;
    assessor_member_id: string;
    subject_member_id: string;
  }> = [];

  for (const q of questions || []) {
    for (const m of members || []) {
      if (m.id !== member.id) {
        toInsert.push({
          party_id: party.id,
          question_id: q.id,
          assessor_member_id: member.id,
          subject_member_id: m.id,
        });
      }
    }
  }

  logDebug('[Assignments][GET] prepared-insert', { count: toInsert.length });

  if (toInsert.length > 0) {
    // Upsert with composite conflict key if defined server-side
    const { error: insertError } = await supabase
      .from('peer_assessment_assignments')
      .upsert(toInsert, {
        onConflict: 'party_id,question_id,assessor_member_id,subject_member_id',
      });

    if (insertError) {
      logDebug('[Assignments][GET] upsert-error', { error: insertError });
      return new NextResponse(
        JSON.stringify({ error: 'Failed to insert assignments', details: insertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 6) Re-fetch and return
  const { data: generated, error: genErr } = await supabase
    .from('peer_assessment_assignments')
    .select('question_id, subject_member_id')
    .eq('party_id', party.id)
    .eq('assessor_member_id', member.id);

  if (genErr) {
    logDebug('[Assignments][GET] refetch-error', { error: genErr });
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch generated assignments', details: genErr.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  logDebug('[Assignments][GET] returning', { count: generated?.length ?? 0 });
  return NextResponse.json(generated ?? []);
}