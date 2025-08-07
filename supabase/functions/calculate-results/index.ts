/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* NOTE:
   The following declarations and references are here to silence VS Code/TS
   diagnostics when editing Supabase Edge (Deno) functions from a Node workspace.
   These do not affect runtime in the Deno environment used by Supabase.
*/
// @ts-ignore -- Deno is provided at runtime by Supabase
declare const Deno: any;
// @ts-ignore -- URL import typings not available in Node TS server
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

// Define types based on the database schema for clarity
interface PartyMember {
  id: string;
  user_id: string;
  party_id: string;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  character_class?: string;
  class?: string;
  exp?: number; // Add exp property
  first_name?: string; // Add first_name property
  status?: 'Joined' | 'Voting' | 'Finished'; // Add status property
  is_npc?: boolean; // Add is_npc property
}

interface Answer {
  id: string;
  question_id: string;
  voter_member_id: string;
  subject_member_id: string;
  answer_value: string; // This is the stat_id for self-assessment, or '1' for peer-assessment
}

interface Question {
  id: string;
  stat_id: string;
  question_type: 'self-assessment' | 'peer-assessment';
}

interface StatScores {
  [stat: string]: number;
}

const CLASSES: { [key: string]: { primary: string, secondary: string } } = {
  Fighter: { primary: 'STR', secondary: 'CON' },
  Ranger: { primary: 'DEX', secondary: 'WIS' },
  Rogue: { primary: 'DEX', secondary: 'CHA' },
  Monk: { primary: 'DEX', secondary: 'WIS' },
  Wizard: { primary: 'INT', secondary: 'CON' },
  Cleric: { primary: 'WIS', secondary: 'CHA' },
  Druid: { primary: 'WIS', secondary: 'CON' },
  Bard: { primary: 'CHA', secondary: 'DEX' },
  Paladin: { primary: 'CHA', secondary: 'STR' },
  Warlock: { primary: 'CHA', secondary: 'CON' },
};

/**
 * Tunable constants for algorithm calibration.
 * - PEER_SCALE: scales normalized peer-average into stat points.
 * - PEER_CLAMP: clamps peer adjustment per stat to avoid extreme swings.
 * - DEFAULT_BASELINE: fallback baseline for non-NPCs without self-assessment.
 * - NPC_BASELINE: neutral baseline for NPCs.
 */
const PEER_SCALE = 5;          // default was 5
const PEER_CLAMP = 5;          // default was ±5
const DEFAULT_BASELINE: StatScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
const NPC_BASELINE: StatScores = { STR: 9, DEX: 9, CON: 9, INT: 9, WIS: 9, CHA: 9 };

Deno.serve(async (req) => {
  console.log('CALCULATE-RESULTS FUNCTION INITIATED');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { party_id } = await req.json();
    if (!party_id) {
      return new Response(JSON.stringify({ error: 'party_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // 1. Fetch all necessary data
    const { data: party_members, error: membersError } = await supabase
      .from('party_members')
      .select('id, user_id, party_id, first_name, status, is_npc, strength, dexterity, constitution, intelligence, wisdom, charisma')
      .eq('party_id', party_id);
    if (membersError) throw membersError;
    console.log('Fetched party members:', party_members);

    const memberIds = party_members.map((m) => m.id);

    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('voter_member_id', memberIds);
    if (answersError) throw answersError;
    console.log('Fetched answers:', answers);

    // Build quick lookup map (single declaration)
    const membersById = new Map<string, PartyMember>(party_members.map((m) => [m.id, m as PartyMember]));

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, stat_id, question_type');
    if (questionsError) throw questionsError;
    console.log('Fetched questions:', questions);

    const questionsMap = new Map<string, Question>(questions.map(q => [q.id, q]));
    const peerQuestionsByStat: { [stat: string]: number } = {};
    for (const q of questions) {
      if (q.question_type === 'peer-assessment' && q.stat_id) {
        peerQuestionsByStat[q.stat_id] = (peerQuestionsByStat[q.stat_id] || 0) + 1;
      }
    }

    const finalResults: Partial<PartyMember>[] = [];

    // Include NPC subjects so they can be rated; exclude only NPC voters; no self-votes
    const peerAssessmentAnswersFromAll = answers.filter(a => {
      const question = questionsMap.get(a.question_id);
      if (!(question && question.question_type === 'peer-assessment')) return false;
      const voter = membersById.get(a.voter_member_id);
      const subject = membersById.get(a.subject_member_id);
      return voter && subject && !voter.is_npc && a.voter_member_id !== a.subject_member_id;
    });

    // Build per-subject rater sets (non-NPC voters only; subjects may be NPC)
    const ratersBySubject = new Map<string, Set<string>>();
    for (const ans of peerAssessmentAnswersFromAll) {
      const set = ratersBySubject.get(ans.subject_member_id) ?? new Set<string>();
      set.add(ans.voter_member_id);
      ratersBySubject.set(ans.subject_member_id, set);
    }

    // 2. Calculate stats for each member
    for (const member of party_members) {
      const currentMemberData = party_members.find(m => m.id === member.id);
      if (!currentMemberData) continue;

      const selfAssessmentAnswers = answers.filter(a => a.voter_member_id === member.id && a.subject_member_id === member.id);
      const selfStatCounts: StatScores = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };

      for (const answer of selfAssessmentAnswers) {
        const question = questionsMap.get(answer.question_id);
        if (question && question.question_type === 'self-assessment') {
          // The answer_value for self-assessment is the stat abbreviation (e.g., 'STR', 'DEX')
          selfStatCounts[answer.answer_value] = (selfStatCounts[answer.answer_value] || 0) + 1;
        }
      }
      console.log(`Member ${member.first_name} (${member.id}) self-assessment counts:`, selfStatCounts);

      let baselineStats: StatScores;
      const hasSelfAssessment = Object.values(selfStatCounts).some(count => count > 0);

      const safeInsertDebug = async (payload: Record<string, unknown>) => {
        try {
          await supabase.from('debug_stat_changes').insert(payload);
        } catch (e) {
          console.warn('debug_stat_changes insert skipped:', e?.message ?? e);
        }
      };

      if (member.is_npc) {
        baselineStats = { ...NPC_BASELINE };
        console.log(`Member ${member.first_name} is an NPC. Assigning neutral baseline stats:`, baselineStats);
        await safeInsertDebug({
          party_member_id: member.id,
          member_name: member.first_name,
          change_source: 'baseline-npc',
          stats: baselineStats,
        });
      } else if (hasSelfAssessment) {
        const ordered = Object.entries(selfStatCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([stat]) => stat);
        // Ensure we always have all 6 stats in some deterministic order
        const ALL = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        const rankedStats = Array.from(new Set([...ordered, ...ALL])).slice(0, 6);

        baselineStats = {
          [rankedStats[0]]: 13,
          [rankedStats[1]]: 12,
          [rankedStats[2]]: 11,
          [rankedStats[3]]: 10,
          [rankedStats[4]]: 8,
          [rankedStats[5]]: 6,
        } as StatScores;
        console.log(`Member ${member.first_name} baseline stats from self-assessment:`, baselineStats);
        await safeInsertDebug({
          party_member_id: member.id,
          member_name: member.first_name,
          change_source: 'baseline-self-assessment',
          stats: baselineStats,
        });
      } else {
        baselineStats = { ...DEFAULT_BASELINE };
        console.log(`Member ${member.first_name} has no self-assessment. Assigning default baseline stats:`, baselineStats);
        await safeInsertDebug({
          party_member_id: member.id,
          member_name: member.first_name,
          change_source: 'baseline-no-self-assessment',
          stats: baselineStats,
        });
      }

      // Phase 2: Adjust Stats with Peer Points (non-NPC voters only; per-subject denominator)
      const peerAnswers = peerAssessmentAnswersFromAll.filter(a => a.subject_member_id === member.id);
      const peerPoints: StatScores = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };
      for (const answer of peerAnswers) {
        const question = questionsMap.get(answer.question_id);
        if (question && question.question_type === 'peer-assessment' && question.stat_id) {
          const raw = (answer.answer_value ?? '').toString().trim();
          const value = raw === '' ? NaN : parseInt(raw, 10);
          if (!isNaN(value)) {
            peerPoints[question.stat_id] += value;
          }
        }
      }

      // Determine denominator per subject (unique non-NPC raters for this subject)
      const ratersForSubject = ratersBySubject.get(member.id) ?? new Set<string>();
      const numRatersForSubject = Math.max(ratersForSubject.size, 1); // avoid division by zero

      const finalStats: StatScores = {};
      for (const stat of ['STR','DEX','CON','INT','WIS','CHA']) {
        const base = baselineStats[stat] ?? 0;
        const totalPeerPoints = peerPoints[stat] || 0;

        // Sparse-data guards
        const numQuestionsForStatRaw = peerQuestionsByStat[stat] ?? 0;
        const numQuestionsForStat = Math.max(numQuestionsForStatRaw, 1); // avoid divide-by-zero
        const denom = Math.max(numRatersForSubject * numQuestionsForStat, 1);

        // Normalized average in [0..1+] depending on tally; scaled then clamped
        let statAdjustment = Math.round((totalPeerPoints / denom) * PEER_SCALE);
        if (statAdjustment > PEER_CLAMP) statAdjustment = PEER_CLAMP;
        if (statAdjustment < -PEER_CLAMP) statAdjustment = -PEER_CLAMP;

        finalStats[stat] = base + statAdjustment;
      }

      await (async () => {
        try {
          await supabase.from('debug_stat_changes').insert({
            party_member_id: member.id,
            member_name: member.first_name,
            change_source: 'final-stats-with-peer-assessment',
            stats: finalStats,
            meta: {
              raters: (ratersForSubject.size || 0),
              peer_points: peerPoints,
              scale: PEER_SCALE,
              clamp: PEER_CLAMP,
            },
          });
        } catch (e) {
          console.warn('debug_stat_changes insert skipped:', e?.message ?? e);
        }
      })();

      // 3. Assign Class
      let highestScore = -1;
      let highestStats: string[] = [];
      for (const stat in finalStats) {
        if (finalStats[stat] > highestScore) {
          highestScore = finalStats[stat];
          highestStats = [stat];
        } else if (finalStats[stat] === highestScore) {
          highestStats.push(stat);
        }
      }

      let assignedClass = 'Fighter'; // Default
      if (highestStats.length === 1) {
        const primaryStat = highestStats[0];
        assignedClass = Object.keys(CLASSES).find(c => CLASSES[c].primary === primaryStat) || 'Fighter';
      } else {
        for (const className in CLASSES) {
          const classInfo = CLASSES[className];
          if (highestStats.includes(classInfo.primary) && highestStats.includes(classInfo.secondary)) {
            assignedClass = className;
            break;
          }
        }
      }

      finalResults.push({
        id: member.id,
        first_name: member.first_name,
        strength: finalStats['STR'],
        dexterity: finalStats['DEX'],
        constitution: finalStats['CON'],
        intelligence: finalStats['INT'],
        wisdom: finalStats['WIS'],
        charisma: finalStats['CHA'],
        character_class: assignedClass,
        class: assignedClass,
      });

      // EXP: count peer answers authored by this member (non-NPC voters only already enforced above)
      const expEarned = peerAssessmentAnswersFromAll.filter(a => a.voter_member_id === member.id).length * 100;
      finalResults[finalResults.length - 1].exp = expEarned;
    }

    // 4. Update database
    const { data: partyStatus, error: statusError } = await supabase
      .from('parties')
      .select('status')
      .eq('id', party_id)
      .single();
    if (statusError) throw statusError;

    if (partyStatus.status === 'ResultsReady') {
      return new Response(JSON.stringify({ message: 'Results already calculated.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Updating party members with final results:', JSON.stringify(finalResults, null, 2));
    const { error: updateError } = await supabase.from('party_members').upsert(finalResults);
    if (updateError) {
      console.error('Error upserting final results:', updateError);
      throw updateError;
    }
    console.log('Successfully upserted final results.');

    const { error: partyUpdateError } = await supabase
      .from('parties')
      .update({ status: 'ResultsReady' })
      .eq('id', party_id);
    if (partyUpdateError) {
      console.error('Error updating party status to ResultsReady:', partyUpdateError);
      throw partyUpdateError;
    }
    console.log('Successfully updated party status to ResultsReady.');

    return new Response(JSON.stringify({ message: 'Results calculated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in calculate-results function:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while calculating results.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});