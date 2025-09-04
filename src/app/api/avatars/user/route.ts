import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserAvatarRow, UserAvatarPartRow } from '@/types/db';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current avatar configuration
    const { data: avatar, error: avatarError } = await supabase
      .from('user_avatars')
      .select(`
        *,
        head_part:avatar_parts!head_part_id(*),
        skin_part:avatar_parts!skin_part_id(*),
        eyes_part:avatar_parts!eyes_part_id(*),
        accessories_part:avatar_parts!accessories_part_id(*),
        backgrounds_part:avatar_parts!backgrounds_part_id(*),
        effects_part:avatar_parts!effects_part_id(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (avatarError && avatarError.code !== 'PGRST116') {
      console.error('Error fetching user avatar:', avatarError);
      return NextResponse.json({ error: 'Failed to fetch user avatar' }, { status: 500 });
    }

    // Get user's unlocked avatar parts
    const { data: unlockedParts, error: partsError } = await supabase
      .from('user_avatar_parts')
      .select(`
        *,
        avatar_parts (*)
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (partsError) {
      console.error('Error fetching user avatar parts:', partsError);
      return NextResponse.json({ error: 'Failed to fetch user avatar parts' }, { status: 500 });
    }

    return NextResponse.json({ 
      avatar: avatar || null,
      unlockedParts: unlockedParts || []
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      head_part_id, 
      skin_part_id, 
      eyes_part_id, 
      accessories_part_id, 
      backgrounds_part_id, 
      effects_part_id 
    } = body;

    // Verify user owns all the parts they're trying to equip
    const partIds = [head_part_id, skin_part_id, eyes_part_id, accessories_part_id, backgrounds_part_id, effects_part_id].filter(Boolean);
    
    if (partIds.length > 0) {
      const { data: ownedParts, error: ownedError } = await supabase
        .from('user_avatar_parts')
        .select('part_id')
        .eq('user_id', user.id)
        .in('part_id', partIds);

      if (ownedError) {
        console.error('Error checking owned parts:', ownedError);
        return NextResponse.json({ error: 'Failed to verify owned parts' }, { status: 500 });
      }

      const ownedPartIds = (ownedParts || []).map(p => p.part_id);
      const unownedParts = partIds.filter(id => !ownedPartIds.includes(id));
      
      if (unownedParts.length > 0) {
        return NextResponse.json({ 
          error: 'You do not own some of the selected avatar parts',
          unownedParts 
        }, { status: 400 });
      }
    }

    // Update or create user avatar
    const { data: avatar, error: avatarError } = await supabase
      .from('user_avatars')
      .upsert({
        user_id: user.id,
        head_part_id,
        skin_part_id,
        eyes_part_id,
        accessories_part_id,
        backgrounds_part_id,
        effects_part_id
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (avatarError) {
      console.error('Error updating user avatar:', avatarError);
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
    }

    return NextResponse.json({ avatar });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
