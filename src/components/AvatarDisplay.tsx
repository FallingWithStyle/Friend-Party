'use client';

import { AvatarPartRow, UserAvatarRow } from '@/types/db';
import './AvatarDisplay.css';

interface AvatarDisplayProps {
  avatar: UserAvatarRow | null;
  parts: AvatarPartRow[];
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  name?: string;
}

export default function AvatarDisplay({ 
  avatar, 
  parts, 
  size = 'medium', 
  showName = false, 
  name 
}: AvatarDisplayProps) {
  const getPartById = (partId: string | null) => {
    return partId ? parts.find(p => p.part_id === partId) : null;
  };

  const headPart = getPartById(avatar?.head_part_id || null);
  const skinPart = getPartById(avatar?.skin_part_id || null);
  const eyesPart = getPartById(avatar?.eyes_part_id || null);
  const accessoriesPart = getPartById(avatar?.accessories_part_id || null);
  const backgroundsPart = getPartById(avatar?.backgrounds_part_id || null);
  const effectsPart = getPartById(avatar?.effects_part_id || null);

  const getPartImageUrl = (part: AvatarPartRow) => {
    // For now, use placeholder images. In a real app, these would be actual image URLs
    return `/api/placeholder/64/64?text=${encodeURIComponent(part.name)}`;
  };

  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large'
  };

  return (
    <div className={`avatar-display ${sizeClasses[size]}`}>
      <div className="avatar-container">
        <div className="avatar-layers">
          {/* Background layer */}
          {backgroundsPart && (
            <div className="avatar-layer background">
              <img 
                src={getPartImageUrl(backgroundsPart)} 
                alt={backgroundsPart.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Head layer */}
          {headPart && (
            <div className="avatar-layer head">
              <img 
                src={getPartImageUrl(headPart)} 
                alt={headPart.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Skin layer */}
          {skinPart && (
            <div className="avatar-layer skin">
              <img 
                src={getPartImageUrl(skinPart)} 
                alt={skinPart.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Eyes layer */}
          {eyesPart && (
            <div className="avatar-layer eyes">
              <img 
                src={getPartImageUrl(eyesPart)} 
                alt={eyesPart.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Accessories layer */}
          {accessoriesPart && (
            <div className="avatar-layer accessories">
              <img 
                src={getPartImageUrl(accessoriesPart)} 
                alt={accessoriesPart.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Effects layer */}
          {effectsPart && (
            <div className="avatar-layer effects">
              <img 
                src={getPartImageUrl(effectsPart)} 
                alt={effectsPart.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        
        {/* Default avatar if no parts are configured */}
        {!avatar && (
          <div className="avatar-default">
            <span className="default-icon">👤</span>
          </div>
        )}
      </div>
      
      {showName && name && (
        <div className="avatar-name">
          {name}
        </div>
      )}
    </div>
  );
}
