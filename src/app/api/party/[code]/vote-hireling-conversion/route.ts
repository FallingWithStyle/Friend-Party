import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const partyCode = params.code;

  // 1. Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Parse request body
  const { target_party_member_id, vote } = await request.json();
  if (target_party_member_id === undefined || vote === undefined) {
    return new Response('Missing target_party_member_id or vote', {
      status: 400,
    });
  }

  // 3. Get party and voter's party_member_id
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('id, party_members ( id, user_id, is_npc )')
    .eq('code', partyCode)
    .single();

  if (partyError || !party) {
    return new Response('Party not found', { status: 404 });
  }

  const voterMember = party.party_members.find(
    (pm) => pm.user_id === user.id
  );
  if (!voterMember) {
    return new Response('Voter not found in this party', { status: 403 });
  }

  // 4. Validate the vote
  if (voterMember.id === target_party_member_id) {
    return new Response('Cannot vote for yourself', { status: 400 });
  }
  if (voterMember.is_npc) {
    return new Response('NPCs cannot vote', { status: 403 });
  }

  // 5. Record the vote
  const { error: voteError } = await supabase
    .from('hireling_conversion_votes')
    .upsert(
      {
        party_member_id_being_voted_on: target_party_member_id,
        voter_party_member_id: voterMember.id,
        vote: vote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'party_member_id_being_voted_on, voter_party_member_id' }
    );

  if (voteError) {
    console.error('Error recording vote:', voteError);
    return new Response('Error recording vote', { status: 500 });
  }

  // 6. Check if the vote was to convert and if it's now unanimous
  const eligibleVoters = party.party_members.filter(
    (pm) => !pm.is_npc && pm.id !== target_party_member_id
  );
  const eligibleVoterCount = eligibleVoters.length;
  let yesVotes: any[] | null = [];

  if (vote) {
    const { data, error: countError } = await supabase
      .from('hireling_conversion_votes')
      .select('id', { count: 'exact' })
      .eq('party_member_id_being_voted_on', target_party_member_id)
      .eq('vote', true);
    
    yesVotes = data;

    if (countError) {
      console.error('Error counting votes:', countError);
      return new Response('Error counting votes', { status: 500 });
    }

    if (yesVotes && yesVotes.length === eligibleVoterCount) {
      // Unanimous vote! Trigger conversion.
      const { error: updateError } = await supabase
        .from('party_members')
        .update({ is_npc: true, status: 'Finished' }) // Assuming 'Finished' is the correct status
        .eq('id', target_party_member_id);

      if (updateError) {
        console.error('Error converting member to hireling:', updateError);
        return new Response('Error converting member to hireling', {
          status: 500,
        });
      }

      // Handle pre-filling of missing self-assessment answers.
      // Fetch all self-assessment questions
      const { data: selfAssessmentQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id, stat_id')
        .eq('question_type', 'self-assessment');

      if (questionsError) {
        console.error('Error fetching self-assessment questions:', questionsError);
        return new Response('Error pre-filling answers', { status: 500 });
      }

      // Fetch existing self-assessment answers for the target member
      const { data: existingSelfAnswers, error: existingAnswersError } = await supabase
        .from('answers')
        .select('question_id')
        .eq('voter_member_id', target_party_member_id)
        .eq('subject_member_id', target_party_member_id);

      if (existingAnswersError) {
        console.error('Error fetching existing self-answers:', existingAnswersError);
        return new Response('Error pre-filling answers', { status: 500 });
      }

      const answeredQuestionIds = new Set((existingSelfAnswers ?? []).map(a => a.question_id));
      const answersToInsert: any[] = [];
 
      // For each self-assessment question, if not answered, insert a neutral (9) answer
      // Per spec 'neutral baseline of 9s across the board'
      for (const question of selfAssessmentQuestions ?? []) {
        if (!answeredQuestionIds.has(question.id)) {
          answersToInsert.push({
            question_id: question.id,
            voter_member_id: target_party_member_id,
            subject_member_id: target_party_member_id,
            answer_value: 9, // Neutral baseline value
            party_id: party.id, // Ensure party_id is included
          });
        }
      }

      if (answersToInsert.length > 0) {
        const { error: insertAnswersError } = await supabase
          .from('answers')
          .insert(answersToInsert);

        if (insertAnswersError) {
          console.error('Error inserting neutral answers:', insertAnswersError);
          return new Response('Error pre-filling answers', { status: 500 });
        }
        console.log(`Pre-filled ${answersToInsert.length} neutral answers for hireling ${target_party_member_id}.`);
      } else {
        console.log(`No missing self-assessment answers to pre-fill for hireling ${target_party_member_id}.`);
      }

      // Broadcast conversion event via Supabase Realtime
      await supabase.channel(`party-${partyCode}`).send({
        type: 'broadcast',
        event: 'hireling_converted',
        payload: {
          party_member_id: target_party_member_id,
          is_npc: true,
          status: 'Finished',
        },
      });
    }
  }

  // Handle real-time updates to notify clients of vote count changes.
  // This would involve broadcasting an event on a Supabase channel for the party.
  await supabase.channel(`party-${partyCode}`).send({
    type: 'broadcast',
    event: 'hireling_vote_updated',
    payload: {
      target_party_member_id: target_party_member_id,
      current_yes_votes: yesVotes ? yesVotes.length : 0,
      eligible_voter_count: eligibleVoterCount,
    },
  });

  return NextResponse.json({
    message: 'Vote processed successfully.',
  });
}