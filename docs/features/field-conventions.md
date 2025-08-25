# Field Naming Conventions - Critical Information for AI Assistants

## ⚠️ CRITICAL: Always Use These Field Names

### For Activities:
- **USE**: `text` for the activity's display text
- **DO NOT USE**: `name` or `title` (historical, deprecated)
- **USE**: `icon` for the activity's emoji
- **DO NOT USE**: `emoji` (historical, deprecated)

### For Users:
- **USE**: `icon` for the user's avatar emoji
- **DO NOT USE**: `emoji` (historical, deprecated)
- **ALWAYS**: Store `name` as a string, never as an object

## Field Normalization

The app has a normalization layer (`/src/utils/dataNormalizer.js`) that handles historical field variations. When reading data, always check multiple field names:

```javascript
// CORRECT way to read activity text
const text = activity.text || activity.name || activity.title || 'Untitled';

// CORRECT way to read activity icon
const icon = activity.icon || activity.emoji || '📝';
```

## Common Pitfalls to Avoid

### ❌ DON'T DO THIS:
```javascript
// Creating an activity with wrong fields
{
  name: "Task",      // WRONG - should be 'text'
  emoji: "📝"        // WRONG - should be 'icon'
}

// Reading without fallbacks
const text = activity.text;  // May be undefined!
```

### ✅ DO THIS:
```javascript
// Creating an activity correctly
{
  text: "Task",
  icon: "📝",
  completed: false,
  pinned: false
}

// Reading with fallbacks
const text = activity.text || activity.name || 'Untitled';
```

## Historical Context

The app evolved through different field naming conventions:
1. **Originally**: Used `title` and `emoji`
2. **Migration 1**: Changed to `name` for consistency
3. **Current**: Uses `text` and `icon` as standards

The normalization layer ensures backwards compatibility with all variations.

## Data Structure Examples

### Valid Activity Structure:
```json
{
  "id": "activity-123",
  "text": "Brush teeth",
  "icon": "🦷",
  "completed": false,
  "pinned": true,
  "order": 0,
  "description": "2 minutes",
  "modifiedAt": 1724601600000
}
```

### Timestamp Fields (v2025.08.25+):
- **USE**: `modifiedAt` for activity modification timestamps
- **FALLBACK**: `lastModified` (historical, deprecated)
- **DEFAULT**: `0` if no timestamp present
- **PURPOSE**: Conflict resolution during sync (higher timestamp wins)

### Valid User Structure:
```json
{
  "name": "Atlas",
  "icon": "🌎",
  "days": {
    "today": {
      "activities": []
    }
  }
}
```

## When Working on Sync Issues

1. **Always normalize incoming data** using `normalizeSyncData()`
2. **Check for both field names** when reading (e.g., `icon || emoji`)
3. **Use `text` field** when creating new activities
4. **Remove redundant fields** during normalization
5. **Use proper store update methods** - Never use `useAppStore.setState()` directly
   - User updates: `useUserStore.getState().setUsers()`
   - Settings: `useSettingsStore.getState().updateSettings()`
   - Library: `useLibraryStore.getState().setLibrary()`

## Testing Your Changes

Before deploying, verify:
- [ ] Activities display with correct text and icons
- [ ] No target icon (🎯) appears unexpectedly
- [ ] Import/export works with old data files
- [ ] Sync transfers activities between devices
- [ ] Edit mode shows correct icons

## Related Files
- `/src/utils/dataNormalizer.js` - Central normalization logic
- `/docs/DATA_STRUCTURE.md` - Full documentation