# Store Architecture Documentation

## Overview
As of August 15, 2025, the StackMap store architecture has been refactored from a monolithic Zustand store into focused, modular stores with a compatibility wrapper.

## Store Structure

### Core Stores

#### 1. useUserStore (`/src/stores/useUserStore.js`)
**Responsibilities:**
- User management (CRUD operations)
- User activities by day
- Current user selection
- Current day tracking

**Key State:**
```javascript
{
  users: {},           // All users and their data
  currentUser: null,   // Selected user ID
  currentDay: 'today', // 'today' or 'tomorrow'
  userContextData: {}  // Additional user context
}
```

**Key Actions:**
- `addUser(userId, userData)`
- `updateUser(userId, updates)`
- `deleteUser(userId)`
- `setCurrentUser(userId)`
- `setCurrentDay(day)`

#### 2. useSettingsStore (`/src/stores/useSettingsStore.js`)
**Responsibilities:**
- Theme management
- Display settings
- Celebration settings
- Toolbar configuration
- Onboarding state

**Key State:**
```javascript
{
  currentTheme: 'stackBlue',
  bannerPosition: 'top',
  soundEnabled: true,
  taskCelebration: 'rainbow',
  routineCelebration: 'rainbow',
  displayMode: 'numbers',
  dayMode: 'today',
  hasCompletedOnboarding: false,
  toolbarOrder: null,
  moreButtonPosition: 'left'
}
```

**Key Actions:**
- `setCurrentTheme(theme)`
- `setBannerPosition(position)`
- `setSoundEnabled(enabled)`
- `updateSettings(settings)` - Batch update

#### 3. useLibraryStore (`/src/stores/useLibraryStore.js`)
**Responsibilities:**
- Activity templates
- Library categories
- User-added activities

**Key State:**
```javascript
{
  libraryTemplates: [],
  library: {
    categories: null,
    userAddedActivityIds: []
  }
}
```

**Key Actions:**
- `setLibraryTemplates(templates)`
- `addTemplate(template)`
- `updateTemplate(templateId, updates)`
- `deleteTemplate(templateId)`

#### 4. useSyncStore (`/src/stores/useSyncStore.js`)
**Responsibilities:**
- Sync configuration
- Sync status tracking
- Sync error handling

**Key State:**
```javascript
{
  syncEnabled: false,
  syncStatus: 'idle',
  syncId: null,
  lastSync: null,
  syncError: null
}
```

**Key Actions:**
- `setSyncEnabled(enabled)`
- `setSyncStatus(status)`
- `setSyncId(id)`
- `updateSyncState(updates)`

### Compatibility Wrapper

#### useAppStore (`/src/stores/useAppStore.js`)
A thin wrapper that maintains backwards compatibility by combining all stores.

**⚠️ CRITICAL WARNING:**
`useAppStore.setState()` does NOT properly update the underlying specialized stores. This can cause state updates to be lost or not trigger proper re-renders.

**Implementation Pattern:**
```javascript
// Uses getters to delegate to sub-stores
get currentTheme() { 
  return useSettingsStore.getState().currentTheme; 
}

// Actions delegate to appropriate store
setCurrentTheme: (theme) => {
  useSettingsStore.getState().setCurrentTheme(theme)
}
```

**Special Methods:**
- `setState(updates)` - ⚠️ DEPRECATED - Does not properly update underlying stores
- `getState()` - Returns combined state from all stores
- `subscribe(callback)` - Subscribes to all store changes

**Correct Update Pattern:**
```javascript
// ❌ WRONG - Won't properly update underlying stores
useAppStore.setState({ users: updatedUsers });

// ✅ CORRECT - Updates the specialized store directly
useUserStore.getState().setUsers(updatedUsers);
```

## Storage Persistence

All stores use AsyncStorage with debounced writes:

```javascript
const storage = {
  setItem: async (name, value) => {
    pendingWrite = { name, value };
    
    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
    }
    
    // Debounce writes by 1 second
    storageWriteTimer = setTimeout(async () => {
      await AsyncStorage.setItem(pendingWrite.name, JSON.stringify(pendingWrite.value));
    }, 1000);
  }
};
```

**Storage Keys:**
- `stackmap-user-storage` - User store data
- `stackmap-settings-storage` - Settings store data
- `stackmap-library-storage` - Library store data
- `stackmap-sync-storage` - Sync store data

## Migration Guide

### Old Pattern (Monolithic Store)
```javascript
import { useAppStore } from './stores';

const MyComponent = () => {
  const { currentTheme, setCurrentTheme, users } = useAppStore();
  // ...
};
```

### New Pattern (Direct Store Access)
```javascript
import { useSettingsStore, useUserStore } from './stores';

const MyComponent = () => {
  const { currentTheme, setCurrentTheme } = useSettingsStore();
  const { users } = useUserStore();
  // ...
};
```

### Using the Compatibility Wrapper
```javascript
import { useAppStore } from './stores';

const MyComponent = () => {
  // Still works but may have reactivity issues with getters
  const { currentTheme, setCurrentTheme } = useAppStore();
  // ...
};
```

## Known Issues

### 1. Getter Reactivity
The wrapper store uses getters which may not trigger React re-renders:

```javascript
// Problematic - getter might not trigger re-render
const { currentTheme } = useAppStore();

// Better - use selector pattern
const currentTheme = useAppStore(state => state.currentTheme);

// Best - use specific store directly
const { currentTheme } = useSettingsStore();
```

### 2. Async Storage Debouncing
The 1-second debounce on storage writes means:
- Changes aren't immediately persisted
- Rapid changes might be lost if app closes
- Last change wins within the debounce window

### 3. Cross-Store Updates
When updating related data across stores, order matters:

```javascript
// Update user first, then settings
useUserStore.getState().setCurrentUser('user_2');
useSettingsStore.getState().setCurrentTheme('crimson');
```

## Best Practices

1. **Use specific stores directly** when possible for better reactivity
2. **Use selectors** for specific state slices to optimize re-renders
3. **Never use `useAppStore.setState()`** - always use store-specific methods
4. **Handle store subscriptions** explicitly for complex components
5. **Test persistence** by checking AsyncStorage after updates
6. **When syncing data**, always use proper store methods:
   ```javascript
   // User data
   useUserStore.getState().setUsers(syncedUsers);
   
   // Settings
   useSettingsStore.getState().updateSettings(syncedSettings);
   
   // Library
   useLibraryStore.getState().setLibrary(syncedLibrary);
   ```

## Debugging

### Check Store State
```javascript
// In browser console
useSettingsStore.getState() // Check settings
useUserStore.getState()     // Check users
useAppStore.getState()       // Check combined state
```

### Monitor Store Updates
```javascript
// Subscribe to store changes
const unsubscribe = useSettingsStore.subscribe(
  state => console.log('Settings updated:', state)
);
```

### Verify Persistence
```javascript
// Check AsyncStorage
AsyncStorage.getItem('stackmap-settings-storage').then(console.log);
```

## Future Improvements

1. **Remove wrapper store** once all components migrated
2. **Add TypeScript definitions** for all stores
3. **Implement store middleware** for logging/debugging
4. **Consider Redux DevTools** integration
5. **Add store persistence encryption** for sensitive data