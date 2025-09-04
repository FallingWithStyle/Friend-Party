import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserAchievementRow, UserAchievementProgressRow } from '@/types/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's earned achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (
          achievement_id,
          name,
          description,
          icon,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (achievementsError) {
      console.error('Error fetching user achievements:', achievementsError);
      return NextResponse.json({ error: 'Failed to fetch user achievements' }, { status: 500 });
    }

    // Get user's achievement progress
    const { data: progress, error: progressError } = await supabase
      .from('user_achievement_progress')
      .select(`
        *,
        achievements (
          achievement_id,
          name,
          description,
          icon,
          category,
          unlock_conditions
        )
      `)
      .eq('user_id', user.id);

    if (progressError) {
      console.error('Error fetching user achievement progress:', progressError);
      return NextResponse.json({ error: 'Failed to fetch user achievement progress' }, { status: 500 });
    }

    return NextResponse.json({ 
      achievements: achievements || [], 
      progress: progress || [] 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
