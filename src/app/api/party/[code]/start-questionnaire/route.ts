import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const { member_id } = await request.json();
  const { code } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!member_id) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing member_id' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const { error } = await supabase
    .from('party_members')
    .update({ status: 'Voting' })
    .eq('id', member_id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating member status:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to update status', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.json({ success: true });
}