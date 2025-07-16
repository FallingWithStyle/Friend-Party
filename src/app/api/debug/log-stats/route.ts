import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { member_id, member_name, source, stats } = await request.json();

  try {
    const { error } = await supabase.from('debug_stat_changes').insert({
      party_member_id: member_id,
      member_name: member_name,
      change_source: source,
      stats: stats,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to log stats', details: message },
      { status: 500 }
    );
  }
}