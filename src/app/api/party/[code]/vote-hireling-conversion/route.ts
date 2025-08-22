import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Use Node fs only if available (non-edge). This route is in app router and typically runs on Node runtime by default.
let fsAppend: ((filePath: string, data: string) => Promise<void>) | null = null;
import('fs').then((fs) =>
  import('path').then((path) => {
    try {
      const logPath = path.join(process.cwd(), 'party_log.txt');
      fsAppend = async (_p: string, d: string) =>
        await fs.promises.appendFile(logPath, d, { encoding: 'utf8' });
    } catch {
      fsAppend = null;
    }
  })
).catch(() => {
  fsAppend = null;
});

async function appendPartyLog(_supabase: unknown, message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  if (fsAppend) {
    try {
      await fsAppend('party_log.txt', line);
      return;
    } catch (e) {
      // fall through to console
      console.warn('File log append failed, falling back to console:', e);
    }
  }
  console.log(`[PartyLog] ${line.trimEnd()}`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { code: partyCode } = (await params) as { code: string };

  // 1. Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Input
  const { target_party_member_id, vote } = await request.json();
  if (typeof target_party_member_id !== 'string' || typeof vote !== 'boolean') {
    return new Response('Invalid body: expected { target_party_member_id: string, vote: boolean }', {
      status: 400,
    });
  }

  // 3. Fetch party, voter, target
  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('id, party_members ( id, user_id, is_npc )')
    .eq('code', partyCode)
    .single();

  if (partyError || !party) {
    return new Response('Party not found', { status: 404 });
  }

  const voterMember = party.party_members.find((pm: { user_id: string }) => pm.user_id === user.id);
  if (!voterMember) {
    return new Response('Voter not found in this party', { status: 403 });
  }

  const targetMember = party.party_members.find((pm: { id: string }) => pm.id === target_party_member_id);
  if (!targetMember) {
    return new Response('Target not found in this party', { status: 400 });
  }
  if (targetMember.is_npc) {
    return new Response('Target is already a hireling', { status: 400 });
  }

  // 4. Validate
  if (voterMember.id === target_party_member_id) {
    return new Response('Cannot vote for yourself', { status: 400 });
  }
  if (voterMember.is_npc) {
    return new Response('NPCs cannot vote', { status: 403 });
  }

  // 5. Upsert vote
  const { error: voteError } = await supabase
    .from('hireling_conversion_votes')
    .upsert(
      {
        party_member_id_being_voted_on: target_party_member_id,
        voter_party_member_id: voterMember.id,
        vote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'party_member_id_being_voted_on, voter_party_member_id' }
    );

  if (voteError) {
    console.error('Error recording vote:', voteError);
    return new Response('Error recording vote', { status: 500 });
  }

  await appendPartyLog(
    supabase,
    `vote_cast party=${party.id} code=${partyCode} voter=${voterMember.id} target=${target_party_member_id} vote=${vote}`
  );

  // 6. Tally and unanimous check
  const eligibleVoters = party.party_members.filter(
    (pm: { is_npc: boolean; id: string }) => !pm.is_npc && pm.id !== target_party_member_id
  );
  const eligibleVoterCount = eligibleVoters.length;

  let yesCount = 0;
  if (vote) {
    const { data: yesVotes, error: countError } = await supabase
      .from('hireling_conversion_votes')
      .select('id')
      .eq('party_member_id_being_voted_on', target_party_member_id)
      .eq('vote', true);

    if (countError) {
      console.error('Error counting votes:', countError);
      return new Response('Error counting votes', { status: 500 });
    }
    yesCount = (yesVotes ?? []).length;

    if (yesCount === eligibleVoterCount) {
      // Convert to hireling
      const { error: updateError } = await supabase
        .from('party_members')
        .update({ is_npc: true, status: 'Finished' })
        .eq('id', target_party_member_id);

      if (updateError) {
        console.error('Error converting member to hireling:', updateError);
        return new Response('Error converting member to hireling', { status: 500 });
      }

      await appendPartyLog(
        supabase,
        `unanimous_conversion party=${party.id} code=${partyCode} target=${target_party_member_id}`
      );

      // Prefill missing self-assessment answers with neutral baseline
      // Note: answers.answer_value is TEXT; use '9' to match schema
      const { data: selfAssessmentQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('question_type', 'self-assessment');

      if (questionsError) {
        console.error('Error fetching self-assessment questions:', questionsError);
        return new Response('Error pre-filling answers', { status: 500 });
      }

      const { data: existingSelfAnswers, error: existingAnswersError } = await supabase
        .from('answers')
        .select('question_id')
        .eq('voter_member_id', target_party_member_id)
        .eq('subject_member_id', target_party_member_id);

      if (existingAnswersError) {
        console.error('Error fetching existing self-answers:', existingAnswersError);
        return new Response('Error pre-filling answers', { status: 500 });
      }

      const answered = new Set((existingSelfAnswers ?? []).map((a: { question_id: string }) => a.question_id));
      const toInsert: Array<{ question_id: string; voter_member_id: string; subject_member_id: string; answer_value: string } > = [];
      for (const q of selfAssessmentQuestions ?? []) {
        if (!answered.has(q.id)) {
          toInsert.push({
            question_id: q.id,
            voter_member_id: target_party_member_id,
            subject_member_id: target_party_member_id,
            answer_value: '9',
          });
        }
      }

      if (toInsert.length > 0) {
        const { error: insertAnswersError } = await supabase.from('answers').insert(toInsert);
        if (insertAnswersError) {
          console.error('Error inserting neutral answers:', insertAnswersError);
          return new Response('Error pre-filling answers', { status: 500 });
        }
        await appendPartyLog(
          supabase,
          `prefill_completed party=${party.id} code=${partyCode} target=${target_party_member_id} count=${toInsert.length}`
        );
      } else {
        await appendPartyLog(
          supabase,
          `prefill_skipped party=${party.id} code=${partyCode} target=${target_party_member_id} count=0`
        );
      }

      // Broadcast conversion
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

  // Broadcast vote update
  await supabase.channel(`party-${partyCode}`).send({
    type: 'broadcast',
    event: 'hireling_vote_updated',
    payload: {
      target_party_member_id,
      current_yes_votes: yesCount,
      eligible_voter_count: eligibleVoterCount,
    },
  });

  return NextResponse.json({
    message: 'Vote processed successfully.',
    tallies: { yes: yesCount, eligible: eligibleVoterCount },
  });
}