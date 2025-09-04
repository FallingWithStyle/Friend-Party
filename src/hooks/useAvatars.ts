import { useState, useEffect } from 'react';
import { AvatarPartRow, UserAvatarRow, UserAvatarPartRow } from '@/types/db';

interface AvatarPartWithDetails extends UserAvatarPartRow {
  avatar_parts: AvatarPartRow;
}

interface UserAvatarWithParts extends UserAvatarRow {
  head_part?: AvatarPartRow | null;
  skin_part?: AvatarPartRow | null;
  eyes_part?: AvatarPartRow | null;
  accessories_part?: AvatarPartRow | null;
  backgrounds_part?: AvatarPartRow | null;
  effects_part?: AvatarPartRow | null;
}

interface UseAvatarsReturn {
  avatar: UserAvatarWithParts | null;
  unlockedParts: AvatarPartWithDetails[];
  availableParts: AvatarPartRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateAvatar: (avatarConfig: Partial<UserAvatarRow>) => Promise<void>;
  unlockPart: (partId: string) => Promise<void>;
}

export function useAvatars(): UseAvatarsReturn {
  const [avatar, setAvatar] = useState<UserAvatarWithParts | null>(null);
  const [unlockedParts, setUnlockedParts] = useState<AvatarPartWithDetails[]>([]);
  const [availableParts, setAvailableParts] = useState<AvatarPartRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatarData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [avatarResponse, partsResponse] = await Promise.all([
        fetch('/api/avatars/user'),
        fetch('/api/avatars/parts')
      ]);

      if (!avatarResponse.ok) {
        throw new Error('Failed to fetch user avatar');
      }

      if (!partsResponse.ok) {
        throw new Error('Failed to fetch available parts');
      }

      const avatarData = await avatarResponse.json();
      const partsData = await partsResponse.json();

      setAvatar(avatarData.avatar);
      setUnlockedParts(avatarData.unlockedParts || []);
      setAvailableParts(partsData.parts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching avatar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (avatarConfig: Partial<UserAvatarRow>) => {
    try {
      const response = await fetch('/api/avatars/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(avatarConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update avatar');
      }

      const data = await response.json();
      setAvatar(data.avatar);
    } catch (err) {
      console.error('Error updating avatar:', err);
      throw err;
    }
  };

  const unlockPart = async (partId: string) => {
    try {
      const response = await fetch('/api/avatars/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unlock avatar part');
      }

      // Refetch avatar data to get updated unlocked parts
      await fetchAvatarData();
    } catch (err) {
      console.error('Error unlocking avatar part:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAvatarData();
  }, []);

  return {
    avatar,
    unlockedParts,
    availableParts,
    isLoading,
    error,
    refetch: fetchAvatarData,
    updateAvatar,
    unlockPart,
  };
}
