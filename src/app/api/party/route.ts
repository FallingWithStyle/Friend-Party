import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generatePartyCode } from '@/utils/partyCodeGenerator'

import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { name, description, creatorName } = await request.json();

    if (!name || !creatorName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let partyCode: string;
    let isCodeUnique = false;
    let attempts = 0;

    do {
      partyCode = generatePartyCode();
      const { data: existingParty, error } = await supabase
        .from('parties')
        .select('code')
        .eq('code', partyCode)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = 'No rows found'
        throw error;
      }

      if (!existingParty) {
        isCodeUnique = true;
      }
      attempts++;
    } while (!isCodeUnique && attempts < 10);

    if (!isCodeUnique) {
      return NextResponse.json({ error: 'Failed to generate a unique party code' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to create a party' }, { status: 401 });
    }

    const { data: newParty, error: rpcError } = await supabase.rpc('create_party_and_leader', {
      party_code: partyCode,
      party_name: name,
      party_description: description,
      leader_name: creatorName,
      leader_user_id: user.id,
    });

    if (rpcError) {
      console.error('Supabase RPC Error:', rpcError);
      throw rpcError;
    }

    return NextResponse.json(newParty, { status: 201 });

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