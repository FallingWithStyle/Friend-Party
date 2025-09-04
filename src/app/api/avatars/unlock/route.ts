import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface UnlockAvatarPartRequest {
  userId: string;
  partId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user (for authorization)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UnlockAvatarPartRequest = await request.json();
    const { userId, partId } = body;

    // Get the avatar part details
    const { data: part, error: partError } = await supabase
      .from('avatar_parts')
      .select('*')
      .eq('part_id', partId)
      .single();

    if (partError || !part) {
      return NextResponse.json({ error: 'Avatar part not found' }, { status: 404 });
    }

    // Check if user already has this part
    const { data: existingPart } = await supabase
      .from('user_avatar_parts')
      .select('id')
      .eq('user_id', userId)
      .eq('part_id', partId)
      .single();

    if (existingPart) {
      return NextResponse.json({ error: 'User already has this avatar part' }, { status: 400 });
    }

    // Check unlock requirements if not a default part
    if (!part.is_default && part.unlock_requirements) {
      const requirements = part.unlock_requirements as Record<string, unknown>;
      
      if (requirements.achievement_id) {
        // Check if user has the required achievement
        const { data: achievement } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', userId)
          .eq('achievement_id', requirements.achievement_id as string)
          .single();

        if (!achievement) {
          return NextResponse.json({ 
            error: 'User does not meet unlock requirements',
            requirements 
          }, { status: 400 });
        }
      }
    }

    // Unlock the avatar part
    const { data: unlockedPart, error: unlockError } = await supabase
      .from('user_avatar_parts')
      .insert({
        user_id: userId,
        part_id: partId
      })
      .select(`
        *,
        avatar_parts (*)
      `)
      .single();

    if (unlockError) {
      console.error('Error unlocking avatar part:', unlockError);
      return NextResponse.json({ error: 'Failed to unlock avatar part' }, { status: 500 });
    }

    return NextResponse.json({ 
      unlockedPart,
      message: 'Avatar part unlocked successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
