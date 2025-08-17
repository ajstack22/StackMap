# Data Dictionary

## Overview
This document defines the canonical data structure for StackMap. All services MUST conform to these definitions.

## Core Data Types

### User
```typescript
interface User {
  id: string;           // Format: `user_${timestamp}_${index}_${randomId}`
  name: string;         // Display name (required, non-empty)
  icon: string;         // Single emoji character (required)
  days: {
    [dayKey: string]: Day;  // Keys: 'today', 'tomorrow', 'yesterday', ISO dates
  };
  deleted?: boolean;    // Soft delete flag
  deletedAt?: number;   // Timestamp of deletion
  createdAt?: string;   // ISO 8601 timestamp
  lastActive?: string;  // ISO 8601 timestamp
  settings?: UserSettings;
}
```

### Activity
```typescript
interface Activity {
  id: string;           // Format: `activity_${deviceId}_${timestamp}_${randomId}`
  text: string;         // Display text (required, non-empty)
  icon: string;         // Single emoji character (required)
  completed: boolean;   // Completion status (default: false)
  pinned: boolean;      // Pin status (default: false)
  deleted?: boolean;    // Soft delete flag
  deletedAt?: number;   // Timestamp of deletion
  lastModified?: number; // Unix timestamp for sync conflict resolution
  
  // Completion tracking fields (for sync conflict resolution)
  completedAt?: number;    // Unix timestamp when marked complete
  completedBy?: string;    // Device ID that marked complete
  uncompletedAt?: number;  // Unix timestamp when marked incomplete
  uncompletedBy?: string;  // Device ID that marked incomplete
  
  // Optional fields
  description?: string; // Extended description
  order?: number;       // Display order
  
  // DEPRECATED - for backward compatibility only
  title?: string;       // Use 'text' instead
  emoji?: string;       // Use 'icon' instead
  name?: string;        // Use 'text' instead
}
```

### Day
```typescript
interface Day {
  activities: Activity[];  // Array of activities for this day
  lastModified?: number;   // Unix timestamp
}
```

### UserSettings
```typescript
interface UserSettings {
  theme?: string;              // Theme identifier
  taskCelebration?: string;    // Celebration animation type
  routineCelebration?: string; // Routine celebration type
  soundEnabled?: boolean;      // Sound effects enabled
  displayMode?: string;        // Display mode preference
  bannerPosition?: string;     // Banner position preference
}
```

### AppState
```typescript
interface AppState {
  // User Management
  users: { [userId: string]: User };  // All users keyed by ID
  currentUser: string;                // Current user ID (required)
  currentDay: string;                  // Active day key (default: 'today')
  
  // Top-level Activities (for current user/day)
  activities: Activity[];              // Denormalized for performance
  
  // UI Settings
  currentTheme: string;                // Active theme
  displayMode: string;                 // Display mode
  bannerPosition: string;              // Banner position
  soundEnabled: boolean;               // Sound effects
  taskCelebration: string;             // Task celebration type
  routineCelebration: string;          // Routine celebration type
  
  // Activity Library
  library?: { categories: ActivityCategory[], userAddedActivityIds: string[] };
  libraryTemplates?: ActivityTemplate[];
  templates?: Template[];
  
  // Sync State
  syncPhrase?: string;                 // 32-char hex sync identifier
  lastSyncTime?: number;               // Unix timestamp
  
  // App Metadata
  version?: number;                    // Data structure version
  lastModified?: number;               // Unix timestamp
  hasCompletedOnboarding?: boolean;   // Onboarding complete flag
}
```

### ActivityCategory
```typescript
interface ActivityCategory {
  id: string;                     // Unique identifier
  name: string;                   // Category name
  icon: string;                   // Category emoji
  activities: LibraryActivity[];  // Activities in this category
  order?: number;                 // Display order
}
```

### LibraryActivity
```typescript
interface LibraryActivity {
  id: string;           // Unique identifier
  text: string;         // Display text
  icon: string;         // Emoji icon
  description?: string; // Optional description
}
```

## ID Generation Rules

### User IDs
- Format: `user_${timestamp}_${index}_${randomId}`
- `timestamp`: Date.now() when created
- `index`: Sequential index for batch creation
- `randomId`: 9-character random string from Math.random().toString(36).substr(2, 9)
- Example: `user_1736879400000_0_x3k9m2n7p`

### Activity IDs
- Format: `activity_${deviceId}_${timestamp}_${randomId}`
- `deviceId`: Unique device identifier (generated once per device)
- `timestamp`: Date.now() when created
- `randomId`: 9-character random string
- Example: `activity_device1_1736879400000_a9k3m2n7p`

## Field Normalization Rules

### Required Field Mapping
When importing or syncing data, normalize fields as follows:

1. **User fields**:
   - `emoji` → `icon` (preferred field)
   - Fields are cleaned - no `undefined` values preserved
   - Clean object created with only valid fields
   
2. **Activity fields**:
   - `name` → `text` (preferred field)
   - `title` → `text` (preferred field)
   - `emoji` → `icon` (preferred field)
   - Deprecated fields are completely removed (not set to undefined)
   - Clean objects created to prevent validation issues

### Default Values
- `User.icon`: '👤' if missing
- `User.name`: 'User' if missing
- `Activity.icon`: '📌' if missing
- `Activity.completed`: false if missing
- `Activity.completedAt`: not set when completed is false
- `Activity.completedBy`: not set when completed is false
- `Activity.uncompletedAt`: not set when completed is true
- `Activity.uncompletedBy`: not set when completed is true
- `Activity.pinned`: false if missing
- `Day.activities`: [] if missing

## Validation Rules

### Required Fields
The following fields MUST be present and valid:
1. `AppState.users` - must be an object (can be empty)
2. `AppState.currentUser` - must reference a valid, non-deleted user
3. For non-deleted users:
   - `User.name` - must be non-empty string
   - `User.icon` OR `User.emoji` - at least one must exist (emoji accepted for backwards compatibility)
   - `User.days` - must be an object
4. For activities:
   - `Activity.id` - must be non-empty string
   - `Activity.text` OR `Activity.name` OR `Activity.title` - at least one must exist
   - `Activity.completed` - must be boolean (defaults to false if missing)
   - `Activity.completedAt` - optional, Unix timestamp when marked complete
   - `Activity.completedBy` - optional, device ID that marked complete
   - `Activity.uncompletedAt` - optional, Unix timestamp when marked incomplete
   - `Activity.uncompletedBy` - optional, device ID that marked incomplete
   - `Activity.pinned` - must be boolean (defaults to false if missing)

### Data Integrity
1. `currentUser` must point to an existing user in `users` object
2. Deleted users (`deleted: true`) cannot be current user
3. Activities in top-level `activities` array must match current user's current day
4. Soft-deleted items should be excluded from UI but preserved for sync

## Sync Data Structure
```typescript
interface SyncData extends AppState {
  deviceId: string;     // Unique device identifier
  syncVersion: number;  // Sync protocol version
  timestamp: number;    // Unix timestamp of sync
}
```

## Import/Export Format
Import/export uses the full `AppState` structure in JSON format with the following requirements:
- Must include `version` field (current: 4)
- Must pass validation before import
- Should normalize fields on import
- Should exclude sensitive data (PIN, encryption keys)

## Version Information
- Version 1: Original format with `emoji` fields
- Version 2: Added user management  
- Version 3: Deprecated (used templates/activityCategories)
- Version 4: **CURRENT** - Library structure, clean IDs, no `activity_` prefix

## Data Repair Process
The sync service includes automatic data repair that:
1. Migrates deprecated fields (`emoji` → `icon`, `name/title` → `text`)
2. Adds missing required fields with sensible defaults
3. Removes redundant fields completely (not set to undefined)
4. Creates clean objects to prevent validation issues
5. Falls back to local state if repair fails to prevent sync loops