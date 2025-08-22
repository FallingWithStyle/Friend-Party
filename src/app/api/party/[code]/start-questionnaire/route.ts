import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { member_id } = await request.json();
  const { code } = (await params) as { code: string };

  console.log('[start-questionnaire] Received member_id:', member_id, 'party code:', code);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!member_id) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing member_id' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // First, check if the distribution has been generated for this party
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('id, status')
    .eq('code', code)
    .single();

  console.log('[start-questionnaire] Party:', party, 'Error:', partyError);

  if (partyError || !party) {
    return new NextResponse(
      JSON.stringify({ error: 'Party not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- Hybrid Peer Assessment Assignment Generation ---
  // Always attempt to generate assignments for this member as assessor
  // Check if assignments already exist for this member as assessor
  const { data: existingAssignments, error: assignmentsError } = await supabase
    .from('peer_assessment_assignments')
    .select('id')
    .eq('party_id', party.id)
    .eq('assessor_member_id', member_id);

  if (assignmentsError) {
    console.error('Error checking existing assignments:', assignmentsError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to check assignments', details: assignmentsError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!existingAssignments || existingAssignments.length === 0) {
    // Get all party members (including NPCs)
    const { data: members, error: membersError } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', party.id);

    console.log('[start-questionnaire] Party members:', members, 'Error:', membersError);

    if (membersError) {
      console.error('Error fetching party members:', membersError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch party members', details: membersError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all peer-assessment questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('question_type', 'peer-assessment');

    console.log('[start-questionnaire] Peer-assessment questions:', questions, 'Error:', questionsError);

    if (questionsError) {
      console.error('Error fetching peer-assessment questions:', questionsError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch questions', details: questionsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare assignments for this member as assessor (exclude self)
    const assignments = [];
    for (const q of questions || []) {
      for (const m of members || []) {
        if (m.id !== member_id) {
          assignments.push({
            party_id: party.id,
            question_id: q.id,
            assessor_member_id: member_id,
            subject_member_id: m.id,
          });
        }
      }
    }

    console.log('[start-questionnaire] Assignments to insert:', assignments);

    if (assignments.length > 0) {
      const { error: insertError } = await supabase
        .from('peer_assessment_assignments')
        .upsert(assignments, { onConflict: 'party_id,question_id,assessor_member_id,subject_member_id' });
      if (insertError) {
        console.error('Error inserting peer assessment assignments:', insertError);
        return new NextResponse(
          JSON.stringify({ error: 'Failed to insert assignments', details: insertError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }
  // End assignment generation block

  const { error } = await supabase
    .from('party_members')
    .update({ status: 'Peer Assessment' })
    .eq('id', member_id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating member status:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to update status', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.json({ success: true });
}