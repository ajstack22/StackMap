# Data Field Conventions & Standards
*Last Updated: 2025-08-14*

## Overview
This document defines the canonical field names and data structures used throughout StackMap. Due to historical evolution, some fields have had multiple names. This guide clarifies the current standards and migration strategies.

## Critical Field Standards

### Activities

#### Required Fields
- **`text`** (string) - The activity's display text
  - Historical names: `name`, `title`
  - Always use `text` for new code
  - Normalizer handles: `activity.text || activity.name || activity.title`

- **`icon`** (string) - The activity's emoji or icon
  - Historical names: `emoji`
  - Always use `icon` for new code
  - Normalizer handles: `activity.icon || activity.emoji`

- **`id`** (string) - Unique identifier
  - Format: `activity-{timestamp}-{random}` or user-defined

- **`completed`** (boolean) - Completion status
  - Default: `false`

- **`pinned`** (boolean) - Pin status
  - Default: `false`

#### Optional Fields
- **`order`** (number) - Display order
- **`description`** (string) - Additional details
- **`completedAt`** (number) - Unix timestamp of completion
- **`completedBy`** (string) - User ID who completed it

#### Example Structure
```javascript
{
  id: "activity-1234567890-abc123",
  text: "Brush teeth",
  icon: "🦷",
  completed: false,
  pinned: true,
  order: 0,
  description: "2 minutes, top and bottom"
}
```

### Users

#### Required Fields
- **`name`** (string) - User's display name
  - Never stored as object
  - Default: "User"

- **`icon`** (string) - User's emoji avatar
  - Historical names: `emoji`
  - Always use `icon` for new code
  - Default: "👤"

- **`days`** (object) - Activity storage by day
  - Keys: "today", "tomorrow", etc.
  - Values: Day objects with activities array

#### Optional Fields
- **`settings`** (object) - User preferences
- **`createdAt`** (string) - ISO timestamp
- **`lastActive`** (string) - ISO timestamp

#### Example Structure
```javascript
{
  name: "Atlas",
  icon: "🌎",
  days: {
    today: {
      activities: [
        // Activity objects
      ]
    },
    tomorrow: {
      activities: []
    }
  },
  settings: {
    theme: "#2196F3"
  }
}
```

### Export/Import Format

#### Version 3 Structure
```javascript
{
  version: 3,
  exportDate: "2025-01-12T15:00:00.000Z",
  exportedItems: {
    users: true,
    activityCards: true,
    activityLibrary: true
  },
  users: {
    // User objects by ID
  },
  currentUser: "user-id",
  currentDay: "today",
  templates: {
    // Library templates
  },
  globalSettings: {
    currentTheme: "#2196F3",
    bannerPosition: "top",
    soundEnabled: true
  }
}
```

## Field Normalization

### When Normalization Occurs
1. **Import**: When loading export files
2. **Sync**: When receiving remote data
3. **Validation**: During data repair operations

### Normalization Rules

#### Activities
```javascript
// Input variations
{ name: "Task", emoji: "📝" }
{ title: "Task", icon: "📝" }
{ text: "Task", emoji: "📝" }

// Normalized output
{ text: "Task", icon: "📝" }
```

#### Users
```javascript
// Input variations
{ name: "User", emoji: "😀" }
{ name: { text: "User" }, icon: "😀" }

// Normalized output
{ name: "User", icon: "😀" }
```

### Implementation
All normalization is handled by `/src/utils/dataNormalizer.js`:
- `normalizeActivity(activity)` - Normalizes single activity
- `normalizeUser(user)` - Normalizes single user
- `normalizeExportData(data)` - Normalizes full export/import data
- `normalizeSyncData(data)` - Normalizes sync data

## Historical Context

### Why Multiple Field Names Existed

1. **Activities**: Originally used `title`, migrated to `name` for consistency with library, then to `text` to match user mental model

2. **Icons**: Started with `emoji` field, renamed to `icon` for clarity and consistency with other icon usage

3. **Timestamps**: API uses snake_case (`last_modified`), internal uses camelCase (`lastModified`)

### Migration Timeline
- **2024**: Initial implementation with `title` and `emoji`
- **Early 2025**: Partial migration to `name` field
- **2025-08-14**: Full normalization to `text` and `icon`

## Component Usage Guidelines

### Reading Activity Data
```javascript
// CORRECT - Handles all variations
const activityText = activity.text || activity.name || activity.title || 'Untitled';
const activityIcon = activity.icon || activity.emoji || '📝';

// WRONG - Assumes single field name
const activityText = activity.text; // May be undefined!
```

### Creating Activities
```javascript
// CORRECT - Uses standard fields
const newActivity = {
  id: generateId(),
  text: "New task",
  icon: "📝",
  completed: false,
  pinned: false
};

// WRONG - Uses deprecated fields
const newActivity = {
  name: "New task",  // Should be 'text'
  emoji: "📝"        // Should be 'icon'
};
```

### Library Templates
**Note**: Library templates still use `name` field for backwards compatibility with existing template data.

## Validation & Repair

### Validation Rules
1. Activities must have `text` field (or `name`/`title` for repair)
2. Users must have `name` (string) and `icon` fields
3. Boolean fields (`completed`, `pinned`) default to `false`
4. Missing IDs are auto-generated

### Auto-Repair Process
1. Missing `text` → Use `name` or `title` or "Untitled"
2. Missing `icon` → Use `emoji` or default emoji
3. Invalid types → Convert to expected type
4. Redundant fields → Remove after normalization

## Testing Checklist

When modifying data structures:
- [ ] Test import with old export files
- [ ] Test sync between devices
- [ ] Test activity creation/editing
- [ ] Test user creation/editing
- [ ] Verify demo data loads correctly
- [ ] Check field normalization in logs

## Common Issues & Solutions

### Issue: Target icon (🎯) appears instead of correct icon
**Cause**: Component using `emoji` field instead of `icon`
**Solution**: Update to use `activity.icon || activity.emoji`

### Issue: Activity text shows as undefined
**Cause**: Component expecting `name` or `title` field
**Solution**: Update to use `activity.text || activity.name || activity.title`

### Issue: Sync fails validation
**Cause**: Missing required fields or wrong types
**Solution**: Data normalizer will auto-repair during sync

## Related Documentation
- [Sync Architecture](./ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md)
- [Data Structure Refactor Plan](./DATA_STRUCTURE_REFACTOR_PLAN.md)
- [Project Structure](./PROJECT_STRUCTURE.md)