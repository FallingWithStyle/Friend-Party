import { createClient } from '@/lib/supabase/client';

class AvatarService {
  private supabase = createClient();

  async unlockPartByAchievement(achievementId: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      // Find avatar parts that require this achievement
      const { data: parts, error } = await this.supabase
        .from('avatar_parts')
        .select('*')
        .contains('unlock_requirements', { achievement_id: achievementId });

      if (error) {
        console.error('Error finding avatar parts:', error);
        return [];
      }

      if (!parts || parts.length === 0) return [];

      const unlockedParts = [];

      for (const part of parts) {
        // Check if user already has this part
        const { data: existingPart } = await this.supabase
          .from('user_avatar_parts')
          .select('id')
          .eq('user_id', user.id)
          .eq('part_id', part.part_id)
          .single();

        if (existingPart) continue; // User already has this part

        // Unlock the part
        const { data: unlockedPart, error: unlockError } = await this.supabase
          .from('user_avatar_parts')
          .insert({
            user_id: user.id,
            part_id: part.part_id
          })
          .select(`
            *,
            avatar_parts (*)
          `)
          .single();

        if (unlockError) {
          console.error('Error unlocking avatar part:', unlockError);
          continue;
        }

        unlockedParts.push(unlockedPart);
      }

      return unlockedParts;
    } catch (error) {
      console.error('Error unlocking avatar parts:', error);
      return [];
    }
  }

  async unlockDefaultParts() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      // Get all default avatar parts
      const { data: defaultParts, error } = await this.supabase
        .from('avatar_parts')
        .select('*')
        .eq('is_default', true);

      if (error) {
        console.error('Error fetching default parts:', error);
        return [];
      }

      if (!defaultParts || defaultParts.length === 0) return [];

      const unlockedParts = [];

      for (const part of defaultParts) {
        // Check if user already has this part
        const { data: existingPart } = await this.supabase
          .from('user_avatar_parts')
          .select('id')
          .eq('user_id', user.id)
          .eq('part_id', part.part_id)
          .single();

        if (existingPart) continue; // User already has this part

        // Unlock the part
        const { data: unlockedPart, error: unlockError } = await this.supabase
          .from('user_avatar_parts')
          .insert({
            user_id: user.id,
            part_id: part.part_id
          })
          .select(`
            *,
            avatar_parts (*)
          `)
          .single();

        if (unlockError) {
          console.error('Error unlocking default part:', unlockError);
          continue;
        }

        unlockedParts.push(unlockedPart);
      }

      return unlockedParts;
    } catch (error) {
      console.error('Error unlocking default parts:', error);
      return [];
    }
  }

  async createDefaultAvatar() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      // Check if user already has an avatar
      const { data: existingAvatar } = await this.supabase
        .from('user_avatars')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingAvatar) return existingAvatar;

      // Get default parts for each type
      const { data: defaultParts, error } = await this.supabase
        .from('avatar_parts')
        .select('*')
        .eq('is_default', true)
        .order('type')
        .order('sort_order');

      if (error) {
        console.error('Error fetching default parts:', error);
        return null;
      }

      if (!defaultParts || defaultParts.length === 0) return null;

      // Create avatar configuration with default parts
      const avatarConfig: any = { user_id: user.id };

      defaultParts.forEach(part => {
        switch (part.type) {
          case 'head':
            avatarConfig.head_part_id = part.part_id;
            break;
          case 'skin':
            avatarConfig.skin_part_id = part.part_id;
            break;
          case 'eyes':
            avatarConfig.eyes_part_id = part.part_id;
            break;
          case 'accessories':
            avatarConfig.accessories_part_id = part.part_id;
            break;
          case 'backgrounds':
            avatarConfig.backgrounds_part_id = part.part_id;
            break;
          case 'effects':
            avatarConfig.effects_part_id = part.part_id;
            break;
        }
      });

      // Create the avatar
      const { data: avatar, error: avatarError } = await this.supabase
        .from('user_avatars')
        .insert(avatarConfig)
        .select()
        .single();

      if (avatarError) {
        console.error('Error creating default avatar:', avatarError);
        return null;
      }

      return avatar;
    } catch (error) {
      console.error('Error creating default avatar:', error);
      return null;
    }
  }
}

export const avatarService = new AvatarService();
