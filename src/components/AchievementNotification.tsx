'use client';

import { useState, useEffect } from 'react';
import { AchievementRow } from '@/types/db';
import './AchievementNotification.css';

interface AchievementNotificationProps {
  achievement: AchievementRow;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function AchievementNotification({ 
  achievement, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto close if enabled
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);
      
      return () => clearTimeout(closeTimer);
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, duration, onClose]);

  const getIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      'trophy': '🏆',
      'star': '⭐',
      'medal': '🥇',
      'party-popper': '🎉',
      'crown': '👑',
      'butterfly': '🦋',
      'edit': '✏️',
      'quote': '💬',
      'check-circle': '✅',
      'users': '👥',
      'user-check': '👤✅',
      'users-check': '👥✅',
      'award': '🏅',
      'user-plus': '👤➕',
      'eye': '👁️',
      'user-circle': '👤',
    };
    return icons[iconName] || '🏆';
  };

  return (
    <div className={`achievement-notification ${isVisible ? 'visible' : ''}`}>
      <div className="notification-content">
        <div className="achievement-icon">
          <span className="icon">{getIcon(achievement.icon)}</span>
        </div>
        <div className="achievement-text">
          <h4 className="achievement-title">Achievement Unlocked!</h4>
          <p className="achievement-name">{achievement.name}</p>
          <p className="achievement-description">{achievement.description}</p>
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
