# StackMap Data Structure v2

## Overview

The new data structure for StackMap has been redesigned to properly support multiple users with per-user activities and settings. This replaces the legacy "tacked on" system with a clean, scalable architecture.

## Structure

```javascript
{
  version: 2,                    // Data structure version for migrations
  currentUserId: "user_xxx",     // Currently active user ID
  users: {                       // User dictionary
    "user_xxx": {
      id: "user_xxx",           // Unique user ID
      name: "User Name",        // Display name
      icon: "😊",               // User emoji/icon
      activities: [             // User's activity list
        {
          id: "activity_xxx",   // Unique activity ID
          text: "Activity",     // Activity title/text
          emoji: "📝",          // Activity emoji
          time: "9:00 AM",      // Optional time (null if not set)
          completed: false,     // Completion status
          createdAt: "ISO date" // Creation timestamp
        }
      ],
      settings: {               // Per-user settings
        celebration: "confetti", // Celebration type
        soundEnabled: true      // Sound preferences
      },
      createdAt: "ISO date",    // User creation timestamp
      lastActive: "ISO date"    // Last activity timestamp
    }
  },
  globalSettings: {             // App-wide settings
    themeColor: "#667eea",      // Theme color
    displayMode: "numbers"      // Display mode: numbers/time/none
  }
}
```

## Key Improvements

1. **Proper User Management**
   - Each user has their own ID, profile, and activity list
   - Users can be added, switched, and deleted
   - Last active tracking for user analytics

2. **Activity Structure**
   - Activities now use `text` instead of `title` for consistency
   - Time field properly supported (was placeholder before)
   - Unique IDs prevent conflicts

3. **Settings Organization**
   - Global settings (theme, display mode) separate from user settings
   - Per-user preferences (celebration type, sounds)
   - Extensible for future features

4. **Data Migration**
   - Automatic migration from legacy format
   - Version tracking for future migrations
   - Preserves existing data during upgrade

## Migration Logic

When loading data, the app checks:
1. If v2 data exists → load directly
2. If legacy data exists → migrate to v2
3. If no data → create default user

Legacy activities are migrated with:
- `title` → `text`
- Generated unique IDs
- Preserved completion status
- Added timestamps

## API Methods

### User Management
- `createUser(name, icon)` - Create new user
- `getCurrentUser()` - Get active user
- `switchUser(userId)` - Switch active user
- `deleteUser(userId)` - Delete user and their data

### Activity Management
- `getCurrentActivities()` - Get current user's activities
- `addActivity(text, emoji, time)` - Add activity
- `updateActivity(id, updates)` - Update activity
- `deleteActivity(id)` - Delete activity
- `toggleActivityComplete(id)` - Toggle completion

### Data Persistence
- `loadData()` - Load from localStorage with migration
- `saveData()` - Save to localStorage
- `exportData()` - Export as JSON file
- `importData()` - Import from JSON file

## Storage Keys

- `stackmap_data_v2` - Main data structure
- `stackmap_theme_color` - Quick access to theme
- `stackmap_display_mode` - Quick access to display mode

## Future Considerations

The structure is designed to support:
- Multiple activity lists per user (Today/Tomorrow)
- Activity templates/library
- Sharing between users
- Cloud sync preparation
- Analytics and insights
</content>