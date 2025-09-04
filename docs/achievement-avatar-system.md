# Achievement and Avatar System

This document describes the implementation of the Achievement System (Story 4.3) and Avatar System (Story 4.4) for the Friend Party application.

## Achievement System

### Database Schema

The achievement system uses three main tables:

1. **`achievements`** - Stores available achievements
   - `achievement_id` (UUID, Primary Key)
   - `name` (TEXT) - Display name of the achievement
   - `description` (TEXT) - Description of what the achievement requires
   - `icon` (TEXT) - Icon identifier for display
   - `category` (TEXT) - Category: Party Participation, Social Interaction, Questionnaire Completion, Special Events
   - `unlock_conditions` (JSONB) - Conditions for unlocking (e.g., `{"type": "parties_joined", "target": 5}`)
   - `is_active` (BOOLEAN) - Whether the achievement is currently available
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **`user_achievements`** - Tracks earned achievements
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `achievement_id` (UUID, Foreign Key to achievements)
   - `earned_at` (TIMESTAMPTZ)
   - Unique constraint on (user_id, achievement_id)

3. **`user_achievement_progress`** - Tracks progress on multi-step achievements
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `achievement_id` (UUID, Foreign Key to achievements)
   - `progress_data` (JSONB) - Current progress data
   - `last_updated` (TIMESTAMPTZ)
   - Unique constraint on (user_id, achievement_id)

### API Endpoints

- `GET /api/achievements` - Get all available achievements
- `GET /api/achievements/user` - Get user's achievements and progress
- `POST /api/achievements/award` - Award achievements based on user actions

### Components

- `AchievementDisplay` - Shows user's achievements with filtering and progress tracking
- `AchievementNotification` - Toast notification for newly unlocked achievements
- `useAchievements` - Hook for managing achievement data
- `useAchievementNotifications` - Hook for managing achievement notifications

### Achievement Categories

1. **Party Participation**
   - First Party (join 1 party)
   - Party Leader (create 1 party)
   - Social Butterfly (join 5 parties)
   - Party Master (create 3 parties)

2. **Social Interaction**
   - Name Giver (propose 1 adventurer name)
   - Motto Master (propose 1 party motto)
   - Vote Caster (cast 1 vote)
   - Consensus Builder (cast 10 votes)

3. **Questionnaire Completion**
   - Self Explorer (complete 1 self-assessment)
   - Peer Reviewer (complete 1 peer assessment)
   - Assessment Expert (complete 5 assessments)

4. **Special Events**
   - Hireling Recruiter (convert 1 hireling)
   - Results Viewer (view party results)
   - Profile Complete (complete profile)

## Avatar System

### Database Schema

The avatar system uses three main tables:

1. **`avatar_parts`** - Stores available avatar parts
   - `part_id` (UUID, Primary Key)
   - `type` (TEXT) - Part type: head, skin, eyes, accessories, backgrounds, effects
   - `name` (TEXT) - Display name of the part
   - `image_url` (TEXT) - URL to the part image
   - `unlock_requirements` (JSONB) - Requirements for unlocking (e.g., `{"achievement": "Party Leader"}`)
   - `is_default` (BOOLEAN) - Whether this is a default starter part
   - `is_premium` (BOOLEAN) - Whether this is a premium part
   - `sort_order` (INTEGER) - For ordering parts in UI
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **`user_avatar_parts`** - Tracks unlocked avatar parts
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `part_id` (UUID, Foreign Key to avatar_parts)
   - `unlocked_at` (TIMESTAMPTZ)
   - Unique constraint on (user_id, part_id)

3. **`user_avatars`** - Stores current avatar configuration
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to auth.users)
   - `head_part_id`, `skin_part_id`, `eyes_part_id`, `accessories_part_id`, `backgrounds_part_id`, `effects_part_id` (UUID, Foreign Keys to avatar_parts)
   - `created_at`, `updated_at` (TIMESTAMPTZ)
   - Unique constraint on user_id

### API Endpoints

- `GET /api/avatars/parts` - Get available avatar parts (optionally filtered by type)
- `GET /api/avatars/user` - Get user's avatar configuration and unlocked parts
- `PUT /api/avatars/user` - Update user's avatar configuration
- `POST /api/avatars/unlock` - Unlock an avatar part

### Components

- `AvatarEditor` - Interface for customizing avatar appearance
- `AvatarDisplay` - Shows composed avatar in various sizes
- `useAvatars` - Hook for managing avatar data

### Avatar Part Types

1. **Head** - Character head shapes/races (Human, Elf, Dwarf, Halfling)
2. **Skin** - Skin colors (Light, Medium, Dark, Tan)
3. **Eyes** - Eye colors (Brown, Blue, Green, Hazel)
4. **Accessories** - Additional items (None, Glasses, Hat, Crown, Wizard Hat)
5. **Backgrounds** - Background scenes (Plain, Forest, Castle, Dragon Lair)
6. **Effects** - Special effects (None, Sparkle, Fire, Ice)

### Default vs Premium Parts

- **Default parts** are automatically unlocked for all users
- **Premium parts** require specific achievements to unlock
- Users start with default parts and can unlock premium parts through gameplay

## Integration

### Profile Page

The profile page now includes three tabs:
1. **Profile** - Basic profile information with avatar display
2. **Achievements** - Achievement display with filtering and progress tracking
3. **Avatar** - Avatar customization interface

### Automatic Systems

- **Achievement Service** (`src/lib/achievementService.ts`) - Automatically awards achievements based on user actions
- **Avatar Service** (`src/lib/avatarService.ts`) - Manages avatar part unlocking and default avatar creation
- **Default Avatar Creation** - New users automatically get default avatar parts and a default avatar configuration

### Notifications

- Achievement notifications appear as toast messages when achievements are unlocked
- Notifications auto-dismiss after 5 seconds or can be manually closed
- Multiple notifications can be shown simultaneously

## Usage Examples

### Awarding Achievements

```typescript
import { achievementService } from '@/lib/achievementService';

// Award a specific achievement
await achievementService.awardPartyJoined();

// Update all user stats and award achievements
await achievementService.updateUserStats();
```

### Managing Avatars

```typescript
import { avatarService } from '@/lib/avatarService';

// Unlock default parts for new users
await avatarService.unlockDefaultParts();

// Create default avatar
await avatarService.createDefaultAvatar();

// Unlock parts based on achievements
await avatarService.unlockPartByAchievement('achievement-id');
```

### Using Components

```tsx
import AchievementDisplay from '@/components/AchievementDisplay';
import AvatarEditor from '@/components/AvatarEditor';
import AvatarDisplay from '@/components/AvatarDisplay';

// Show achievements
<AchievementDisplay 
  achievements={achievements} 
  progress={progress} 
  showProgress={true}
/>

// Show avatar editor
<AvatarEditor
  availableParts={availableParts}
  unlockedParts={unlockedParts}
  currentAvatar={avatar}
  onUpdateAvatar={updateAvatar}
  onUnlockPart={unlockPart}
/>

// Show avatar
<AvatarDisplay 
  avatar={avatar} 
  parts={availableParts} 
  size="large"
  showName={true}
  name="Player Name"
/>
```

## Future Enhancements

1. **Achievement Categories** - Add more achievement categories and types
2. **Avatar Animations** - Add animated avatar parts and effects
3. **Achievement Rewards** - Link achievements to avatar part unlocks
4. **Social Features** - Show achievements and avatars in party lobbies
5. **Leaderboards** - Track and display achievement statistics
6. **Seasonal Content** - Limited-time achievements and avatar parts
