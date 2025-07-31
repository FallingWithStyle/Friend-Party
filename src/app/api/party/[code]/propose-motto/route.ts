import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/party/[code]/propose-motto
// body: { text: string }
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const { text } = await request.json().catch(() => ({ text: '' }));

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
  }

  // Resolve authed user
  const { data: userResp, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userResp?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve party by code
  const { data: party, error: partyErr } = await supabase
    .from('parties')
    .select('id')
    .eq('code', params.code)
    .single();

  if (partyErr || !party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Resolve member in this party
  const { data: meMember, error: meErr } = await supabase
    .from('party_members')
    .select('id')
    .eq('party_id', party.id)
    .eq('user_id', userResp.user.id)
    .single();

  if (meErr || !meMember) {
    return NextResponse.json({ error: 'Not a member of this party' }, { status: 403 });
  }

  // Insert proposal
  const { data: proposal, error: insErr } = await supabase
    .from('party_motto_proposals')
    .insert({
      party_id: party.id,
      proposed_by_member_id: meMember.id,
      text: text.trim(),
    })
    .select('id, party_id, proposed_by_member_id, text, vote_count, is_finalized, active, created_at')
    .single();

  if (insErr) {
    return NextResponse.json({ error: 'Failed to propose motto' }, { status: 500 });
  }

  return NextResponse.json({ proposal }, { status: 201 });
}