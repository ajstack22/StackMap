// @ts-check
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logWarn } from '../utils/logger';
// Deep merge utility to replace lodash
const deepMerge = (target, source) => {
  const output = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
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
  getItem: async name => {
    // CRITICAL FIX: If there's a pending write, return that instead of stale storage
    if (pendingWrite && pendingWrite.name === name) {

      return pendingWrite.value;
    }
    
    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
//           'Error parsing stored value, clearing corrupted data:',
//           parseError,
//         );
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
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
          // PHASE 1 CHECKPOINT 3: AsyncStorage timing verification
          const writeStartTime = Date.now();
          console.log('[CHECKPOINT3] AsyncStorage write starting:', {
            storageName: pendingWrite.name,
            dataSize: JSON.stringify(pendingWrite.value).length,
            timestamp: writeStartTime
          });

          await AsyncStorage.setItem(
            pendingWrite.name,
            JSON.stringify(pendingWrite.value),
          );

          const writeEndTime = Date.now();
          const writeDuration = writeEndTime - writeStartTime;
          console.log('[CHECKPOINT3] AsyncStorage write completed:', {
            storageName: pendingWrite.name,
            duration: writeDuration,
            timestamp: writeEndTime
          });

          if (writeDuration > 500) {
            console.warn('[CHECKPOINT3] WARNING: AsyncStorage write took', writeDuration, 'ms (>500ms threshold)');
          }
        } catch (error) {
          console.error('[CHECKPOINT3] AsyncStorage write failed:', error);
        }
        pendingWrite = null;
      }
    }, 1000);
  },
  removeItem: async name => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
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
        setUsers: users => {
          // Sanitize all users before setting
          const sanitizedUsers = {};
          Object.entries(users).forEach(([userId, user]) => {
            if (!user) {
              sanitizedUsers[userId] = user; // Keep null/undefined as-is
              return;
            }

            const sanitizedUser = { ...user };

            // Trust dataNormalizer.js for name normalization (sync data path)
            // For non-sync data, validate but preserve original value for debugging
            if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
              logWarn(
                '[useUserStore] User name is invalid:',
                userId,
                sanitizedUser.name,
                '- should be normalized before setUsers()'
              );
              // Preserve original value rather than defaulting to 'User'
              // This allows debugging which normalization step failed
            }

            // Ensure icon field exists
            if (!sanitizedUser.icon || typeof sanitizedUser.icon !== 'string') {
              if (
                sanitizedUser.emoji &&
                typeof sanitizedUser.emoji === 'string'
              ) {
                sanitizedUser.icon = sanitizedUser.emoji;
                delete sanitizedUser.emoji;
              } else {
                sanitizedUser.icon = DEFAULT_USER_ICON;
              }
            }

            sanitizedUsers[userId] = sanitizedUser;
          });

          // PHASE 1 CHECKPOINT 2: Store setUsers() verification
          console.log('[CHECKPOINT2] Store setUsers() called:', {
            userCount: Object.keys(sanitizedUsers).length,
            userIds: Object.keys(sanitizedUsers),
            sampleUserId: Object.keys(sanitizedUsers)[0],
            sampleUser: sanitizedUsers[Object.keys(sanitizedUsers)[0]]
              ? {
                  id: sanitizedUsers[Object.keys(sanitizedUsers)[0]].id,
                  name: sanitizedUsers[Object.keys(sanitizedUsers)[0]].name,
                  hasIcon: !!sanitizedUsers[Object.keys(sanitizedUsers)[0]].icon,
                  hasDays: !!sanitizedUsers[Object.keys(sanitizedUsers)[0]].days,
                  daysKeys: sanitizedUsers[Object.keys(sanitizedUsers)[0]].days
                    ? Object.keys(sanitizedUsers[Object.keys(sanitizedUsers)[0]].days)
                    : []
                }
              : null,
            timestamp: Date.now()
          });

          set({ users: sanitizedUsers }, false, 'setUsers');

          // PHASE 1 CHECKPOINT 2B: Verify store updated successfully
          setTimeout(() => {
            const currentUsers = get().users;
            console.log('[CHECKPOINT2B] Store updated verification (after set):', {
              storeUserCount: Object.keys(currentUsers).length,
              match: Object.keys(currentUsers).length === Object.keys(sanitizedUsers).length,
              timestamp: Date.now()
            });
          }, 0);
        },
        setCurrentUser: userId =>
          set({ currentUser: userId }, false, 'setCurrentUser'),
        setCurrentDay: day => set({ currentDay: day }, false, 'setCurrentDay'),
        setUserContextData: data =>
          set({ userContextData: data }, false, 'setUserContextData'),

        addUser: (userIdOrUser, user) =>
          set(
            state => {
              // Handle both calling patterns: addUser(userId, user) and addUser(user)
              let userId, userData;
              if (user === undefined) {
                // Called as addUser(user) where user contains id
                userData = userIdOrUser;
                userId = userData.id;
              } else {
                // Called as addUser(userId, user)
                userId = userIdOrUser;
                userData = user;
              }

              // Validate user data
              const sanitizedUser = { ...userData, id: userId };

              // Fix user name if it's not a string
              if (
                !sanitizedUser.name ||
                typeof sanitizedUser.name !== 'string'
              ) {
                if (
                  typeof sanitizedUser.name === 'object' &&
                  sanitizedUser.name !== null
                ) {
                  if (
                    sanitizedUser.name.name &&
                    typeof sanitizedUser.name.name === 'string'
                  ) {
                    sanitizedUser.name = sanitizedUser.name.name;
                  } else if (
                    sanitizedUser.name.text &&
                    typeof sanitizedUser.name.text === 'string'
                  ) {
                    sanitizedUser.name = sanitizedUser.name.text;
                  } else {
                    sanitizedUser.name = 'User';
                  }
                } else {
                  sanitizedUser.name = 'User';
                }
              }

              // Ensure icon field exists - use emoji as fallback
              if (
                !sanitizedUser.icon ||
                typeof sanitizedUser.icon !== 'string' ||
                !sanitizedUser.icon.length
              ) {
                // Try to use emoji field as fallback
                if (
                  sanitizedUser.emoji &&
                  typeof sanitizedUser.emoji === 'string' &&
                  sanitizedUser.emoji.length
                ) {
                  sanitizedUser.icon = sanitizedUser.emoji;
                  delete sanitizedUser.emoji;
                } else {
                  sanitizedUser.icon = DEFAULT_USER_ICON;
                }
              }

              return {
                users: {
                  ...state.users,
                  [userId]: sanitizedUser,
                },
              };
            },
            false,
            'addUser',
          ),

        updateUser: (userId, updates) =>
          set(
            state => {
              const currentUser = state.users[userId];
              if (!currentUser) return state;

              const sanitizedUpdates = { ...updates };

              // Handle icon field updates
              if ('icon' in sanitizedUpdates) {
                if (
                  !sanitizedUpdates.icon ||
                  typeof sanitizedUpdates.icon !== 'string' ||
                  !sanitizedUpdates.icon.length
                ) {
                  sanitizedUpdates.icon = DEFAULT_USER_ICON;
                }
              }

              // Icon field validation handled above

              let updatedUser = deepMerge(currentUser, sanitizedUpdates);

              // Handle deep property updates
              if (updates.days && updates.days[updates.dayToUpdate]) {
                const dayToUpdate = updates.dayToUpdate;
                if (!updatedUser.days) updatedUser.days = {};
                if (!updatedUser.days[dayToUpdate])
                  updatedUser.days[dayToUpdate] = {};

                updatedUser.days[dayToUpdate] = deepMerge(
                  updatedUser.days[dayToUpdate],
                  updates.days[dayToUpdate],
                );
              }

              return {
                users: {
                  ...state.users,
                  [userId]: updatedUser,
                },
              };
            },
            false,
            'updateUser',
          ),

        deleteUser: userId =>
          set(
            state => {
              if (!state.users[userId]) return state;

              return {
                users: {
                  ...state.users,
                  [userId]: {
                    ...state.users[userId],
                    deleted: true,
                    deletedAt: Date.now(),
                  },
                },
              };
            },
            false,
            'deleteUser',
          ),

        // Activity-related actions for users
        addUserActivityToLibrary: activity =>
          set(
            state => {
              const userId = state.currentUser;
              if (!userId || !state.users?.[userId]) return state;

              const user = state.users[userId];
              const userAddedIds = user.userAddedActivityIds || [];

              if (!userAddedIds.includes(activity.id)) {
                return {
                  users: {
                    ...state.users,
                    [userId]: {
                      ...user,
                      userAddedActivityIds: [...userAddedIds, activity.id],
                    },
                  },
                };
              }

              return state;
            },
            false,
            'addUserActivityToLibrary',
          ),
      }),
      {
        name: 'stackmap-user-storage',
        storage,
        partialize: state => ({
          users: state.users,
          currentUser: state.currentUser,
          currentDay: state.currentDay,
          userContextData: state.userContextData,
        }),
      },
    ),
    {
      name: 'UserStore',
    },
  ),
);

export default useUserStore;
