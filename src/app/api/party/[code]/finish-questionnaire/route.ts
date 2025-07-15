import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = await createClient();
  const { member_id: memberId } = await request.json();

  try {
    // Update member status to 'Finished'
    const { error: updateError } = await supabase
      .from('party_members')
      .update({ status: 'Finished' })
      .eq('id', memberId);

    if (updateError) {
      throw updateError;
    }

    // Check if all members are finished
    const { data: partyData, error: partyError } = await supabase
      .from('parties')
      .select('id')
      .eq('code', params.code)
      .single();

    if (partyError) {
      throw partyError;
    }

    const { count: unfinishedCount, error: countError } = await supabase
      .from('party_members')
      .select('*', { count: 'exact', head: true })
      .eq('party_id', partyData.id)
      .neq('status', 'Finished');

    if (countError) {
      throw countError;
    }

    // If all members are finished, invoke the calculation function
    if (unfinishedCount === 0) {
      // Don't await this, let it run in the background
      supabase.functions.invoke('calculate-results', {
        body: { party_id: partyData.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update status', details: message },
      { status: 500 }
    );
  }
}