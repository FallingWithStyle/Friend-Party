import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = createClient();
  const { code } = params;
  const { firstName, lastName } = await request.json();

  if (!firstName) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  try {
    // First, get the party ID from the code
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('id')
      .eq('code', code)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // Now, add the new member to the party
    const { data: newMember, error: insertError } = await supabase
      .from('party_members')
      .insert({
        party_id: party.id,
        first_name: firstName,
        last_name: lastName,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(newMember, { status: 201 });

  } catch (error) {
    console.error('Error joining party:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}