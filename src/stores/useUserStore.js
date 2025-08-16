// @ts-check
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Deep merge utility to replace lodash
const deepMerge = (target, source) => {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
};
import { DEFAULT_USER_ICON } from '../constants';

// Debounce timer for storage writes
let storageWriteTimer = null;
let pendingWrite = null;

// Storage adapter for React Native AsyncStorage with debounced writes
const storage = {
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch (parseError) {
        console.error('Error parsing stored value, clearing corrupted data:', parseError);
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (name, value) => {
    pendingWrite = { name, value };
    
    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
    }
    
    storageWriteTimer = setTimeout(async () => {
      if (pendingWrite) {
        try {
          await AsyncStorage.setItem(pendingWrite.name, JSON.stringify(pendingWrite.value));
        } catch (error) {
          console.error('Error writing to AsyncStorage:', error);
        }
        pendingWrite = null;
      }
    }, 1000);
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
};

/**
 * User management store
 * Handles all user-related state and actions
 */
const useUserStore = create(
  devtools(
    persist(
      (set, get) => ({
        // User State
        users: {},
        currentUser: null,
        currentDay: 'today',
        userContextData: {},
        
        // User Actions
        setUsers: (users) => set({ users }, false, 'setUsers'),
        setCurrentUser: (userId) => set({ currentUser: userId }, false, 'setCurrentUser'),
        setCurrentDay: (day) => set({ currentDay: day }, false, 'setCurrentDay'),
        setUserContextData: (data) => set({ userContextData: data }, false, 'setUserContextData'),
        
        addUser: (userId, user) => set((state) => {
          // Validate user data
          const sanitizedUser = { ...user };
          
          // Fix user name if it's not a string
          if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
            if (typeof sanitizedUser.name === 'object' && sanitizedUser.name !== null) {
              if (sanitizedUser.name.name && typeof sanitizedUser.name.name === 'string') {
                sanitizedUser.name = sanitizedUser.name.name;
              } else if (typeof sanitizedUser.name.toString === 'function') {
                const nameStr = sanitizedUser.name.toString();
                if (nameStr !== '[object Object]') {
                  sanitizedUser.name = nameStr;
                } else {
                  sanitizedUser.name = 'User';
                }
              } else {
                sanitizedUser.name = 'User';
              }
            } else if (sanitizedUser.name === null || sanitizedUser.name === undefined) {
              sanitizedUser.name = 'User';
            } else {
              sanitizedUser.name = String(sanitizedUser.name);
              if (!sanitizedUser.name || sanitizedUser.name === 'undefined' || sanitizedUser.name === 'null') {
                sanitizedUser.name = 'User';
              }
            }
          }
          
          // Ensure icon field exists - use emoji as fallback
          if (!sanitizedUser.icon || typeof sanitizedUser.icon !== 'string' || sanitizedUser.icon.length === 0) {
            // Try to use emoji field as fallback
            if (sanitizedUser.emoji && typeof sanitizedUser.emoji === 'string' && sanitizedUser.emoji.length > 0) {
              sanitizedUser.icon = sanitizedUser.emoji;
            } else {
              console.warn('Invalid user icon in addUser:', sanitizedUser.icon);
              sanitizedUser.icon = DEFAULT_USER_ICON;
            }
          }
          
          return {
            users: {
              ...state.users,
              [userId]: sanitizedUser
            }
          };
        }, false, 'addUser'),
        
        updateUser: (userId, updates) => set((state) => {
          const currentUser = state.users[userId];
          if (!currentUser) return state;
          
          const sanitizedUpdates = { ...updates };
          
          // Handle icon field updates
          if ('icon' in sanitizedUpdates) {
            if (!sanitizedUpdates.icon || typeof sanitizedUpdates.icon !== 'string' || sanitizedUpdates.icon.length === 0) {
              if (currentUser.icon && typeof currentUser.icon === 'string' && currentUser.icon.length > 0) {
                delete sanitizedUpdates.icon;
              } else {
                // Try emoji field as fallback
                if (currentUser.emoji && typeof currentUser.emoji === 'string' && currentUser.emoji.length > 0) {
                  sanitizedUpdates.icon = currentUser.emoji;
                } else {
                  sanitizedUpdates.icon = DEFAULT_USER_ICON;
                }
              }
            }
          }
          
          // Icon field validation handled above
          
          let updatedUser = deepMerge(currentUser, sanitizedUpdates);
          
          // Handle deep property updates
          if (updates.days && updates.days[updates.dayToUpdate]) {
            const dayToUpdate = updates.dayToUpdate;
            if (!updatedUser.days) updatedUser.days = {};
            if (!updatedUser.days[dayToUpdate]) updatedUser.days[dayToUpdate] = {};
            
            updatedUser.days[dayToUpdate] = deepMerge(
              updatedUser.days[dayToUpdate],
              updates.days[dayToUpdate]
            );
          }
          
          return {
            users: {
              ...state.users,
              [userId]: updatedUser
            }
          };
        }, false, 'updateUser'),
        
        deleteUser: (userId) => set((state) => ({
          users: {
            ...state.users,
            [userId]: {
              ...state.users[userId],
              deleted: true,
              deletedAt: Date.now()
            }
          }
        }), false, 'deleteUser'),
        
        // Activity-related actions for users
        addUserActivityToLibrary: (activity) => set((state) => {
          const userId = state.currentUser;
          if (!userId || !state.users[userId]) return state;
          
          const user = state.users[userId];
          const userAddedIds = user.userAddedActivityIds || [];
          
          if (!userAddedIds.includes(activity.id)) {
            return {
              users: {
                ...state.users,
                [userId]: {
                  ...user,
                  userAddedActivityIds: [...userAddedIds, activity.id]
                }
              }
            };
          }
          
          return state;
        }, false, 'addUserActivityToLibrary'),
      }),
      {
        name: 'stackmap-user-storage',
        storage,
        partialize: (state) => ({
          users: state.users,
          currentUser: state.currentUser,
          currentDay: state.currentDay,
          userContextData: state.userContextData,
        }),
      }
    ),
    {
      name: 'UserStore',
    }
  )
);

export default useUserStore;