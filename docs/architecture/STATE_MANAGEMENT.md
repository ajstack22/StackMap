# StackMap State Management Architecture
*Claude-readable technical specification - Last updated: 2025-08-14*

## State Management System
**Primary**: Zustand v4 with AsyncStorage persistence
**Pattern**: Single centralized store with slices
**Location**: `/src/stores/useAppStore.js`

## Store Structure

### Complete State Shape
```javascript
{
  // User Management
  users: {
    [userId]: {
      id: string,
      name: string,
      icon: string,
      days: {
        today: { activities: Activity[] },
        tomorrow: { activities: Activity[] }
      },
      settings: {
        taskCelebration: string,
        routineCelebration: string,
        soundEnabled: boolean,
        theme: string
      },
      createdAt: string,
      lastActive: string
    }
  },
  currentUser: string,  // Active user ID
  
  // Library System
  library: {
    categories: {
      [categoryName]: {
        activities: Activity[],
        isExpanded: boolean
      }
    },
    userAddedActivityIds: string[]
  },
  libraryTemplates: Activity[],  // Flattened templates
  
  // Global Settings
  currentTheme: 'stackBlue' | 'stackPurple' | 'stackOrange' | 'stackPink' | 'stackGreen',
  bannerPosition: 'top' | 'bottom',
  displayMode: 'numbers' | 'dots',
  defaultView: 'all' | 'tasks' | 'routines',
  enableDayManagement: boolean,
  pinEnabled: boolean,
  
  // Sync Configuration
  syncEnabled: boolean,
  syncKey: string,  // 32-char hex
  lastSyncTime: string,
  syncConflictResolution: 'local' | 'remote' | 'merge',
  syncHistory: SyncEvent[],
  
  // UI State (non-persisted)
  hasCompletedOnboarding: boolean,
  isInitializing: boolean,
  syncStatus: 'idle' | 'syncing' | 'error',
  toastMessage: string,
  
  // Migration tracking
  dataVersion: number,
  lastMigration: string
}
```

## Store Actions

### User Management Actions
```javascript
// User CRUD
addUser: (userData) => void
updateUser: (userId, updates) => void
deleteUser: (userId) => void
setCurrentUser: (userId) => void
switchUser: (userId) => void

// Activity Management
addActivity: (userId, day, activity) => void
updateActivity: (userId, day, activityId, updates) => void
deleteActivity: (userId, day, activityId) => void
toggleActivityComplete: (userId, day, activityId) => void
reorderActivities: (userId, day, activities) => void
moveActivity: (userId, fromDay, toDay, activityId) => void

// Bulk Operations
clearUserActivities: (userId, day) => void
copyActivitiesToNextDay: (userId) => void
importUserData: (userData) => void
```

### Settings Actions
```javascript
// Theme and Display
setTheme: (theme) => void
setBannerPosition: (position) => void
setDisplayMode: (mode) => void
setDefaultView: (view) => void

// Features
toggleDayManagement: (enabled) => void
togglePin: (enabled) => void
setPin: (pin) => void

// Celebrations
setTaskCelebration: (emoji) => void
setRoutineCelebration: (emoji) => void
toggleSound: (enabled) => void
```

### Library Actions
```javascript
// Category Management
addCategory: (categoryName, activities) => void
deleteCategory: (categoryName) => void
toggleCategoryExpanded: (categoryName) => void

// Template Management
addTemplate: (template) => void
updateTemplate: (templateId, updates) => void
deleteTemplate: (templateId) => void
addActivityFromTemplate: (templateId, userId, day) => void
```

### Sync Actions
```javascript
// Configuration
enableSync: (recoveryPhrase) => void
disableSync: () => void
updateSyncKey: (key) => void

// Operations
setSyncStatus: (status) => void
updateLastSyncTime: (timestamp) => void
addSyncHistoryEvent: (event) => void
resolveConflict: (resolution) => void
```

### System Actions
```javascript
// Initialization
initialize: () => Promise<void>
hydrate: () => Promise<void>
reset: () => Promise<void>

// Persistence
persist: () => Promise<void>
clearStorage: () => Promise<void>

// Migration
migrateData: (fromVersion) => void
setDataVersion: (version) => void
```

## Persistence Layer

### AsyncStorage Configuration
```javascript
// Storage adapter with debouncing
const storage = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return JSON.parse(value);
  },
  setItem: async (name, value) => {
    // CRITICAL: 1-second debounce for iOS performance
    clearTimeout(storageWriteTimer);
    storageWriteTimer = setTimeout(async () => {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    }, 1000);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  }
};
```

### Persisted vs Transient State
```javascript
// Persisted (survives app restart)
persisted: [
  'users',
  'currentUser',
  'library',
  'libraryTemplates',
  'currentTheme',
  'bannerPosition',
  'displayMode',
  'defaultView',
  'enableDayManagement',
  'pinEnabled',
  'syncEnabled',
  'syncKey',
  'lastSyncTime',
  'hasCompletedOnboarding'
]

// Transient (reset on app restart)
transient: [
  'isInitializing',
  'syncStatus',
  'toastMessage',
  'modalStates',
  'loadingStates'
]
```

## State Update Patterns

### Direct Updates
```javascript
// Simple state update
setCurrentUser: (userId) => set({ currentUser: userId })

// Nested update with spread
updateUser: (userId, updates) => set(state => ({
  users: {
    ...state.users,
    [userId]: {
      ...state.users[userId],
      ...updates
    }
  }
}))
```

### Computed Updates
```javascript
// Update with computation
toggleActivityComplete: (userId, day, activityId) => set(state => {
  const activities = state.users[userId].days[day].activities;
  const activity = activities.find(a => a.id === activityId);
  
  return {
    users: {
      ...state.users,
      [userId]: {
        ...state.users[userId],
        days: {
          ...state.users[userId].days,
          [day]: {
            activities: activities.map(a =>
              a.id === activityId
                ? { ...a, completed: !a.completed }
                : a
            )
          }
        }
      }
    }
  };
})
```

### Batch Updates
```javascript
// Multiple state changes in one update
importData: (data) => set(state => ({
  users: data.users,
  currentUser: data.currentUser,
  library: data.library,
  currentTheme: data.globalSettings.currentTheme,
  hasCompletedOnboarding: true
}))
```

## State Access Patterns

### Component Usage
```javascript
// Selective subscription
const MyComponent = () => {
  // Only re-renders when these specific values change
  const currentUser = useAppStore(state => state.currentUser);
  const theme = useAppStore(state => state.currentTheme);
  const updateUser = useAppStore(state => state.updateUser);
  
  // Computed values
  const userActivities = useAppStore(state => 
    state.users[state.currentUser]?.days.today.activities || []
  );
};
```

### Selector Patterns
```javascript
// Memoized selectors for performance
const selectCurrentUserData = state => state.users[state.currentUser];
const selectTodayActivities = state => 
  state.users[state.currentUser]?.days.today.activities || [];
const selectCompletedCount = state => 
  selectTodayActivities(state).filter(a => a.completed).length;
```

## State Migration System

### Version Migration
```javascript
const migrateDataStructure = (state) => {
  // v3 to v4 migration
  if (!state.library || !state.library.categories) {
    state.library = {
      categories: state.activityCategories || null,
      userAddedActivityIds: []
    };
    delete state.activityCategories;
  }
  
  // v4 to v5 migration (future)
  if (state.dataVersion < 5) {
    // Migration logic here
    state.dataVersion = 5;
  }
  
  return state;
};
```

### Migration Rules
1. **Always preserve user data**
2. **Run migrations sequentially**
3. **Log migration operations**
4. **Test with old export files**
5. **Never break backward compatibility**

## Performance Optimizations

### Debouncing Strategy
```javascript
// Critical for iOS performance
let storageWriteTimer = null;
let pendingWrite = null;

const debouncedPersist = (state) => {
  pendingWrite = state;
  clearTimeout(storageWriteTimer);
  
  storageWriteTimer = setTimeout(async () => {
    if (pendingWrite) {
      await AsyncStorage.setItem('stackmap-storage', JSON.stringify(pendingWrite));
      pendingWrite = null;
    }
  }, 1000);  // 1-second delay prevents iOS freezing
};
```

### Subscription Optimization
```javascript
// Bad: Subscribes to entire state
const state = useAppStore();  // Re-renders on ANY change

// Good: Selective subscription
const theme = useAppStore(state => state.currentTheme);  // Only theme changes

// Best: Computed selector with shallow equality
const activities = useAppStore(
  state => state.users[state.currentUser]?.days.today.activities,
  shallow  // From zustand/shallow
);
```

## State Synchronization

### Sync Integration Points
```javascript
// Before sync
1. Validate local state
2. Create state snapshot
3. Generate sync checksum

// During sync
1. Download remote state
2. Run conflict resolution
3. Merge states
4. Update local store

// After sync
1. Persist merged state
2. Update sync timestamp
3. Log sync event
```

### Conflict Resolution
```javascript
// Automatic resolution strategies
resolveConflict: (local, remote) => {
  switch (syncConflictResolution) {
    case 'local':
      return local;  // Keep local changes
    
    case 'remote':
      return remote;  // Accept remote changes
    
    case 'merge':
      // Last-write-wins per field
      return mergeByTimestamp(local, remote);
  }
}
```

## Error Handling

### Storage Errors
```javascript
// Corrupted data recovery
getItem: async (name) => {
  try {
    const value = await AsyncStorage.getItem(name);
    return JSON.parse(value);
  } catch (error) {
    console.error('Corrupted storage, resetting:', error);
    await AsyncStorage.removeItem(name);
    return getInitialState();
  }
}
```

### State Validation
```javascript
// Validate critical fields
validateState: (state) => {
  // Ensure current user exists
  if (state.currentUser && !state.users[state.currentUser]) {
    state.currentUser = Object.keys(state.users)[0] || null;
  }
  
  // Ensure required fields
  if (!state.library) {
    state.library = { categories: null, userAddedActivityIds: [] };
  }
  
  return state;
}
```

## Testing Considerations

### State Testing Checklist
- [ ] Store initializes with default state
- [ ] Actions update state correctly
- [ ] Persistence saves and loads
- [ ] Migration handles old formats
- [ ] Debouncing prevents rapid writes
- [ ] Sync doesn't corrupt state
- [ ] Reset clears all data
- [ ] Validation fixes bad states

## Common Issues & Solutions

### Issue: iOS 20+ Second Freeze
**Cause**: Rapid AsyncStorage writes
**Solution**: 1-second debounce on all writes

### Issue: Lost State After Update
**Cause**: Migration not run
**Solution**: Always check and migrate on hydration

### Issue: Duplicate User Creation
**Cause**: Race condition during init
**Solution**: `isInitializing` flag prevents doubles

### Issue: Sync Overwrites Local Changes
**Cause**: Wrong conflict resolution
**Solution**: Timestamp-based merge strategy

## Best Practices

### Do's
- Use selective subscriptions
- Batch related updates
- Validate before persisting
- Log state changes in dev
- Test with production data

### Don'ts
- Don't mutate state directly
- Don't store sensitive data unencrypted
- Don't skip migrations
- Don't remove debouncing
- Don't change storage keys

## Future Improvements

### Planned Enhancements
1. **State normalization** for better performance
2. **Redux DevTools** integration
3. **Time-travel debugging** in development
4. **Automated state backups**
5. **State compression** for large datasets

### Under Consideration
- TypeScript for type safety
- Immer for immutable updates
- Separate stores per domain
- WebWorker for sync operations
- IndexedDB for web platform