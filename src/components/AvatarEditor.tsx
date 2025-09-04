'use client';

import { useState, useEffect } from 'react';
import { AvatarPartRow, UserAvatarRow } from '@/types/db';
import './AvatarEditor.css';

interface AvatarEditorProps {
  availableParts: AvatarPartRow[];
  unlockedParts: { part_id: string }[];
  currentAvatar: UserAvatarRow | null;
  onUpdateAvatar: (avatarConfig: Partial<UserAvatarRow>) => Promise<void>;
  onUnlockPart: (partId: string) => Promise<void>;
}

export default function AvatarEditor({ 
  availableParts, 
  unlockedParts, 
  currentAvatar, 
  onUpdateAvatar, 
  onUnlockPart 
}: AvatarEditorProps) {
  const [selectedType, setSelectedType] = useState<string>('head');
  const [selectedParts, setSelectedParts] = useState<Partial<UserAvatarRow>>({
    head_part_id: currentAvatar?.head_part_id || null,
    skin_part_id: currentAvatar?.skin_part_id || null,
    eyes_part_id: currentAvatar?.eyes_part_id || null,
    accessories_part_id: currentAvatar?.accessories_part_id || null,
    backgrounds_part_id: currentAvatar?.backgrounds_part_id || null,
    effects_part_id: currentAvatar?.effects_part_id || null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const partTypes = [
    { key: 'head', label: 'Head', field: 'head_part_id' as keyof UserAvatarRow },
    { key: 'skin', label: 'Skin', field: 'skin_part_id' as keyof UserAvatarRow },
    { key: 'eyes', label: 'Eyes', field: 'eyes_part_id' as keyof UserAvatarRow },
    { key: 'accessories', label: 'Accessories', field: 'accessories_part_id' as keyof UserAvatarRow },
    { key: 'backgrounds', label: 'Background', field: 'backgrounds_part_id' as keyof UserAvatarRow },
    { key: 'effects', label: 'Effects', field: 'effects_part_id' as keyof UserAvatarRow },
  ];

  const unlockedPartIds = new Set(unlockedParts.map(p => p.part_id));
  const partsForType = availableParts
    .filter(part => part.type === selectedType)
    .sort((a, b) => {
      // Default parts first, then by sort order
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return a.sort_order - b.sort_order;
    });

  const handlePartSelect = (partId: string | null) => {
    const currentType = partTypes.find(t => t.key === selectedType);
    if (currentType) {
      setSelectedParts(prev => ({
        ...prev,
        [currentType.field]: partId,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateAvatar(selectedParts);
    } catch (error) {
      console.error('Error saving avatar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlockPart = async (partId: string) => {
    try {
      await onUnlockPart(partId);
    } catch (error) {
      console.error('Error unlocking part:', error);
    }
  };

  const getPartImageUrl = (part: AvatarPartRow) => {
    // For now, use placeholder images. In a real app, these would be actual image URLs
    return `/api/placeholder/64/64?text=${encodeURIComponent(part.name)}`;
  };

  return (
    <div className="avatar-editor">
      <div className="avatar-preview">
        <div className="avatar-canvas">
          {/* This would be a composite avatar image in a real implementation */}
          <div className="avatar-placeholder">
            <span>Avatar Preview</span>
            <div className="avatar-parts-list">
              {partTypes.map(type => {
                const partId = selectedParts[type.field] as string | null;
                const part = partId ? availableParts.find(p => p.part_id === partId) : null;
                return part ? (
                  <div key={type.key} className="avatar-part-indicator">
                    <span className="part-type">{type.label}:</span>
                    <span className="part-name">{part.name}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="avatar-controls">
        <div className="part-type-selector">
          {partTypes.map(type => (
            <button
              key={type.key}
              className={`type-button ${selectedType === type.key ? 'active' : ''}`}
              onClick={() => setSelectedType(type.key)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="part-selector">
          <h4>Select {partTypes.find(t => t.key === selectedType)?.label}</h4>
          <div className="parts-grid">
            {partsForType.map(part => {
              const isUnlocked = unlockedPartIds.has(part.part_id);
              const isSelected = selectedParts[partTypes.find(t => t.key === selectedType)?.field as keyof UserAvatarRow] === part.part_id;
              
              return (
                <div
                  key={part.part_id}
                  className={`part-option ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                  onClick={() => isUnlocked && handlePartSelect(part.part_id)}
                >
                  <div className="part-image">
                    <img 
                      src={getPartImageUrl(part)} 
                      alt={part.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="part-placeholder hidden">
                      {part.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="part-info">
                    <span className="part-name">{part.name}</span>
                    {part.is_premium && <span className="premium-badge">Premium</span>}
                    {!isUnlocked && (
                      <button
                        className="unlock-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockPart(part.part_id);
                        }}
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="avatar-actions">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
