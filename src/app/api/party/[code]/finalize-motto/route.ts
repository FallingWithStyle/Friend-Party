import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/party/[code]/finalize-motto
// body: { proposal_id: string }
// Requires leader privileges. Sets parties.motto, marks chosen proposal is_finalized=true,
// and deactivates all proposals in the party (active=false).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const body = (await request.json().catch(() => ({}))) as { proposal_id?: string };
  const proposalId = body?.proposal_id;

  // Dynamic route param
  const { code } = (await params) as { code: string };

  if (!proposalId) {
    return NextResponse.json({ error: 'proposal_id is required' }, { status: 400 });
  }

  // Resolve auth
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve party by code (need id, and optionally leader_id to check leader role if modeled that way)
  const { data: party, error: partyErr } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code)
    .single();

  if (partyErr || !party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Resolve user's party_member and leader flag if modeled
  const { data: meMember, error: meErr } = await supabase
    .from('party_members')
    .select('id, is_leader')
    .eq('party_id', party.id)
    .eq('user_id', userResp.user.id)
    .single();

  if (meErr || !meMember) {
    return NextResponse.json({ error: 'Not a member of this party' }, { status: 403 });
  }

  // Enforce leader-only based on is_leader flag
  const isLeader = Boolean((meMember as { is_leader?: boolean })?.is_leader);
  if (!isLeader) {
    return NextResponse.json({ error: 'Only the party leader can finalize the motto' }, { status: 403 });
  }

  // Validate proposal belongs to the party and is still active
  const { data: proposal, error: propErr } = await supabase
    .from('party_motto_proposals')
    .select('id, party_id, text, active, is_finalized')
    .eq('id', proposalId)
    .single();

  if (propErr || !proposal || proposal.party_id !== party.id) {
    return NextResponse.json({ error: 'Invalid proposal' }, { status: 400 });
  }
  if (!proposal.active) {
    return NextResponse.json({ error: 'Proposals are already closed' }, { status: 400 });
  }

  // Perform updates: set parties.motto, mark chosen is_finalized, set all proposals active=false
  // We rely on service role in server environment to bypass strict RLS update limitations on proposals.
  // 1) Set party motto
  const { error: partyUpdErr } = await supabase
    .from('parties')
    .update({ motto: proposal.text })
    .eq('id', party.id);

  if (partyUpdErr) {
    return NextResponse.json({ error: 'Failed to set party motto' }, { status: 500 });
  }

  // 2) Mark chosen proposal finalized
  const { error: markFinalErr } = await supabase
    .from('party_motto_proposals')
    .update({ is_finalized: true })
    .eq('id', proposal.id);

  if (markFinalErr) {
    return NextResponse.json({ error: 'Failed to finalize proposal' }, { status: 500 });
  }

  // 3) Deactivate all proposals in this party (closes voting)
  const { error: deactivateErr } = await supabase
    .from('party_motto_proposals')
    .update({ active: false })
    .eq('party_id', party.id);

  if (deactivateErr) {
    return NextResponse.json({ error: 'Failed to close proposals' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, motto: proposal.text, proposalId: proposal.id });
}