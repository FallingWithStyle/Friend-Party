import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AvatarPartRow } from '@/types/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let query = supabase
      .from('avatar_parts')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: parts, error } = await query;

    if (error) {
      console.error('Error fetching avatar parts:', error);
      return NextResponse.json({ error: 'Failed to fetch avatar parts' }, { status: 500 });
    }

    return NextResponse.json({ parts: parts || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
