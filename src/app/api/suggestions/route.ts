import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { suggestion_text, suggestion_type = 'other' } = body;

    // Validate required fields
    if (!suggestion_text || suggestion_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Suggestion text is required' },
        { status: 400 }
      );
    }

    // Validate suggestion type
    const validTypes = ['feature', 'bug', 'ui_ux', 'performance', 'accessibility', 'other'];
    if (!validTypes.includes(suggestion_type)) {
      return NextResponse.json(
        { error: 'Invalid suggestion type' },
        { status: 400 }
      );
    }

    // Insert the suggestion into the database
    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        user_id: user.id,
        suggestion_text: suggestion_text.trim(),
        suggestion_type,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting suggestion:', error);
      return NextResponse.json(
        { error: 'Failed to save suggestion' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Suggestion submitted successfully',
        suggestion: data
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in suggestions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = user.email === 'patrickandrewregan@gmail.com';

    let query = supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    // Non-admin users can only see their own suggestions
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ suggestions: data });

  } catch (error) {
    console.error('Unexpected error in suggestions GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
