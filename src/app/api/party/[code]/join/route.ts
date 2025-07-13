import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const { code } = params;
  const { firstName, lastName } = await request.json();

  if (!firstName) {
    return NextResponse.json({ error: 'First name is required' }, { status: 400 });
  }

  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to join a party' }, { status: 401 });
    }

    // First, update or create the user's profile with their name
    const fullName = `${firstName} ${lastName || ''}`.trim();
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: fullName
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Continue even if profile update fails, as it's not critical to joining a party
    }

    // Then proceed with the party joining logic
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('id')
      .eq('code', code)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // Check if the user is already a member of the party
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('party_members')
      .select('id')
      .eq('party_id', party.id)
      .eq('user_id', user.id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      throw memberCheckError;
    }

    if (!existingMember) {
      // If not a member, add them to the party
      const { error: insertError } = await supabase
        .from('party_members')
        .insert({
          party_id: party.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          user_id: user.id,
        });

      if (insertError) {
        throw insertError;
      }
    }

    // After successful insert, fetch the party details again to return to the client
    const { data: updatedParty, error: updatedPartyError } = await supabase
      .from('parties')
      .select('*, members:party_members(*)')
      .eq('id', party.id)
      .single();

    if (updatedPartyError) {
      throw updatedPartyError;
    }

    return NextResponse.json(updatedParty, { status: 201 });

  } catch (error) {
    console.error('Error joining party:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}