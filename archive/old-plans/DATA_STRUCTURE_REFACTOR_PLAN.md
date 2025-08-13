# 🚨 CRITICAL: Data Structure Refactor Plan 🚨

## Pre-Migration Checkpoint
- **Commit Hash**: `0691741`
- **Commit Message**: "Pre-refactor checkpoint: Working sync and data modal fixes"
- **Date**: 2025-08-07
- **Rollback Command**: `git reset --hard 0691741`

## Current Problems to Fix

### 1. Activity Library Bug
- **Symptom**: Shows 28 activities when empty, 29 when adding 1
- **Root Cause**: DEFAULT_CATEGORIES in ActivityLibrary.js contains 28 pre-defined activities
- **Location**: `/src/components/ActivityLibrary/ActivityLibrary.js` lines 53-104

### 2. Data Structure Confusion
- **`activities` field**: Used for Activity Library templates (confusing name!)
- **`templates` field**: Legacy/unused object
- **`activityCategories`**: The actual Activity Library data
- **User activities**: Stored in `users[userId].days.today.activities`
- **Sync Issue**: Line 760 in syncService.js: `templates: state.activities` - mixing templates with activities

### 3. Sync Service Problems
- Line 760: Incorrectly maps `state.activities` to templates
- Line 826: Restores templates back to activities creating feedback loop
- User day activities getting mixed into library templates

## New Data Structure (Target)

```javascript
{
  // User data - clear separation
  users: {
    [userId]: {
      id, name, icon,
      activities: {
        today: [...],     // User's actual daily activities
        tomorrow: [...],
      },
      settings: {...}
    }
  },
  
  // Activity Library - completely separate
  library: {
    categories: [
      {
        id: 'my-templates',
        name: 'My Templates',
        activities: [],  // Start empty, user adds their own
        isDefault: false
      }
    ],
    userAddedActivityIds: [] // Track which activities user explicitly added
  },
  
  // Global settings
  settings: {
    currentTheme, soundEnabled, bannerPosition,
    taskCelebration, routineCelebration,
    toolbarOrder, moreButtonPosition
  },
  
  // App state
  app: {
    currentUser, currentDay, 
    hasCompletedOnboarding, displayMode
  }
}
```

## Files That MUST Be Updated

### Core State Management
1. **`/src/stores/useAppStore.js`** - PRIMARY CHANGES
   - Rename `activities` → `libraryTemplates` 
   - Create new `library` object structure
   - Update ALL setter functions
   - Add migration logic for existing users

2. **`/App.js`** - EXTENSIVE CHANGES (800+ lines)
   - Update all references to activities/templates
   - Fix import/export logic
   - Update activity management functions
   - Fix addActivityToLibrary function

### Sync System
3. **`/src/services/sync/syncService.js`**
   - Fix line 760: Don't map activities to templates
   - Fix line 826: Proper restoration logic
   - Update getCurrentState() method
   - Update restoreData() method

4. **`/src/services/sync/changeTracker.js`**
   - Update tracking for new structure

5. **`/src/services/sync/conflictResolver.js`**
   - Update conflict resolution for new fields

### Import/Export
6. **`/src/components/Modals/DataModal/DataModal.js`**
   - Update export logic (lines 298-314)
   - Update import logic
   - Fix activity count display (lines 1240-1242)
   - Update all field references

### Activity Components
7. **`/src/components/ActivityLibrary/ActivityLibrary.js`**
   - Remove DEFAULT_CATEGORIES or make optional
   - Update to use new library structure
   - Fix activity counting

8. **`/src/components/Modals/ActivityManagementModal/ActivityManagementModal.js`**
   - Update all references to new structure

9. **`/src/components/Modals/ActivityManagementModal/LibraryTabContent.js`**
   - Update to use new library structure

### Other Components
10. **`/src/components/Modals/SyncPreviewModal/SyncPreviewModal.js`**
11. **`/src/components/ConflictResolutionModal/ConflictResolutionModal.js`**
12. **`/src/hooks/useSyncOnChange.js`**

## Migration Strategy

### Phase 1: Update Store Structure
1. Create new fields in useAppStore.js
2. Add migration function for existing data
3. Keep backward compatibility temporarily

### Phase 2: Update All Components
1. Start with ActivityLibrary - fix the 28 count bug
2. Update DataModal export/import
3. Update sync services
4. Update all UI components

### Phase 3: Data Migration
1. Create migration for existing users
2. Version 3 → Version 4 export format
3. Test with real user data

### Phase 4: Cleanup
1. Remove old fields
2. Remove backward compatibility code
3. Update tests and documentation

## Critical Testing Points

1. **Activity Library**: Should start with 0 activities, not 28
2. **Add to Library**: Should increment by 1
3. **Export/Import**: Should maintain separation
4. **Sync**: Should not mix user activities with templates
5. **Migration**: Existing users should not lose data

## Platform-Specific Considerations

- **Web**: Uses localStorage and indexedDB
- **iOS/Android**: Uses AsyncStorage
- **All platforms**: Share same data structure via Zustand

## Rollback Plan

If anything breaks:
```bash
git reset --hard 0691741
```

## Post-Compact Focus Points

After `/compact`, focus on:

1. **Start with useAppStore.js** - This is the foundation
2. **Fix the immediate bug first** - Activity Library showing 28
3. **Test after each major change** - Don't do everything at once
4. **Watch for platform-specific code** - Some iOS-specific styling exists
5. **Preserve user data** - Migration MUST not lose any data

## Success Criteria

- [ ] Activity Library starts at 0, not 28
- [ ] Adding 1 activity shows count of 1
- [ ] User daily activities stay separate from library
- [ ] Sync works without mixing data
- [ ] Export/import maintains structure
- [ ] No data loss for existing users
- [ ] All platforms work (iOS, Android, Web)

## Final Note

This is a MAJOR refactor touching every core system. Take it slow, test thoroughly, and use the rollback if needed. The key insight is that `activities` in the store is actually for templates, not user activities - this naming confusion is the root of many bugs.