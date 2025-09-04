import { useState, useCallback } from 'react';
import { AchievementRow } from '@/types/db';

interface AchievementNotification {
  id: string;
  achievement: AchievementRow;
}

export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);

  const showNotification = useCallback((achievement: AchievementRow) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: AchievementNotification = {
      id,
      achievement,
    };

    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  };
}
