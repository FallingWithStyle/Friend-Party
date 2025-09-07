import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/party/[code]/mottos
// Returns proposals with vote_count, the current user's vote (proposal_id if any), and party.motto if finalized
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();

  // Dynamic route param
  const { code } = await params;

  // Resolve authed user first so RLS (party SELECT) evaluates with auth context
  const { data: userResp } = await supabase.auth.getUser();
  const userId = userResp?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve party by code
  const { data: party, error: partyErr } = await supabase
    .from('friendparty.parties')
    .select('id, motto, morale_score, morale_level')
    .eq('code', code)
    .single();

  if (partyErr || !party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // From here on, we have user context; require membership so RLS doesn't silently return empty

  // Resolve member id and enforce membership
  let meMemberId: string | null = null;
  {
    const { data: meMember, error: meErr } = await supabase
      .from('friendparty.party_members')
      .select('id')
      .eq('party_id', party.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (meErr || !meMember?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    meMemberId = meMember.id;
  }

  // List proposals in this party (active first) using ONLY normalized columns
  const { data: proposals, error: propErr } = await supabase
    .from('friendparty.party_motto_proposals')
    .select('id, party_id, proposed_by_member_id, text, vote_count, is_finalized, active, created_at')
    .eq('party_id', party.id)
    .order('active', { ascending: false })
    .order('created_at', { ascending: true });

  if (propErr) {
    console.error('mottos GET proposals error:', propErr);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }

  // Determine leader's party_member.id if any
  let leaderMemberId: string | null = null;
  const { data: leaderRow } = await supabase
    .from('friendparty.party_members')
    .select('id')
    .eq('party_id', party.id)
    .eq('is_leader', true)
    .maybeSingle();
  if (leaderRow?.id) leaderMemberId = leaderRow.id;

  // If there are no proposals, return early
  if (!proposals || proposals.length === 0) {
    return NextResponse.json({
      partyId: party.id,
      partyMotto: party.motto ?? null,
      proposals: [],
      myVoteProposalId: null,
      leaderProposalId: null,
      moraleScore: (party as unknown as { morale_score?: number }).morale_score ?? null,
      moraleLevel: (party as unknown as { morale_level?: string }).morale_level ?? null,
    }, { status: 200 });
  }

  // If we have a member id, fetch their vote (take first match)
  let myVoteProposalId: string | null = null;
  if (meMemberId) {
    const proposalIds = proposals.map(p => p.id);
    const { data: myVotes, error: voteErr } = await supabase
      .from('friendparty.party_motto_votes')
      .select('proposal_id')
      .in('proposal_id', proposalIds)
      .eq('voter_member_id', meMemberId)
      .limit(1);

    if (!voteErr && myVotes && myVotes.length > 0) {
      myVoteProposalId = myVotes[0].proposal_id;
    }
    // Ignore errors; treat as no vote to avoid failing UI
  }

  // Normalize proposals to a unified shape so downstream stays stable
  type ProposalRow = {
    id: string;
    party_id: string;
    proposed_by_member_id: string;
    text: string;
    vote_count: number | null;
    is_finalized: boolean | null;
    active: boolean | null;
    created_at: string;
  };
  const normalized = (proposals ?? []).map((p: ProposalRow) => ({
    id: p.id,
    party_id: p.party_id,
    proposed_by_member_id: p.proposed_by_member_id,
    text: p.text,
    vote_count: typeof p.vote_count === 'number' ? p.vote_count : 0,
    is_finalized: !!p.is_finalized,
    active: !!p.active,
    created_at: p.created_at
  }))
  .sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Identify the leader-proposed motto proposal id when available
  const leaderProposalId =
    leaderMemberId
      ? (normalized.find(p => p.proposed_by_member_id === leaderMemberId)?.id ?? null)
      : null;

  return NextResponse.json({
    partyId: party.id,
    partyMotto: party.motto ?? null,
    proposals: normalized,
    myVoteProposalId,
    leaderProposalId,
    moraleScore: (party as unknown as { morale_score?: number }).morale_score ?? null,
    moraleLevel: (party as unknown as { morale_level?: string }).morale_level ?? null,
  });
}