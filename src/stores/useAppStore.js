import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import merge from 'lodash/merge';

// Storage adapter - Use MMKV for 30x faster storage on Android
let storage = null;

// Lazy load storage to avoid module-level Platform.OS access
const initStorage = () => {
  if (storage) return storage;
  
  if (Platform.OS === 'web') {
  // Use AsyncStorage for web
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = {
    getItem: async (name) => {
      try {
        const value = await AsyncStorage.getItem(name);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch (parseError) {
//           console.error('Error parsing stored value:', parseError);
          await AsyncStorage.removeItem(name);
          return null;
        }
      } catch (error) {
//         console.error('Error reading from AsyncStorage:', error);
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await AsyncStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
//         console.error('Error writing to AsyncStorage:', error);
      }
    },
    removeItem: async (name) => {
      try {
        await AsyncStorage.removeItem(name);
      } catch (error) {
//         console.error('Error removing from AsyncStorage:', error);
      }
    },
  };
  } else {
    // Use MMKV for native platforms (30x faster than AsyncStorage)

  try {
    const { MMKV } = require('react-native-mmkv');

    const mmkvStorage = new MMKV({
      id: 'stackmap-storage',
      encryptionKey: undefined // We handle encryption at app level
    });

    storage = {
    getItem: (name) => {
      try {
        const value = mmkvStorage.getString(name);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch (parseError) {
//           console.error('Error parsing stored value:', parseError);
          mmkvStorage.delete(name);
          return null;
        }
      } catch (error) {
//         console.error('Error reading from MMKV:', error);
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        mmkvStorage.set(name, JSON.stringify(value));
      } catch (error) {
//         console.error('Error writing to MMKV:', error);
      }
    },
    removeItem: (name) => {
      try {
        mmkvStorage.delete(name);
      } catch (error) {
//         console.error('Error removing from MMKV:', error);
      }
    },
  };

  } catch (error) {
//     console.error('[Storage] Failed to load MMKV:', error);

    // Fallback to AsyncStorage if MMKV fails
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    storage = {
      getItem: async (name) => {
        try {
          const value = await AsyncStorage.getItem(name);
          if (!value) return null;
          try {
            return JSON.parse(value);
          } catch (parseError) {
//             console.error('Error parsing stored value:', parseError);
            await AsyncStorage.removeItem(name);
            return null;
          }
        } catch (error) {
//           console.error('Error reading from AsyncStorage:', error);
          return null;
        }
      },
      setItem: async (name, value) => {
        try {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        } catch (error) {
//           console.error('Error writing to AsyncStorage:', error);
        }
      },
      removeItem: async (name) => {
        try {
          await AsyncStorage.removeItem(name);
        } catch (error) {
//           console.error('Error removing from AsyncStorage:', error);
        }
      },
    };
  }
  }
  return storage;
};

// Initialize storage on first use
const getStorage = () => {
  if (!storage) {
    storage = initStorage();
  }
  return storage;
};

// Defer loading this large constant
let STACKMAP_LIBRARY = null;
const loadStackMapLibrary = () => {
  if (!STACKMAP_LIBRARY) {
    STACKMAP_LIBRARY = require('../constants/stackMapLibrary').STACKMAP_LIBRARY;
  }
  return STACKMAP_LIBRARY;
};

// Migration function for v4 to v5 data structure (Activity Groups)
const migrateDataStructure = (state) => {
  
  // First run v3 to v4 migration if needed
  if (!state.library || !state.library.categories) {

    if (!state.library) {
      state.library = {
        categories: null,
        userAddedActivityIds: []
      };
    }
    
    if (state.activityCategories && !state.library.categories) {
      state.library.categories = state.activityCategories;
    }
    
    if (state.activities && !state.libraryTemplates) {
      state.libraryTemplates = state.activities;
    }
  }
  
  // Now run v4 to v5 migration (Activity Groups)
  if (!state.stackMapLibrary || !state.myLibrary) {

    // DEFER: Don't load the large STACKMAP_LIBRARY during initial hydration
    // It will be loaded lazily when actually needed
    if (!state.stackMapLibrary) {
      // Just mark that it needs to be loaded later
      state.stackMapLibrary = null; // Will be loaded on demand
    }
    
    // Migrate existing user categories to My Library
    if (!state.myLibrary) {
      const existingCategories = state.library?.categories || state.activityCategories || [];
      
      // Convert categories to activity groups
      const userGroups = existingCategories
        .filter(cat => cat.activities && cat.activities.length > 0) // Only migrate non-empty categories
        .map(cat => ({
          ...cat,
          isUserCreated: true,
          createdAt: Date.now(),
          lastModified: Date.now(),
          order: cat.order || 999,
          metadata: {
            description: '',
            color: null
          }
        }));
      
      // Always ensure My Templates exists
      const hasMyTemplates = userGroups.some(g => g.id === 'my-templates');
      if (!hasMyTemplates) {
        userGroups.push({
          id: 'my-templates',
          name: 'My Templates',
          activities: [],
          isUserCreated: false,
          isProtected: true,
          createdAt: Date.now(),
          lastModified: Date.now(),
          order: 0,
          metadata: {
            description: 'Your saved activity templates',
            color: null
          }
        });
      }
      
      state.myLibrary = {
        activityGroups: userGroups,
        groupOrder: userGroups.map(g => g.id)
      };
    }

  }
  
  return state;
};

// Track if store has been hydrated
let isHydrated = false;
let hydrationPromise = null;

// Create a minimal initial state for immediate app startup
const getInitialState = () => ({
  // Critical state needed immediately
  currentTheme: 'stackBlue',
  bannerPosition: 'top',
  soundEnabled: true,
  users: {},
  currentUser: null,
  hasCompletedOnboarding: false,
  // Non-critical state can be null initially
  activities: [],
  libraryTemplates: [],
  stackMapLibrary: null,
  myLibrary: null,
  library: { categories: null, userAddedActivityIds: [] }
});

// Create the store with devtools and persistence
const useAppStore = create(
  devtools(
    persist(
    (set, get) => ({
      // Theme & Display Settings
      currentTheme: 'stackBlue',
      bannerPosition: 'top',
      soundEnabled: true,
      taskCelebration: 'rainbow',
      routineCelebration: 'rainbow',
      
      // Device-specific toolbar settings (not synced)
      toolbarOrder: null,
      moreButtonPosition: 'left',
      
      // Actions for Theme & Settings
      setCurrentTheme: (theme) => set({ currentTheme: theme }, false, 'setCurrentTheme'),
      
      setBannerPosition: (position) => set({ bannerPosition: position }, false, 'setBannerPosition'),
      
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }, false, 'setSoundEnabled'),
      
      setTaskCelebration: (celebration) => set({ taskCelebration: celebration }, false, 'setTaskCelebration'),
      
      setRoutineCelebration: (celebration) => set({ routineCelebration: celebration }, false, 'setRoutineCelebration'),
      
      // Toolbar settings (device-specific)
      setToolbarOrder: (order) => set({ toolbarOrder: order }, false, 'setToolbarOrder'),
      
      setMoreButtonPosition: (position) => set({ moreButtonPosition: position }, false, 'setMoreButtonPosition'),
      
      // Batch update for settings
      updateSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      }), false, 'updateSettings'),
      
      // User Management
      users: {},
      currentUser: null,
      
      // User Actions
      setUsers: (users) => set({ users }, false, 'setUsers'),
      
      setCurrentUser: (userId) => set({ currentUser: userId }, false, 'setCurrentUser'),
      
      addUser: (userId, user) => set((state) => {
        // Validate user data
        const sanitizedUser = { ...user };
        
        // Fix user name if it's not a string
        if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
//           console.warn('Invalid user name in addUser:', sanitizedUser.name);
          // If it's an object, try to extract a name from it
          if (typeof sanitizedUser.name === 'object' && sanitizedUser.name !== null) {
            sanitizedUser.name = sanitizedUser.name.name || sanitizedUser.name.text || sanitizedUser.name.value || 'User';
          } else if (!sanitizedUser.name) {
            sanitizedUser.name = 'User';
          } else {
            // Only use String() for primitive types, not objects
            sanitizedUser.name = 'User';
          }
        }
        
        // Fix user icon if it's not a string or doesn't exist
        // IMPORTANT: Do NOT use .trim() on emoji strings as it can damage complex Unicode sequences
        if (typeof sanitizedUser.icon !== 'string' || !sanitizedUser.icon || sanitizedUser.icon.length === 0) {
//           console.warn('Invalid user icon in addUser:', sanitizedUser.icon);
          // Try to get icon from emoji field or use default
          sanitizedUser.icon = sanitizedUser.emoji || '👤';
        }
        // If we have a valid emoji string, keep it as-is
        // This preserves complex emojis like 🦍, ⛑️ that have multiple code points
        
        return {
          users: {
            ...state.users,
            [userId]: sanitizedUser
          }
        };
      }, false, 'addUser'),
      
      updateUser: (userId, updates) => set((state) => {
        // Special handling for arrays in settings to ensure they're replaced, not merged
        const currentUser = state.users[userId];
        if (!currentUser) return state;
        
        // Validate and sanitize updates
        const sanitizedUpdates = { ...updates };
        
        // Fix user name if provided and not a string
        if ('name' in sanitizedUpdates) {
          if (!sanitizedUpdates.name || typeof sanitizedUpdates.name !== 'string') {
//             console.warn('Invalid user name in updateUser:', sanitizedUpdates.name);
            // If it's an object, try to extract a name from it
            if (typeof sanitizedUpdates.name === 'object' && sanitizedUpdates.name !== null) {
              sanitizedUpdates.name = sanitizedUpdates.name.name || sanitizedUpdates.name.text || sanitizedUpdates.name.value || currentUser.name || 'User';
            } else {
              sanitizedUpdates.name = currentUser.name || 'User';
            }
          }
        }
        
        // Fix user icon if provided and not a valid string
        // IMPORTANT: Do NOT use .trim() on emoji strings as it can damage complex Unicode sequences
        if ('icon' in sanitizedUpdates) {
          if (typeof sanitizedUpdates.icon !== 'string' || !sanitizedUpdates.icon || sanitizedUpdates.icon.length === 0) {
//             console.warn('Invalid user icon in updateUser:', sanitizedUpdates.icon);
            sanitizedUpdates.icon = sanitizedUpdates.emoji || currentUser.icon || '👤';
          }
          // Keep the icon as-is if it's a valid non-empty string
          // This preserves complex emojis like 🦍, ⛑️ that have multiple code points
        }
        
        let updatedUser = merge({}, currentUser, sanitizedUpdates);
        
        // If updating settings with arrays, replace them instead of merging
        if (updates.settings) {
          updatedUser.settings = {
            ...updatedUser.settings,
            ...updates.settings
          };
        }
        
        // Final validation of the complete user object
        if (!updatedUser.name || typeof updatedUser.name !== 'string') {
//           console.error('User name became non-string after merge:', updatedUser.name);
          if (typeof updatedUser.name === 'object' && updatedUser.name !== null) {
            updatedUser.name = updatedUser.name.name || updatedUser.name.text || currentUser.name || 'User';
          } else {
            updatedUser.name = currentUser.name || 'User';
          }
        }
        if (typeof updatedUser.icon !== 'string' || updatedUser.icon.trim() === '') {
//           console.error('User icon became invalid after merge:', updatedUser.icon);
          updatedUser.icon = updatedUser.emoji || currentUser.icon || '👤';
        }
        
        return {
          users: {
            ...state.users,
            [userId]: updatedUser
          }
        };
      }, false, 'updateUser'),
      
      deleteUser: (userId) => set((state) => {
        const newUsers = { ...state.users };
        // Instead of deleting, mark as deleted with timestamp
        // This allows sync to properly handle deletions
        if (newUsers[userId]) {
          newUsers[userId] = {
            ...newUsers[userId],
            deleted: true,
            deletedAt: Date.now()
          };
        }
        return { users: newUsers };
      }, false, 'deleteUser'),
      
      // Activities and Days
      activities: [], // DEPRECATED: Will be renamed to libraryTemplates
      libraryTemplates: [], // DEPRECATED: Legacy field for backward compatibility
      currentDay: 'today',
      displayMode: 'numbers',
      dayMode: 'today',
      templates: {}, // DEPRECATED: Legacy field
      activityCategories: null, // DEPRECATED: Legacy field for backward compatibility
      
      // DEPRECATED: Old library structure
      library: {
        categories: null,
        userAddedActivityIds: []
      },
      
      // NEW v5: Activity Groups structure
      stackMapLibrary: null, // System-provided activity groups (read-only)
      myLibrary: null, // User's custom activity groups
      
      userContextData: {},
      hasCompletedOnboarding: false,
      
      // Activity Actions
      setActivities: (activities) => set({ 
        activities,
        libraryTemplates: activities // Keep both in sync during migration
      }, false, 'setActivities'),
      
      // NEW: Library template actions
      setLibraryTemplates: (templates) => set({ 
        libraryTemplates: templates,
        activities: templates // Keep both in sync during migration
      }, false, 'setLibraryTemplates'),
      
      setCurrentDay: (day) => set({ currentDay: day }, false, 'setCurrentDay'),
      
      setDisplayMode: (mode) => set({ displayMode: mode }, false, 'setDisplayMode'),
      
      setDayMode: (mode) => set({ dayMode: mode }, false, 'setDayMode'),
      
      setTemplates: (templates) => set({ templates }, false, 'setTemplates'),
      
      setActivityCategories: (categories) => set({ 
        activityCategories: categories,
        library: {
          ...get().library,
          categories: categories // Keep both in sync during migration
        }
      }, false, 'setActivityCategories'),
      
      // NEW: Library actions
      setLibrary: (library) => set({ library }, false, 'setLibrary'),
      
      setLibraryCategories: (categories) => set((state) => ({
        library: {
          ...state.library,
          categories
        },
        activityCategories: categories // Keep both in sync during migration
      }), false, 'setLibraryCategories'),
      
      addUserActivityToLibrary: (activityId) => set((state) => ({
        library: {
          ...state.library,
          userAddedActivityIds: [...(state.library.userAddedActivityIds || []), activityId]
        }
      }), false, 'addUserActivityToLibrary'),
      
      // NEW v5: Activity Group Management Actions
      setStackMapLibrary: (library) => set({ stackMapLibrary: library }, false, 'setStackMapLibrary'),
      
      setMyLibrary: (library) => set({ myLibrary: library }, false, 'setMyLibrary'),
      
      // Lazy load the StackMap Library when needed
      getStackMapLibrary: () => {
        const state = get();
        if (!state.stackMapLibrary) {

          // Load the library lazily
          const library = loadStackMapLibrary();
          set({ stackMapLibrary: library }, false, 'lazyLoadStackMapLibrary');
          return library;
        }
        return state.stackMapLibrary;
      },
      
      createActivityGroup: (name, metadata = {}) => set((state) => {
        const newGroup = {
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          activities: [],
          isUserCreated: true,
          createdAt: Date.now(),
          lastModified: Date.now(),
          order: state.myLibrary?.activityGroups?.length || 0,
          metadata: {
            description: metadata.description || '',
            color: metadata.color || null,
            ...metadata
          }
        };
        
        const currentLibrary = state.myLibrary || { activityGroups: [], groupOrder: [] };
        return {
          myLibrary: {
            ...currentLibrary,
            activityGroups: [...currentLibrary.activityGroups, newGroup],
            groupOrder: [...currentLibrary.groupOrder, newGroup.id]
          }
        };
      }, false, 'createActivityGroup'),
      
      updateActivityGroup: (groupId, updates) => set((state) => {
        if (!state.myLibrary) return state;
        
        return {
          myLibrary: {
            ...state.myLibrary,
            activityGroups: state.myLibrary.activityGroups.map(group =>
              group.id === groupId
                ? { ...group, ...updates, lastModified: Date.now() }
                : group
            )
          }
        };
      }, false, 'updateActivityGroup'),
      
      deleteActivityGroup: (groupId) => set((state) => {
        if (!state.myLibrary) return state;
        
        // Don't allow deletion of protected groups
        const group = state.myLibrary.activityGroups.find(g => g.id === groupId);
        if (group?.isProtected) return state;
        
        return {
          myLibrary: {
            ...state.myLibrary,
            activityGroups: state.myLibrary.activityGroups.filter(g => g.id !== groupId),
            groupOrder: state.myLibrary.groupOrder.filter(id => id !== groupId)
          }
        };
      }, false, 'deleteActivityGroup'),
      
      addActivityToGroup: (groupId, activity) => set((state) => {
        if (!state.myLibrary) return state;
        
        return {
          myLibrary: {
            ...state.myLibrary,
            activityGroups: state.myLibrary.activityGroups.map(group =>
              group.id === groupId
                ? {
                    ...group,
                    activities: [...group.activities, activity],
                    lastModified: Date.now()
                  }
                : group
            )
          }
        };
      }, false, 'addActivityToGroup'),
      
      copyGroupToMyLibrary: (sourceGroup) => set((state) => {
        const newGroup = {
          ...sourceGroup,
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${sourceGroup.name} (Copy)`,
          isUserCreated: true,
          isSystemProvided: false,
          isProtected: false,
          createdAt: Date.now(),
          lastModified: Date.now(),
          order: state.myLibrary?.activityGroups?.length || 0
        };
        
        const currentLibrary = state.myLibrary || { activityGroups: [], groupOrder: [] };
        return {
          myLibrary: {
            ...currentLibrary,
            activityGroups: [...currentLibrary.activityGroups, newGroup],
            groupOrder: [...currentLibrary.groupOrder, newGroup.id]
          }
        };
      }, false, 'copyGroupToMyLibrary'),
      
      setUserContextData: (data) => set({ userContextData: data }, false, 'setUserContextData'),
      
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }, false, 'setHasCompletedOnboarding'),
      
      addActivity: (activity) => set((state) => ({
        activities: [...state.activities, activity],
        libraryTemplates: [...state.libraryTemplates, activity] // Keep both in sync
      }), false, 'addActivity'),
      
      updateActivity: (activityId, updates) => set((state) => {
        const updatedActivities = state.activities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        );
        return {
          activities: updatedActivities,
          libraryTemplates: updatedActivities // Keep both in sync
        };
      }, false, 'updateActivity'),
      
      deleteActivity: (activityId) => set((state) => {
        const filteredActivities = state.activities.filter(activity => activity.id !== activityId);
        return {
          activities: filteredActivities,
          libraryTemplates: filteredActivities // Keep both in sync
        };
      }, false, 'deleteActivity'),
      
      reorderActivities: (newOrder) => set({ 
        activities: newOrder,
        libraryTemplates: newOrder // Keep both in sync
      }, false, 'reorderActivities'),
      
      // Helper function for updating user activities with proper null checking
      updateUserActivities: (userId, day, activities) => set((state) => {
        if (!state.users[userId]) return state;
        
        return {
          users: {
            ...state.users,
            [userId]: {
              ...state.users[userId],
              days: {
                ...state.users[userId].days || {},
                [day]: { 
                  ...state.users[userId].days?.[day] || {},
                  activities 
                }
              }
            }
          }
        };
      }, false, 'updateUserActivities'),
      
      // Manual hydration trigger for deferred loading
      hydrateStore: async () => {
        if (isHydrated) return;
        if (hydrationPromise) return hydrationPromise;
        
        hydrationPromise = (async () => {
          try {
            // MMKV is synchronous on native, but we keep async for web compatibility
            const stored = Platform.OS === 'web' 
              ? await getStorage().getItem('stackmap-storage')
              : getStorage().getItem('stackmap-storage');
            
            if (stored) {
              const { state } = stored;
              if (state) {
                // Apply all state at once - faster than chunking
                // Migration happens synchronously
                const migratedState = migrateDataStructure(state);
                set(migratedState, false, 'hydrateStore');
              }
            }
            isHydrated = true;
          } catch (error) {
//             console.error('[STORE HYDRATION] Hydration failed:', error);
            isHydrated = true; // Mark as hydrated even on error to unblock UI
          }
        })();
        
        return hydrationPromise;
      },
    }),
    {
      name: 'stackmap-storage', // unique name for storage
      storage, // use our AsyncStorage adapter
      // CRITICAL: Skip automatic hydration to prevent blocking app startup
      skipHydration: true, // Hydration will be triggered manually after app renders
      
      onRehydrateStorage: () => (state) => {
        // This won't be called with skipHydration: true
        // Hydration is handled manually in hydrateStore()
        console.log('[STORE HYDRATION] onRehydrateStorage called (should not happen with skipHydration)');
      },
      partialize: (state) => ({
        // Only persist specific parts of the state
        currentTheme: state.currentTheme,
        bannerPosition: state.bannerPosition,
        soundEnabled: state.soundEnabled,
        taskCelebration: state.taskCelebration,
        routineCelebration: state.routineCelebration,
        toolbarOrder: state.toolbarOrder,
        moreButtonPosition: state.moreButtonPosition,
        users: state.users,
        currentUser: state.currentUser,
        currentDay: state.currentDay,
        displayMode: state.displayMode,
        dayMode: state.dayMode,
        templates: state.templates,
        activityCategories: state.activityCategories,
        library: state.library, // Keep for backward compatibility
        libraryTemplates: state.libraryTemplates, // Keep for backward compatibility
        stackMapLibrary: state.stackMapLibrary, // NEW v5: System library
        myLibrary: state.myLibrary, // NEW v5: User library
        userContextData: state.userContextData,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        // Note: activities are stored per user, so we don't persist them here
        // MIGRATION: Keep activities field for backward compatibility
        activities: state.activities
      }),
    }
    ),
    {
      name: 'stackmap-store', // name for devtools
    }
  )
);

export default useAppStore;