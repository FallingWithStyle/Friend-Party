import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Explicitly use the Node.js runtime to allow request.json() and Next headers/cookies
export const runtime = 'nodejs';

// POST /api/party/[code]/propose-motto
// body: { text: string }
export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> } | { params: { code: string } }
) {
  try {
    const supabase = await createClient();

    // Parse body safely
    const body = await request.json().catch(() => ({} as any));
    const rawText = typeof body?.text === 'string' ? body.text : '';
    const text = rawText.trim();

    if (!text) {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    // Await dynamic params for Next.js App Router compliance
    const p = (context as any).params;
    const { code } =
      typeof p?.then === 'function'
        ? await (p as Promise<{ code: string }>)
        : (p as { code: string });

    // Resolve authed user
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve party by code
    const { data: party, error: partyErr } = await supabase
      .from('parties')
      .select('id')
      .eq('code', code)
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

    // Insert proposal using normalized columns only
    const { data: inserted, error: insErr } = await supabase
      .from('party_motto_proposals')
      .insert({
        party_id: party.id,
        proposed_by_member_id: meMember.id,
        text,
      })
      .select('id, party_id, proposed_by_member_id, text, vote_count, is_finalized, active, created_at')
      .single();

    if (insErr) {
      console.error('propose-motto insert error:', insErr);
      return NextResponse.json({ error: 'Failed to propose motto' }, { status: 500 });
    }

    const proposal = inserted;

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (e) {
    console.error('propose-motto unhandled error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}