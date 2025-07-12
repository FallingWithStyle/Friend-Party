// friend-party-app/src/app/api/user/parties/route.ts
import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: parties, error } = await supabase
    .from('parties')
    .select('code, name');

  if (error) {
    console.error('Error fetching user parties:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch parties' }), { status: 500 });
  }

  return NextResponse.json(parties);
}