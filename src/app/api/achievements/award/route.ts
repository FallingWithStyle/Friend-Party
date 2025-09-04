import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AwardAchievementRequest {
  userId: string;
  achievementType: string;
  data?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user (for authorization)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AwardAchievementRequest = await request.json();
    const { userId, achievementType, data = {} } = body;

    // Get all achievements of this type
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('is_active', true)
      .ilike('unlock_conditions->>type', achievementType);

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }

    const awardedAchievements = [];

    for (const achievement of achievements || []) {
      const conditions = achievement.unlock_conditions as Record<string, unknown>;
      const target = conditions.target as number;
      
      // Check if user already has this achievement
      const { data: existingAchievement } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.achievement_id)
        .single();

      if (existingAchievement) {
        continue; // User already has this achievement
      }

      // Check if user meets the conditions
      let currentValue = 0;
      
      // Get current progress or calculate from data
      const { data: progress } = await supabase
        .from('user_achievement_progress')
        .select('progress_data')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.achievement_id)
        .single();

      if (progress) {
        currentValue = (progress.progress_data as Record<string, unknown>)[achievementType] as number || 0;
      } else {
        // Calculate from provided data
        currentValue = data[achievementType] as number || 0;
      }

      // Award achievement if conditions are met
      if (currentValue >= target) {
        // Insert user achievement
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.achievement_id
          });

        if (insertError) {
          console.error('Error awarding achievement:', insertError);
          continue;
        }

        // Remove from progress table if it exists
        await supabase
          .from('user_achievement_progress')
          .delete()
          .eq('user_id', userId)
          .eq('achievement_id', achievement.achievement_id);

        awardedAchievements.push(achievement);
      } else {
        // Update or insert progress
        const progressData = { [achievementType]: currentValue, target };
        
        const { error: progressError } = await supabase
          .from('user_achievement_progress')
          .upsert({
            user_id: userId,
            achievement_id: achievement.achievement_id,
            progress_data: progressData
          }, { onConflict: 'user_id,achievement_id' });

        if (progressError) {
          console.error('Error updating progress:', progressError);
        }
      }
    }

    return NextResponse.json({ 
      awardedAchievements,
      message: `Awarded ${awardedAchievements.length} achievements`
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
