// src/app/api/user/parties/route.ts
import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: partyMembers, error } = await supabase
    .from('party_members')
    .select(`
      party:parties (
        code,
        name
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user parties:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch parties' }), { status: 500 });
  }

  const parties = partyMembers?.map(pm => pm.party).filter(Boolean) || [];

  return NextResponse.json(parties);
}