import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/party/[code]/mottos
// Returns proposals with vote_count, the current user's vote (proposal_id if any), and party.motto if finalized
export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();

  // Resolve party by code
  const { data: party, error: partyErr } = await supabase
    .from('parties')
    .select('id, motto')
    .eq('code', params.code)
    .single();

  if (partyErr || !party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Resolve authed user (optional)
  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp?.user?.id ?? null;

  // Resolve member id only if user present
  let meMemberId: string | null = null;
  if (userId) {
    const { data: meMember, error: meErr } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', party.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!meErr && meMember?.id) {
      meMemberId = meMember.id;
    }
    // Do not hard-fail on meErr; continue with public proposals/motto
  }

  // List proposals in this party
  const { data: proposals, error: propErr } = await supabase
    .from('party_motto_proposals')
    .select('id, party_id, proposed_by_member_id, text, vote_count, is_finalized, active, created_at')
    .eq('party_id', party.id)
    .order('created_at', { ascending: true });

  if (propErr) {
    // Return safe payload rather than 500 to avoid breaking UI; log server-side
    return NextResponse.json({
      partyId: party.id,
      partyMotto: party.motto ?? null,
      proposals: [],
      myVoteProposalId: null,
      warning: 'Failed to fetch proposals'
    }, { status: 200 });
  }

  // If there are no proposals, return early
  if (!proposals || proposals.length === 0) {
    return NextResponse.json({
      partyId: party.id,
      partyMotto: party.motto ?? null,
      proposals: [],
      myVoteProposalId: null,
    });
  }

  // If we have a member id, fetch their vote (take first match)
  let myVoteProposalId: string | null = null;
  if (meMemberId) {
    const proposalIds = proposals.map(p => p.id);
    const { data: myVotes, error: voteErr } = await supabase
      .from('party_motto_votes')
      .select('proposal_id')
      .in('proposal_id', proposalIds)
      .eq('voter_member_id', meMemberId)
      .limit(1);

    if (!voteErr && myVotes && myVotes.length > 0) {
      myVoteProposalId = myVotes[0].proposal_id;
    }
    // Ignore errors; treat as no vote to avoid failing UI
  }

  return NextResponse.json({
    partyId: party.id,
    partyMotto: party.motto ?? null,
    proposals: proposals ?? [],
    myVoteProposalId,
  });
}