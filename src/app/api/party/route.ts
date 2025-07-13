import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePartyCode } from '@/utils/partyCodeGenerator'

import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { name, motto, creatorName } = await request.json();

    if (!name || !creatorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a party' }, { status: 401 });
    }

    let newParty = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const partyCode = generatePartyCode();
      const { data, error: rpcError } = await supabase.rpc('create_party_with_leader', {
        p_party_code: partyCode,
        p_party_name: name,
        p_party_motto: motto,
        p_leader_name: creatorName,
        p_leader_user_id: user.id,
      });

      if (rpcError) {
        // 23505 is the PostgreSQL error code for unique_violation
        if (rpcError.code === '23505') {
          attempts++;
          continue; // Try again with a new code
        }
        // For other errors, throw them
        console.error('Supabase RPC Error:', rpcError);
        throw rpcError;
      }

      newParty = data;
      break; // Success, exit loop
    }

    if (!newParty) {
      return NextResponse.json({ error: 'Failed to create a unique party' }, { status: 500 });
    }

    // Manually construct the response to match what the client expects
    const response = {
      ...newParty,
      user: {
        id: user.id,
        email: user.email,
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating party:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Party code is required' }, { status: 400 });
  }

  try {
    const { data: party, error } = await supabase
      .from('parties')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Party not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(party);

  } catch (error) {
    console.error('Error retrieving party:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}