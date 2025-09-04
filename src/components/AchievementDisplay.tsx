'use client';

import { useState } from 'react';
import { AchievementRow, UserAchievementRow, UserAchievementProgressRow } from '@/types/db';
import './AchievementDisplay.css';

interface AchievementWithDetails extends UserAchievementRow {
  achievements: AchievementRow;
}

interface ProgressWithDetails extends UserAchievementProgressRow {
  achievements: AchievementRow;
}

interface AchievementDisplayProps {
  achievements: AchievementWithDetails[];
  progress: ProgressWithDetails[];
  showProgress?: boolean;
  compact?: boolean;
}

export default function AchievementDisplay({ 
  achievements, 
  progress, 
  showProgress = true, 
  compact = false 
}: AchievementDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['Party Participation', 'Social Interaction', 'Questionnaire Completion', 'Special Events'];
  
  const filteredAchievements = selectedCategory 
    ? achievements.filter(a => a.achievements.category === selectedCategory)
    : achievements;

  const filteredProgress = selectedCategory 
    ? progress.filter(p => p.achievements.category === selectedCategory)
    : progress;

  const getProgressPercentage = (progressItem: ProgressWithDetails) => {
    const conditions = progressItem.achievements.unlock_conditions as Record<string, unknown>;
    const target = conditions.target as number;
    const current = (progressItem.progress_data as Record<string, unknown>)[conditions.type as string] as number || 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressText = (progressItem: ProgressWithDetails) => {
    const conditions = progressItem.achievements.unlock_conditions as Record<string, unknown>;
    const target = conditions.target as number;
    const current = (progressItem.progress_data as Record<string, unknown>)[conditions.type as string] as number || 0;
    return `${current}/${target}`;
  };

  if (compact) {
    return (
      <div className="achievement-display compact">
        <div className="achievement-stats">
          <div className="stat">
            <span className="stat-number">{achievements.length}</span>
            <span className="stat-label">Earned</span>
          </div>
          <div className="stat">
            <span className="stat-number">{progress.length}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="achievement-display">
      <div className="achievement-header">
        <h3>Achievements</h3>
        <div className="achievement-stats">
          <span>{achievements.length} earned</span>
          {showProgress && <span>{progress.length} in progress</span>}
        </div>
      </div>

      <div className="achievement-filters">
        <button
          className={`filter-button ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`filter-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="achievement-list">
        {filteredAchievements.map(achievement => (
          <div key={achievement.id} className="achievement-item earned">
            <div className="achievement-icon">
              <span className={`icon ${achievement.achievements.icon}`}>
                {achievement.achievements.icon === 'trophy' && '🏆'}
                {achievement.achievements.icon === 'star' && '⭐'}
                {achievement.achievements.icon === 'medal' && '🥇'}
                {achievement.achievements.icon === 'party-popper' && '🎉'}
                {achievement.achievements.icon === 'crown' && '👑'}
                {achievement.achievements.icon === 'butterfly' && '🦋'}
                {achievement.achievements.icon === 'edit' && '✏️'}
                {achievement.achievements.icon === 'quote' && '💬'}
                {achievement.achievements.icon === 'check-circle' && '✅'}
                {achievement.achievements.icon === 'users' && '👥'}
                {achievement.achievements.icon === 'user-check' && '👤✅'}
                {achievement.achievements.icon === 'users-check' && '👥✅'}
                {achievement.achievements.icon === 'award' && '🏅'}
                {achievement.achievements.icon === 'user-plus' && '👤➕'}
                {achievement.achievements.icon === 'eye' && '👁️'}
                {achievement.achievements.icon === 'user-circle' && '👤'}
              </span>
            </div>
            <div className="achievement-content">
              <h4 className="achievement-name">{achievement.achievements.name}</h4>
              <p className="achievement-description">{achievement.achievements.description}</p>
              <span className="achievement-date">
                Earned {new Date(achievement.earned_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {showProgress && filteredProgress.map(progressItem => (
          <div key={progressItem.id} className="achievement-item progress">
            <div className="achievement-icon">
              <span className={`icon ${progressItem.achievements.icon} locked`}>
                {progressItem.achievements.icon === 'trophy' && '🏆'}
                {progressItem.achievements.icon === 'star' && '⭐'}
                {progressItem.achievements.icon === 'medal' && '🥇'}
                {progressItem.achievements.icon === 'party-popper' && '🎉'}
                {progressItem.achievements.icon === 'crown' && '👑'}
                {progressItem.achievements.icon === 'butterfly' && '🦋'}
                {progressItem.achievements.icon === 'edit' && '✏️'}
                {progressItem.achievements.icon === 'quote' && '💬'}
                {progressItem.achievements.icon === 'check-circle' && '✅'}
                {progressItem.achievements.icon === 'users' && '👥'}
                {progressItem.achievements.icon === 'user-check' && '👤✅'}
                {progressItem.achievements.icon === 'users-check' && '👥✅'}
                {progressItem.achievements.icon === 'award' && '🏅'}
                {progressItem.achievements.icon === 'user-plus' && '👤➕'}
                {progressItem.achievements.icon === 'eye' && '👁️'}
                {progressItem.achievements.icon === 'user-circle' && '👤'}
              </span>
            </div>
            <div className="achievement-content">
              <h4 className="achievement-name">{progressItem.achievements.name}</h4>
              <p className="achievement-description">{progressItem.achievements.description}</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getProgressPercentage(progressItem)}%` }}
                />
              </div>
              <span className="progress-text">{getProgressText(progressItem)}</span>
            </div>
          </div>
        ))}

        {filteredAchievements.length === 0 && filteredProgress.length === 0 && (
          <div className="no-achievements">
            <p>No achievements found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
