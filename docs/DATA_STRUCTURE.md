# StackMap Data Structure Documentation
**Last Updated:** 2025-08-14
**Version:** 4.0 (Post-Migration)

## Overview

StackMap uses a normalized data structure with clear separation between user-specific data and shared library resources. This document describes the complete data model after the 2025 migration.

## Store Structure

### Root Level Fields

```typescript
interface AppStore {
  // User Management
  users: Record<string, User>;
  currentUser: string | null;
  currentDay: 'today' | 'tomorrow';
  
  // Library (Global)
  libraryTemplates: ActivityTemplate[];
  library: {
    categories: Category[];
    userAddedActivityIds: string[];
  };
  
  // UI Settings
  currentTheme: string;
  bannerPosition: 'top' | 'bottom';
  displayMode: 'cards' | 'list';
  dayMode: 'single' | 'both';
  
  // Feature Flags
  soundEnabled: boolean;
  taskCelebration: string;
  routineCelebration: string;
  hasCompletedOnboarding: boolean;
  hasPinProtection: boolean;
  
  // Other
  userContextData: Record<string, any>;
  toolbarOrder: string[];
  moreButtonPosition: 'left' | 'right';
}
```

### User Object Structure

```typescript
interface User {
  id: string;
  name: string;
  icon: string;  // emoji character
  createdAt: string;  // ISO timestamp
  lastActive: string; // ISO timestamp
  
  days: {
    today: {
      activities: Activity[];
    };
    tomorrow: {
      activities: Activity[];
    };
  };
  
  settings?: {
    theme?: string;  // hex color
    displayMode?: 'cards' | 'list';
    // user-specific settings
  };
  
  currentDay?: 'today' | 'tomorrow';
}
```

### Activity Structure

```typescript
interface Activity {
  id: string;
  text: string;        // Display name
  icon: string;        // Emoji character
  completed: boolean;
  pinned?: boolean;
  deleted?: boolean;
  deletedAt?: number;
  order?: number;
  type?: 'task' | 'routine';
  description?: string;
  isPersonal?: boolean;
  addedToLibrary?: boolean;
}
```

### Library Template Structure

```typescript
interface ActivityTemplate {
  id: string;
  text: string;
  icon: string;
  type?: 'task' | 'routine';
  description?: string;
  categoryId?: string;
}
```

### Category Structure

```typescript
interface Category {
  id: string;
  name: string;
  activities: ActivityTemplate[];
  isCustom?: boolean;
}
```

## Key Concepts

### 1. Activity Scoping
- Activities are **always** scoped to a specific user and day
- Path: `users[userId].days[day].activities`
- Activities are **copied** not referenced when added from library

### 2. Derived State
- Current activities are derived: `users[currentUser]?.days?.[currentDay]?.activities || []`
- No separate `activities` field at root level
- Components compute what they need from the normalized state

### 3. Library vs User Activities
- **Library** (`libraryTemplates` & `library.categories`): Global templates shared across all users
- **User Activities**: Instances of activities specific to a user's day
- Adding from library creates a **copy** in the user's day

### 4. Data Flow Examples

#### Adding Activity from Library
```javascript
// Library template
const template = { id: 't1', text: 'Brush teeth', icon: '🦷' };

// Creates new activity instance
const newActivity = {
  id: generateId(),
  text: template.text,
  icon: template.icon,
  completed: false,
  // ... other fields
};

// Adds to user's day
users[currentUser].days[currentDay].activities.push(newActivity);
```

#### Switching Users
```javascript
// Just change currentUser
setCurrentUser('user-2');
// Activities automatically update via derived state
const activities = users[currentUser]?.days?.[currentDay]?.activities || [];
```

## Import/Export Format

### Export Structure (v4)
```json
{
  "version": 4,
  "exportDate": "2025-01-14T18:45:00.000Z",
  "exportedItems": {
    "users": true,
    "activityCards": true,
    "activityLibrary": true
  },
  "users": {
    "user-id": { /* User object */ }
  },
  "libraryTemplates": [ /* Template array */ ],
  "library": {
    "categories": [ /* Category array */ ]
  },
  "globalSettings": {
    "themeColor": "#2196F3",
    "bannerPosition": "top",
    // ... other settings
  }
}
```

## Migration Notes

### Removed Fields (v3 → v4)
- ❌ `activities` (root level) → Now in `users[id].days[day].activities`
- ❌ `activityCategories` → Now `library.categories`
- ❌ `templates` → Now `libraryTemplates`
- ❌ `setActivities()` → Use `updateUserActivities(userId, day, activities)`
- ❌ `setActivityCategories()` → Use `setLibraryCategories()`
- ❌ `setTemplates()` → Field no longer exists

### Store Methods

```javascript
// Old (removed)
setActivities(activities)
setActivityCategories(categories)
setTemplates(templates)

// New
updateUserActivities(userId, day, activities)
setLibraryTemplates(templates)
setLibraryCategories(categories)
```

## Common Patterns

### Get Current Activities
```javascript
const activities = currentUser && users[currentUser]?.days?.[currentDay]?.activities || [];
```

### Update Activity
```javascript
updateUserActivities(currentUser, currentDay, 
  activities.map(a => a.id === activityId ? { ...a, completed: true } : a)
);
```

### Add Activity
```javascript
const newActivity = {
  id: generateId(),
  text: 'New task',
  icon: '📝',
  completed: false
};
updateUserActivities(currentUser, currentDay, [...activities, newActivity]);
```

### Switch Day
```javascript
setCurrentDay('tomorrow');
// Activities automatically update via derived state
```

## Sync Considerations

- Sync blob includes full store state
- User activities are encrypted with user's sync key
- Library is included in sync (shared across devices)
- Conflict resolution favors most recent changes

## Performance Notes

- Activities are derived on render (minimal overhead)
- No duplicate state to keep in sync
- Cleaner updates with less chance of race conditions
- Zustand's shallow equality checks work efficiently

## Debugging

### Check Store State
```javascript
// In browser console
const state = window.__zustand_store__.getState();

// Verify migration
console.assert(state.activities === undefined, 'Old activities field still exists!');
console.assert(state.activityCategories === undefined, 'Old categories field still exists!');
console.assert(state.templates === undefined, 'Old templates field still exists!');

// Check current structure
console.log('Users:', state.users);
console.log('Library:', state.library);
console.log('Templates:', state.libraryTemplates);
```

### Common Issues

1. **Activities not showing**: Check `currentUser` and `currentDay` are set correctly
2. **Library empty**: Check `library.categories` has data
3. **User switching issues**: Ensure activities are scoped to user/day correctly

## Related Documentation

- [Migration Guide](./MIGRATION_PROMPT_PACK.md)
- [Sync Architecture](./ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md)
- [Field Conventions](../prompts/field-conventions.md)