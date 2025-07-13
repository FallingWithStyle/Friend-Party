import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const partyCode = params.code;

  try {
    const { member_id } = await request.json();

    if (!member_id) {
      return new NextResponse(JSON.stringify({ error: 'Member ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First, get the party_id from the party code
    const { data: partyData, error: partyError } = await supabase
      .from('parties')
      .select('id')
      .eq('code', partyCode)
      .single();

    if (partyError || !partyData) {
      return new NextResponse(JSON.stringify({ error: 'Party not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const partyId = partyData.id;

    // Update the party_member status to 'Finished'
    const { error: updateError } = await supabase
      .from('party_members')
      .update({ status: 'Finished' })
      .eq('id', member_id)
      .eq('party_id', partyId);

    if (updateError) {
      console.error('Error updating party member status:', updateError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update member status' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if all members of the party have finished
    const { data: members, error: membersError } = await supabase
      .from('party_members')
      .select('status')
      .eq('party_id', partyId);

    if (membersError) {
      console.error('Error fetching party members:', membersError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch party members' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const allFinished = members.every((member: { status: string }) => member.status === 'Finished');

    if (allFinished) {
      // Invoke the 'calculate-results' Edge Function
      const { error: functionError } = await supabase.functions.invoke(
        'calculate-results',
        {
          body: { party_id: partyId },
        }
      );

      if (functionError) {
        console.error('Error invoking calculate-results function:', functionError);
        // Decide if we should return an error to the client or handle it silently
      }
    }

    return new NextResponse(
      JSON.stringify({ message: 'Questionnaire finished successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}