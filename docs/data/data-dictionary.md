# Data Dictionary

## Overview
This document defines the canonical data structure for StackMap. All services MUST conform to these definitions.

## Core Data Types

### User
```typescript
interface User {
  // Note: User ID is stored as the object key, not within the User object
  name: string;         // Display name (required, non-empty)
  icon: string;         // Single emoji character (required)
  days: Record<string, Day>;  // Keys: 'today', 'tomorrow', 'yesterday', ISO dates
  settings?: UserSettings;
  lastModified?: number; // Unix timestamp for sync
  version?: number;      // Data structure version
  
  // Note: The following fields may exist in sync/import data but are not in TypeScript:
  // deleted?: boolean;    // Soft delete flag (handled externally)
  // deletedAt?: number;   // Timestamp of deletion
  // createdAt?: string;   // ISO 8601 timestamp  
  // lastActive?: string;  // ISO 8601 timestamp
}
```

### Activity
```typescript
interface Activity {
  id: string;           // Format: `activity_${deviceId}_${timestamp}_${randomId}`
  text: string;         // Display text (required, non-empty) - normalized from 'name' or 'title'
  icon: string;         // Single emoji character (required)
  completed: boolean;   // Completion status (default: false)
  pinned: boolean;      // Pin status (default: false)
  completedAt?: number; // Unix timestamp when marked complete
  completedBy?: string; // Device ID that marked complete
  description?: string; // Extended description
  category?: string;    // Category identifier
  order?: number;       // Display order
  
  // Note: The following fields may exist in sync/import data but are not in TypeScript:
  // deleted?: boolean;      // Soft delete flag
  // deletedAt?: number;     // Timestamp of deletion
  // lastModified?: number;  // Unix timestamp for sync conflict resolution
  // uncompletedAt?: number; // Unix timestamp when marked incomplete  
  // uncompletedBy?: string; // Device ID that marked incomplete
  
  // DEPRECATED - for backward compatibility in imports only
  // title?: string;       // Use 'text' instead
  // emoji?: string;       // Use 'icon' instead
  // name?: string;        // Use 'text' instead
}
```

### Day
```typescript
interface Day {
  activities: Activity[];  // Array of activities for this day
  date?: string;           // ISO date string
  lastModified?: number;   // Unix timestamp
}
```

### UserSettings
```typescript
interface UserSettings {
  theme?: string;                              // Theme identifier
  soundEnabled?: boolean;                      // Sound effects enabled
  bannerPosition?: 'top' | 'bottom';          // Banner position preference
  displayMode?: 'numbers' | 'dots';           // Display mode preference
  taskCelebration?: CelebrationType;          // Task celebration animation
  routineCelebration?: CelebrationType;       // Routine celebration animation
}

// CelebrationType = 'none' | 'confetti' | 'subtle' | 'bounce' | 'sparkle'
```

### AppState
```typescript
interface AppState {
  // User Management
  users: Record<string, User>;        // All users keyed by ID
  currentUser: string | null;         // Current user ID or null
  currentDay: 'today' | 'tomorrow';   // Active day key
  currentTheme: ThemeName;             // Active theme
  syncEnabled: boolean;                // Sync feature enabled
  syncId: string | null;               // Sync identifier
  hasCompletedOnboarding: boolean;    // Onboarding complete flag
  userContextData: any;                // Legacy field
  
  // Note: The following fields exist in stores but not in TypeScript AppState:
  // activities: Activity[];           // Top-level activities (denormalized)
  // displayMode: string;              // In user settings instead
  // bannerPosition: string;           // In user settings instead
  // soundEnabled: boolean;            // In user settings instead
  // taskCelebration: string;          // In user settings instead
  // routineCelebration: string;       // In user settings instead
  // library?: { categories: LibraryCategory[], userAddedActivityIds: string[] };
  // syncPhrase?: string;              // Uses syncId instead
  // lastSyncTime?: number;
  // version?: number;
  // lastModified?: number;
}
```

### LibraryCategory
```typescript
interface LibraryCategory {  // Note: Renamed from ActivityCategory
  id: string;                     // Unique identifier
  name: string;                   // Category name
  icon: string;                   // Category emoji
  activities: LibraryActivity[];  // Activities in this category
  order?: number;                 // Display order
  isDefault?: boolean;            // Default category flag
}
```

### LibraryActivity
```typescript
interface LibraryActivity {
  id: string;           // Unique identifier
  text: string;         // Display text - normalized from 'name'
  icon: string;         // Emoji icon
  description?: string; // Optional description
  category?: string;    // Category identifier
  tags?: string[];      // Tag list for search/filter
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
interface SyncData {
  users: Record<string, User>; // User data
  timestamp: number;            // Unix timestamp of sync
  version: string;              // Version string
  deviceId?: string;            // Unique device identifier
  metadata?: SyncMetadata;      // Additional sync metadata
}

interface SyncMetadata {
  lastSyncAt?: number;          // Last sync timestamp
  deviceCount?: number;         // Number of devices synced
  conflictResolution?: 'local' | 'remote' | 'merge'; // Conflict strategy
}
```

## Import/Export Format
```typescript
interface ExportData {
  version: string;                     // Version identifier
  exportDate: string;                  // ISO date of export
  users: Record<string, User>;         // All user data
  settings?: AppSettings;              // App-level settings
  library?: LibraryCategory[];         // Activity library
}
```

Requirements:
- Must include `version` field
- Must pass validation before import
- Fields are normalized on import (emoji→icon, name→text)
- Sensitive data excluded (encryption keys, sync phrases)

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