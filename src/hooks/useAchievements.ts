import { useState, useEffect } from 'react';
import { AchievementRow, UserAchievementRow, UserAchievementProgressRow } from '@/types/db';

interface AchievementWithDetails extends UserAchievementRow {
  achievements: AchievementRow;
}

interface ProgressWithDetails extends UserAchievementProgressRow {
  achievements: AchievementRow;
}

interface UseAchievementsReturn {
  achievements: AchievementWithDetails[];
  progress: ProgressWithDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  awardAchievement: (achievementType: string, data?: Record<string, unknown>) => Promise<void>;
}

export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<AchievementWithDetails[]>([]);
  const [progress, setProgress] = useState<ProgressWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/achievements/user');
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await response.json();
      setAchievements(data.achievements || []);
      setProgress(data.progress || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const awardAchievement = async (achievementType: string, data: Record<string, unknown> = {}) => {
    try {
      const response = await fetch('/api/achievements/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          achievementType,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to award achievement');
      }

      const result = await response.json();
      
      // If achievements were awarded, refetch the data
      if (result.awardedAchievements && result.awardedAchievements.length > 0) {
        await fetchAchievements();
        return result.awardedAchievements;
      }
      
      return [];
    } catch (err) {
      console.error('Error awarding achievement:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  return {
    achievements,
    progress,
    isLoading,
    error,
    refetch: fetchAchievements,
    awardAchievement,
  };
}
