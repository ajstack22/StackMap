# StackMap System Architecture Documentation

## Core Data Flow & Rules

### 1. USER SYSTEM

#### Data Structure
```javascript
user = {
  id: string,           // Unique ID: `user_${timestamp}_${index}`
  name: string,         // User display name
  icon: string,         // Emoji icon (supports complex Unicode)
  days: {
    today: { activities: [] },
    tomorrow: { activities: [] }
  },
  settings: {
    taskCelebration: string,
    routineCelebration: string,
    soundEnabled: boolean,
    theme: string
  },
  createdAt: string,    // ISO timestamp
  lastActive: string    // ISO timestamp
}
```

#### Critical Rules
1. **User IDs are ALWAYS dynamically generated** - No static IDs
2. **Never use string manipulation on emoji fields** - It damages complex Unicode sequences
3. **Default user name is context-dependent:**
   - Onboarding skip: "My Activities"
   - Failed validation: "User"
4. **Multiple users with same name are allowed** - IDs differentiate them

#### Emoji Handling
- **Problem**: Complex emojis (🦍, ⛑️) contain multiple Unicode code points
- **Solution**: Never use string manipulation methods (trim(), slice(), etc.) on emoji
- **Validation**: Check `typeof icon === 'string' && icon.length > 0`
- **Fallback**: Use '👤' only when icon is truly invalid

### 2. STORAGE SYSTEM (Modular Zustand Stores + AsyncStorage)

#### Store Architecture (As of August 2025)
The app uses 4 focused Zustand stores with a compatibility wrapper:

1. **useUserStore** - User management, activities, current user/day
2. **useSettingsStore** - Themes, display settings, celebrations  
3. **useLibraryStore** - Activity templates and categories
4. **useSyncStore** - Sync configuration and status
5. **useAppStore** - Compatibility wrapper (delegates to sub-stores)

**⚠️ CRITICAL:** Never use `useAppStore.setState()` - it doesn't update underlying stores properly. Use store-specific methods:
- User updates: `useUserStore.getState().setUsers()`
- Settings: `useSettingsStore.getState().updateSettings()`
- Library: `useLibraryStore.getState().setLibrary()`

For complete store architecture details, see `/docs/STORE_ARCHITECTURE.md`

#### Persistence Rules
1. **Each store persists to AsyncStorage with debounced writes**
2. **Storage keys**: 'user-storage', 'settings-storage', 'library-storage', 'sync-storage'
3. **Hydration happens on app launch** - ~100ms delay
4. **Reset MUST clear ALL AsyncStorage keys** using `getAllKeys()` + `multiRemove()`

#### Race Condition Prevention
- Use `isInitializing` flag to prevent duplicate initialization
- Reset `hasCompletedOnboarding` FIRST during reset
- Check for bad states (hasCompletedOnboarding=true but no users)

### 3. EXPORT SYSTEM

#### Export Structure (v4)
```javascript
{
  version: 4,
  exportDate: ISO_string,
  exportedItems: {
    users: boolean,
    activityCards: boolean,
    activityLibrary: boolean
  },
  users: {},           // All user objects
  currentUser: string, // CRITICAL: Must be included!
  currentDay: string,
  activityCards: [],   // Flattened activities
  library: {           // Library structure
    categories: [],
    userAddedActivityIds: []
  },
  libraryTemplates: [], // Template activities
  globalSettings: {
    currentTheme: string,
    bannerPosition: string,
    defaultView: string,
    displayMode: string,
    enableDayManagement: boolean,
    pinEnabled: boolean
  }
}
```

#### Export Rules
1. **ALWAYS include currentUser field** - Prevents "User" display bug
2. **Export to Downloads folder on Android**
3. **Use share sheet on iOS**
4. **File naming**: `stackmap-export-YYYY-MM-DD-HH-mm-ss.json`

### 4. IMPORT SYSTEM

#### Import Flow
1. **File Discovery**: Search Downloads, Documents, External directories
2. **Validation**: Check version, required fields
3. **Migration**: Run migrateDataStructure() for older versions
4. **User Handling**: 
   - Import preserves original user IDs
   - currentUser field determines active user
   - Falls back to first user if currentUser missing

#### Import Rules
1. **Clear existing data before import** (optional user choice)
2. **Validate all emoji fields** - Don't use string manipulation
3. **Show import summary** with user count, activities, PIN status
4. **Handle missing currentUser**: Use first user as fallback

### 5. ONBOARDING SYSTEM

#### Onboarding States
1. **Fresh Start**: Create new user with starter activities
2. **Import**: Load from export file, skip user creation
3. **Sync**: Connect to sync service, skip user creation
4. **Skip**: Create minimal "My Activities" user

#### Onboarding Rules
1. **Never create default users during onboarding**
2. **Import/Sync should skip user creation step**
3. **hasCompletedOnboarding controls wizard display**
4. **Reset MUST set hasCompletedOnboarding=false**

### 6. SYNC SYSTEM

#### Sync Architecture
- **Zero-knowledge encryption** using recovery phrase
- **32-character hexadecimal phrase** (no spaces)
- **Sync URL**: `stackmap.app/?sync=recovery_phrase`
- **Auto-preview on URL access**

#### Sync Rules
1. **Disable sync BEFORE reset** to prevent syncing empty state
2. **Validate synced data** - auto-repair missing fields
3. **Clear local data before importing synced data**
4. **Use panel-based modal design** (no footer buttons)

## Common Issues & Solutions

### Issue 1: Complex Emojis Become 👤
**Cause**: String manipulation methods damage Unicode sequences
**Solution**: Never use string manipulation on emoji fields, check `icon.length > 0`

### Issue 2: Username Shows as "User" After Import
**Cause**: Missing `currentUser` field in export
**Solution**: Always export `currentUser` field

### Issue 3: Multiple "My Activities" Users Created
**Cause**: Race condition during initialization
**Solution**: Use `isInitializing` flag, fix bad states

### Issue 4: Reset Doesn't Clear Data
**Cause**: Zustand persistence not fully cleared
**Solution**: Use `getAllKeys()` + `multiRemove()` to clear everything

### Issue 5: App Exits Onboarding After Restart
**Cause**: `hasCompletedOnboarding` persists incorrectly
**Solution**: Reset this flag FIRST, detect bad states

## Testing Checklist

### User Management
- [ ] Create user with complex emoji (🦍, ⛑️, 👨‍👩‍👧‍👦)
- [ ] Edit user with complex emoji
- [ ] Switch between multiple users
- [ ] Delete user (when multiple exist)

### Export/Import
- [ ] Export includes currentUser field
- [ ] Import shows correct username (not "User")
- [ ] Import summary displays
- [ ] Import during onboarding skips user creation

### Reset
- [ ] Reset clears ALL data
- [ ] Onboarding shows after reset
- [ ] Onboarding persists after app restart
- [ ] No duplicate users created

### Sync
- [ ] Sync URL auto-previews data
- [ ] Sync import clears local data first
- [ ] Recovery phrase validation works
- [ ] Sync disable before reset

## Implementation Priorities

1. **CRITICAL**: Fix emoji validation (remove .trim())
2. **HIGH**: Ensure currentUser in exports
3. **HIGH**: Prevent race conditions with isInitializing
4. **MEDIUM**: Improve error handling and logging
5. **LOW**: Add data integrity checks

## Code Quality Standards

1. **Never trust persisted state** - Always validate
2. **Log all critical operations** - Helps debugging
3. **Handle Unicode properly** - No string manipulation on emoji
4. **Prevent race conditions** - Use flags and state checks
5. **Clear data completely** - Don't leave partial state

## Migration Path

When making breaking changes:
1. Increment export version
2. Add migration logic to migrateDataStructure()
3. Test with exports from previous versions
4. Document migration in changelog

## Future Improvements

1. **Add data integrity checks** on import/export
2. **Implement backup rotation** (keep last 3 exports)
3. **Add export encryption** option
4. **Improve sync conflict resolution**
5. **Add telemetry for debugging** (with user consent)