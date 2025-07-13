import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

// Helper function to get user profile
async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// Helper function to create or update user profile
async function upsertUserProfile(userId: string, profileData: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }

  return data;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getUserProfile(user.id);
  return NextResponse.json(profile || { error: 'Profile not found' });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const profile = await upsertUserProfile(user.id, body);

  if (!profile) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json(profile);
}