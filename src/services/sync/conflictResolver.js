// @ts-check
import { useAppStore } from '../../stores';
import { validateSyncedData, repairSyncedData } from './dataValidator';
// import { normalizeSyncData } from '../../utils/dataNormalizer'; // DISABLED: was stripping critical fields

// Conflict resolution strategies
const STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',
  MERGE: 'merge',
  USER_CHOICE: 'user_choice',
  CUSTOM: 'custom'
};

// Field-specific resolution strategies
const FIELD_STRATEGIES = {
  // Arrays - merge unique items
  activities: STRATEGIES.MERGE,
  
  // Objects - merge properties with special handling
  users: STRATEGIES.CUSTOM,
  
  // Scalars - last write wins
  currentUser: STRATEGIES.LAST_WRITE_WINS,
  currentTheme: STRATEGIES.LAST_WRITE_WINS,
  bannerPosition: STRATEGIES.LAST_WRITE_WINS,
  soundEnabled: STRATEGIES.LAST_WRITE_WINS,
  taskCelebration: STRATEGIES.LAST_WRITE_WINS,
  routineCelebration: STRATEGIES.LAST_WRITE_WINS,
  currentDay: STRATEGIES.LAST_WRITE_WINS
};

class ConflictResolver {
  constructor() {
    this.pendingConflicts = [];
    this.conflictHistory = [];
    this.resolveCallback = null;
  }

  /**
   * Detect conflicts between local and remote state
   */
  detectConflicts(localState, remoteState, lastSyncTime) {
    const conflicts = [];
    
    // Get timestamps
    const localTimestamp = localState.lastModified || Date.now();
    const remoteTimestamp = remoteState.lastModified || Date.now();
    
    // Check each field for conflicts
    for (const field of Object.keys(FIELD_STRATEGIES)) {
      if (localState[field] === undefined || remoteState[field] === undefined) {
        continue;
      }
      
      // Check if both sides changed since last sync
      if (this.hasChanged(localState[field], remoteState[field])) {
        const conflict = {
          id: `${field}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          field,
          type: this.getConflictType(field, localState[field], remoteState[field]),
          localValue: localState[field],
          remoteValue: remoteState[field],
          localTimestamp,
          remoteTimestamp,
          strategy: FIELD_STRATEGIES[field],
          detectedAt: Date.now()
        };
        
        conflicts.push(conflict);
      }
    }
    
    return conflicts;
  }

  /**
   * Check if values have changed
   */
  hasChanged(value1, value2) {
    return JSON.stringify(value1) !== JSON.stringify(value2);
  }

  /**
   * Determine conflict type
   */
  getConflictType(field, localValue, remoteValue) {
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return 'array_conflict';
    } else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return 'object_conflict';
    } else {
      return 'value_conflict';
    }
  }

  /**
   * Resolve conflicts automatically where possible
   */
  async resolveConflicts(conflicts, options = {}) {
    const resolved = [];
    const needsUserInput = [];
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, options);
      
      if (resolution.requiresUserInput && !options.autoResolveAll) {
        needsUserInput.push(conflict);
      } else {
        resolved.push(resolution);
      }
    }
    
    // Add to history
    this.conflictHistory.push(...resolved);
    this.pendingConflicts = options.autoResolveAll ? [] : needsUserInput;
    
    return {
      resolved,
      pending: options.autoResolveAll ? [] : needsUserInput,
      finalState: this.applyResolutions(resolved)
    };
  }

  /**
   * Resolve a single conflict
   */
  async resolveConflict(conflict, options = {}) {
    const { strategy = conflict.strategy, preferLocal = false, autoResolveAll = false } = options;
    
    let resolution = {
      conflictId: conflict.id,
      field: conflict.field,
      strategy,
      resolvedAt: Date.now(),
      requiresUserInput: false
    };
    
    switch (strategy) {
      case STRATEGIES.LAST_WRITE_WINS:
        resolution.resolvedValue = conflict.remoteTimestamp > conflict.localTimestamp 
          ? conflict.remoteValue 
          : conflict.localValue;
        resolution.winner = conflict.remoteTimestamp > conflict.localTimestamp ? 'remote' : 'local';
        break;
        
      case STRATEGIES.MERGE:
        resolution.resolvedValue = this.mergeValues(
          conflict.field,
          conflict.localValue,
          conflict.remoteValue
        );
        resolution.mergeDetails = {
          localItems: Array.isArray(conflict.localValue) ? conflict.localValue.length : null,
          remoteItems: Array.isArray(conflict.remoteValue) ? conflict.remoteValue.length : null,
          mergedItems: Array.isArray(resolution.resolvedValue) ? resolution.resolvedValue.length : null
        };
        break;
        
      case STRATEGIES.USER_CHOICE:
        if (autoResolveAll) {
          // Auto-resolve using last-write-wins when autoResolveAll is true
          resolution.resolvedValue = conflict.remoteTimestamp > conflict.localTimestamp 
            ? conflict.remoteValue 
            : conflict.localValue;
          resolution.winner = conflict.remoteTimestamp > conflict.localTimestamp ? 'remote' : 'local';
          resolution.autoResolved = true;
        } else {
          resolution.requiresUserInput = true;
          resolution.choices = {
            local: conflict.localValue,
            remote: conflict.remoteValue,
            merge: this.mergeValues(conflict.field, conflict.localValue, conflict.remoteValue)
          };
        }
        break;
        
      case STRATEGIES.CUSTOM:
        if (conflict.field === 'users') {
          // Store timestamps for the merge function to use
          this.lastLocalTimestamp = conflict.localTimestamp;
          this.lastRemoteTimestamp = conflict.remoteTimestamp;
          
          const mergeResult = this.mergeUsersPreservingCompleted(
            conflict.localValue,
            conflict.remoteValue
          );
          
          resolution.resolvedValue = mergeResult;
          
          // Clear timestamps
          this.lastLocalTimestamp = null;
          this.lastRemoteTimestamp = null;
        } else {
          resolution.resolvedValue = this.mergeValues(
            conflict.field,
            conflict.localValue,
            conflict.remoteValue
          );
        }
        break;
        
      default:
        // Default to preferring local if specified, otherwise remote
        resolution.resolvedValue = preferLocal ? conflict.localValue : conflict.remoteValue;
        resolution.winner = preferLocal ? 'local' : 'remote';
    }
    
    return resolution;
  }

  /**
   * Merge values based on type
   */
  mergeValues(field, localValue, remoteValue) {
    // Array merge - combine unique items
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      if (field === 'activities') {
        // For activities, merge by ID and keep latest version
        const activityMap = new Map();
        
        // Add local activities
        for (const activity of localValue) {
          activityMap.set(activity.id, activity);
        }
        
        // Merge remote activities (smart merge for completion states)
        for (const activity of remoteValue) {
          const existing = activityMap.get(activity.id);
          if (!existing) {
            // New activity from remote
            activityMap.set(activity.id, activity);
          } else {
            // Activity exists in both - merge based on completion timestamps
            let merged = { ...activity };
            
            // Handle completion state based on timestamps
            if (existing.completedAt && activity.completedAt) {
              // Both have completion timestamps - use the most recent
              if (existing.completedAt > activity.completedAt) {
                merged.completed = existing.completed;
                merged.completedAt = existing.completedAt;
                merged.completedBy = existing.completedBy;
              }
              // else use activity's values (already in merged)
            } else if (existing.completedAt && !activity.completedAt) {
              // Only existing has completion - preserve it
              merged.completed = true;
              merged.completedAt = existing.completedAt;
              merged.completedBy = existing.completedBy;
            }
            // else use activity's values (already in merged)
            
            activityMap.set(activity.id, merged);
          }
        }
        
        return Array.from(activityMap.values());
      } else {
        // Generic array merge - combine unique values
        return [...new Set([...localValue, ...remoteValue])];
      }
    }
    
    // Object merge - combine properties
    if (typeof localValue === 'object' && typeof remoteValue === 'object' && 
        !Array.isArray(localValue) && !Array.isArray(remoteValue)) {
      if (field === 'users') {
        // Merge users by ID
        return { ...localValue, ...remoteValue };
      } else {
        // Generic object merge
        return { ...localValue, ...remoteValue };
      }
    }
    
    // For scalar values, can't merge - would need user choice
    return remoteValue;
  }

  /**
   * Apply resolutions to create final state
   */
  applyResolutions(resolutions) {
    const currentState = useAppStore.getState();
    let newState = { ...currentState };
    
    for (const resolution of resolutions) {
      if (!resolution.requiresUserInput && resolution.resolvedValue !== undefined) {
        newState[resolution.field] = resolution.resolvedValue;
      }
    }
    
    // Ensure users object exists (critical for validation)
    if (!newState.users || typeof newState.users !== 'object') {
      console.log('Conflict resolution: Adding missing users object');
      newState.users = currentState.users || {};
      
      // If still no users, create a default structure
      if (Object.keys(newState.users).length === 0) {
        const defaultUserId = newState.currentUser || 'user_1';
        newState.users = {
          [defaultUserId]: {
            name: 'User',
            icon: '👤',
            days: {}
          }
        };
        newState.currentUser = defaultUserId;
      }
    }
    
    // Ensure each user has required fields
    if (newState.users && typeof newState.users === 'object') {
      for (const [userId, user] of Object.entries(newState.users)) {
        if (user && typeof user === 'object' && !user.deleted) {
          // Ensure user has name
          if (!user.name) {
            user.name = 'User';
          }
          // Normalize icon field
          if (!user.icon) {
            if (user.emoji) {
              // Migrate emoji to icon field
              user.icon = user.emoji;
              delete user.emoji; // Remove redundant field
            } else {
              user.icon = '👤'; // Default user icon
            }
          } else if (user.emoji) {
            // Remove redundant emoji field if icon exists
            delete user.emoji;
          }
          // Ensure user has days object
          if (!user.days || typeof user.days !== 'object') {
            user.days = {};
          }
          
          // Ensure activities have required fields
          if (user.days) {
            for (const [dayKey, dayData] of Object.entries(user.days)) {
              if (dayData && dayData.activities && Array.isArray(dayData.activities)) {
                dayData.activities = dayData.activities.map(activity => {
                  if (activity && typeof activity === 'object') {
                    // Ensure completed field exists
                    if (activity.completed === undefined) {
                      activity.completed = false;
                    }
                    // Ensure pinned field exists
                    if (activity.pinned === undefined) {
                      activity.pinned = false;
                    }
                  }
                  return activity;
                });
              }
            }
          }
        }
      }
    }
    
    // Ensure currentUser is valid
    if (newState.users) {
      const currentUserData = newState.users[newState.currentUser];
      
      // Check if currentUser exists and is not deleted
      if (!newState.currentUser || !currentUserData || currentUserData.deleted) {
        if (newState.currentUser) {
          console.log(`Current user ${newState.currentUser} is missing or deleted, finding replacement`);
        } else {
          console.log('No currentUser set, finding a valid user');
        }
        
        // Find a valid user to set as current
        const validUserIds = Object.keys(newState.users).filter(id => 
          newState.users[id] && !newState.users[id].deleted
        );
        
        if (validUserIds.length > 0) {
          console.log(`Setting currentUser to first valid user: ${validUserIds[0]}`);
          newState.currentUser = validUserIds[0];
        } else {
          // No valid users, create a default one
          const defaultUserId = 'user_1';
          console.log('No valid users found, creating default user');
          newState.users[defaultUserId] = {
            name: 'User',
            icon: '👤',
            days: {}
          };
          newState.currentUser = defaultUserId;
        }
      }
    }
    
    // DISABLED: Normalization was stripping critical fields
    // console.log('Normalizing resolved state before validation...');
    // newState = normalizeSyncData(newState) || newState;
    
    // Validate the final state
    if (!validateSyncedData(newState)) {
      console.error('Conflict resolution resulted in invalid state, attempting repair');
      console.error('newState.users:', JSON.stringify(newState.users, null, 2));
      console.error('newState.currentUser:', newState.currentUser);
      
      // Try to repair the state
      const repairedState = repairSyncedData(newState);
      
      if (!validateSyncedData(repairedState)) {
        console.error('Conflict resolution repair failed, state still invalid');
        // Log more details for debugging
        console.error('Current state users:', JSON.stringify(currentState.users, null, 2));
        console.error('Current state currentUser:', currentState.currentUser);
        console.error('Resolutions applied:', resolutions);
        console.error('Failed state users:', JSON.stringify(newState.users, null, 2));
        console.error('Failed state currentUser:', newState.currentUser);
        console.error('Repaired state users:', JSON.stringify(repairedState.users, null, 2));
        console.error('Repaired state currentUser:', repairedState.currentUser);
        
        // Instead of throwing, return the current state as fallback
        console.error('Falling back to current state to prevent sync failure');
        return currentState;
      }
      
      console.log('Conflict resolution state repaired successfully');
      return repairedState;
    }
    
    return newState;
  }

  /**
   * Get conflicts that need user resolution
   */
  getPendingConflicts() {
    return this.pendingConflicts;
  }

  /**
   * Resolve a pending conflict with user choice
   */
  resolveUserConflict(conflictId, choice) {
    const conflictIndex = this.pendingConflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }
    
    const conflict = this.pendingConflicts[conflictIndex];
    const resolution = {
      conflictId: conflict.id,
      field: conflict.field,
      strategy: STRATEGIES.USER_CHOICE,
      resolvedAt: Date.now(),
      requiresUserInput: false,
      userChoice: choice,
      resolvedValue: conflict[choice + 'Value']
    };
    
    // Remove from pending
    this.pendingConflicts.splice(conflictIndex, 1);
    
    // Add to history
    this.conflictHistory.push(resolution);
    
    // Notify callback if set
    if (this.resolveCallback) {
      this.resolveCallback(resolution);
    }
    
    return resolution;
  }

  /**
   * Set callback for conflict resolution
   */
  onResolve(callback) {
    this.resolveCallback = callback;
  }

  /**
   * Get conflict history
   */
  getHistory(limit = 50) {
    return this.conflictHistory.slice(-limit);
  }

  /**
   * Clear conflict history
   */
  clearHistory() {
    this.conflictHistory = [];
  }

  /**
   * Generate conflict summary
   */
  generateSummary(conflicts) {
    const summary = {
      total: conflicts.length,
      byField: {},
      byType: {},
      byStrategy: {}
    };
    
    for (const conflict of conflicts) {
      // Count by field
      summary.byField[conflict.field] = (summary.byField[conflict.field] || 0) + 1;
      
      // Count by type
      summary.byType[conflict.type] = (summary.byType[conflict.type] || 0) + 1;
      
      // Count by strategy
      summary.byStrategy[conflict.strategy] = (summary.byStrategy[conflict.strategy] || 0) + 1;
    }
    
    return summary;
  }

  /**
   * Merge users data while preserving local completed states and deletions
   */
  mergeUsersPreservingCompleted(localUsers, remoteUsers) {
    const mergedUsers = {};
    
    // Process all users from both local and remote - NO DEDUPLICATION
    // Users should be unique by ID, not by name+icon
    const allUserIds = new Set([...Object.keys(localUsers), ...Object.keys(remoteUsers)]);
    
    allUserIds.forEach(userId => {
      const localUser = localUsers[userId];
      const remoteUser = remoteUsers[userId];
      
      // Handle deletion conflicts
      if (localUser?.deleted && remoteUser?.deleted) {
        // Both deleted - use the one with the later deletion timestamp
        if ((localUser.deletedAt || 0) >= (remoteUser.deletedAt || 0)) {
          mergedUsers[userId] = localUser;
        } else {
          mergedUsers[userId] = remoteUser;
        }
      } else if (localUser?.deleted) {
        // Only local deleted - check if deletion is newer than remote update
        if (remoteUser && !remoteUser.deleted) {
          // If local deletion is recent (within last 30 seconds), keep the deletion
          const recentDeletion = (Date.now() - (localUser.deletedAt || 0)) < 30000;
          if (recentDeletion) {
            mergedUsers[userId] = localUser; // Keep the deletion
          } else {
            mergedUsers[userId] = remoteUser; // Remote wins - user was probably recreated
          }
        } else {
          mergedUsers[userId] = localUser;
        }
      } else if (remoteUser?.deleted) {
        // Only remote deleted
        if (localUser && !localUser.deleted) {
          // If remote deletion is recent, respect it
          const recentDeletion = (Date.now() - (remoteUser.deletedAt || 0)) < 30000;
          if (recentDeletion) {
            mergedUsers[userId] = remoteUser; // Keep the deletion
          } else {
            mergedUsers[userId] = localUser; // Local wins - user is still active
          }
        } else {
          mergedUsers[userId] = remoteUser;
        }
      } else {
        // Neither deleted - merge normally
        if (!localUser) {
          // User only exists remotely
          mergedUsers[userId] = JSON.parse(JSON.stringify(remoteUser));
        } else if (!remoteUser) {
          // User only exists locally
          mergedUsers[userId] = JSON.parse(JSON.stringify(localUser));
        } else {
          // User exists in both - merge while preserving completed states
          mergedUsers[userId] = JSON.parse(JSON.stringify(remoteUser));
          
          const localUserDays = localUser.days || {};
          const mergedUserDays = mergedUsers[userId].days || {};
          
          Object.keys(localUserDays).forEach(day => {
            const localActivities = localUserDays[day]?.activities || [];
            
            if (!mergedUserDays[day]) {
              mergedUserDays[day] = { activities: [] };
            }
            
            const mergedActivities = mergedUserDays[day].activities || [];
            
            // Create a map of local completed activities
            const localCompletedMap = new Map();
            localActivities.forEach(activity => {
              if (activity.completed) {
                localCompletedMap.set(activity.id, true);
              }
            });
            
            // Merge activities while handling deletions and completed states
            const activityMap = new Map();
            
            // Add remote activities first (don't duplicate - use ID as key)
            mergedActivities.forEach(activity => {
              if (!activity.deleted) {
                activityMap.set(activity.id, { ...activity });
              }
            });
            
            // Process local activities
            localActivities.forEach(localActivity => {
              const remoteActivity = activityMap.get(localActivity.id);
              
              if (localActivity.deleted) {
                // If locally deleted recently, remove from map
                if ((Date.now() - (localActivity.deletedAt || 0)) < 30000) {
                  activityMap.delete(localActivity.id);
                }
                // Otherwise, if remote has it non-deleted, keep remote version (already in map)
              } else if (!remoteActivity) {
                // Activity only exists locally - add it
                activityMap.set(localActivity.id, localActivity);
              } else {
                // Activity exists in both - merge states (prefer newer data)
                console.log(`[SYNC-MERGE] Merging activity ${localActivity.id}:`);
                console.log(`  Local: completed=${localActivity.completed}, completedAt=${localActivity.completedAt}, uncompletedAt=${localActivity.uncompletedAt}`);
                console.log(`  Remote: completed=${remoteActivity.completed}, completedAt=${remoteActivity.completedAt}, uncompletedAt=${remoteActivity.uncompletedAt}`);
                
                // Start with a clean activity without completion fields
                const { completedAt, completedBy, uncompletedAt, uncompletedBy, completed, ...cleanActivity } = remoteActivity;
                const merged = { ...cleanActivity, completed: false }; // Default to incomplete
                
                // Handle completion state based on timestamps
                // Compare all timestamp types to determine the most recent action
                const localTimestamp = localActivity.completedAt || localActivity.uncompletedAt || 0;
                const remoteTimestamp = remoteActivity.completedAt || remoteActivity.uncompletedAt || 0;
                
                console.log(`  Timestamps - Local: ${localTimestamp}, Remote: ${remoteTimestamp}`);
                
                // If both have completion timestamps, use the most recent one
                if (localActivity.completedAt && remoteActivity.completedAt) {
                  if (localActivity.completedAt > remoteActivity.completedAt) {
                    // Local completion is newer
                    merged.completed = localActivity.completed;
                    merged.completedAt = localActivity.completedAt;
                    merged.completedBy = localActivity.completedBy;
                  } else {
                    // Remote completion is newer (already in merged from ...remoteActivity)
                    merged.completed = remoteActivity.completed;
                    merged.completedAt = remoteActivity.completedAt;
                    merged.completedBy = remoteActivity.completedBy;
                  }
                } else if (localActivity.completedAt && !remoteActivity.completedAt) {
                  // Local has completion, remote doesn't
                  // Check if remote has uncompletedAt that's newer
                  if (remoteActivity.uncompletedAt && remoteActivity.uncompletedAt > localActivity.completedAt) {
                    // Remote uncompleted is newer
                    merged.completed = false;
                    merged.uncompletedAt = remoteActivity.uncompletedAt;
                    merged.uncompletedBy = remoteActivity.uncompletedBy;
                    delete merged.completedAt;
                    delete merged.completedBy;
                  } else {
                    // Local completion is newer or remote has no timestamp
                    merged.completed = true;
                    merged.completedAt = localActivity.completedAt;
                    merged.completedBy = localActivity.completedBy;
                    delete merged.uncompletedAt;
                    delete merged.uncompletedBy;
                  }
                } else if (!localActivity.completedAt && remoteActivity.completedAt) {
                  // Only remote has completion timestamp - check if local explicitly uncompleted it
                  if (localActivity.completed === false && remoteActivity.completed === true) {
                    // Check if local has uncompletedAt timestamp
                    if (localActivity.uncompletedAt && localActivity.uncompletedAt > remoteActivity.completedAt) {
                      // Local uncompleted action is newer than remote completion
                      merged.completed = false;
                      merged.uncompletedAt = localActivity.uncompletedAt;
                      merged.uncompletedBy = localActivity.uncompletedBy;
                      delete merged.completedAt;
                      delete merged.completedBy;
                    } else {
                      // Remote completion is newer or we can't determine
                      merged.completed = remoteActivity.completed;
                      merged.completedAt = remoteActivity.completedAt;
                      merged.completedBy = remoteActivity.completedBy;
                    }
                  } else {
                    // Keep remote completion state
                    merged.completed = remoteActivity.completed;
                    merged.completedAt = remoteActivity.completedAt;
                    merged.completedBy = remoteActivity.completedBy;
                  }
                } else {
                  // Neither has completion timestamp - check for uncompleted timestamps
                  const localUncompletedAt = localActivity.uncompletedAt || 0;
                  const remoteUncompletedAt = remoteActivity.uncompletedAt || 0;
                  
                  if (localUncompletedAt > remoteUncompletedAt) {
                    // Local uncompleted is newer
                    merged.completed = false;
                    merged.uncompletedAt = localActivity.uncompletedAt;
                    merged.uncompletedBy = localActivity.uncompletedBy;
                    delete merged.completedAt;
                    delete merged.completedBy;
                  } else if (remoteUncompletedAt > localUncompletedAt) {
                    // Remote uncompleted is newer
                    merged.completed = false;
                    merged.uncompletedAt = remoteActivity.uncompletedAt;
                    merged.uncompletedBy = remoteActivity.uncompletedBy;
                    delete merged.completedAt;
                    delete merged.completedBy;
                  } else {
                    // No timestamps at all or equal - use local state as it's current
                    console.log(`  No clear timestamp winner - using local state: completed=${localActivity.completed}`);
                    merged.completed = localActivity.completed || false;
                    if (localActivity.completed && !localActivity.completedAt) {
                      // Add timestamp if missing (for backwards compatibility)
                      merged.completedAt = Date.now();
                      merged.completedBy = localActivity.completedBy || 'unknown';
                      delete merged.uncompletedAt;
                      delete merged.uncompletedBy;
                    } else if (!localActivity.completed) {
                      // Ensure incomplete state is clean
                      delete merged.completedAt;
                      delete merged.completedBy;
                      if (localActivity.uncompletedAt) {
                        merged.uncompletedAt = localActivity.uncompletedAt;
                        merged.uncompletedBy = localActivity.uncompletedBy;
                      }
                    }
                  }
                }
                
                console.log(`  Final merged state: completed=${merged.completed}, completedAt=${merged.completedAt}, uncompletedAt=${merged.uncompletedAt}`);
                
                // Handle deletion conflicts
                if (remoteActivity.deleted && !localActivity.deleted) {
                  // Remote deleted but local is active
                  if ((Date.now() - (remoteActivity.deletedAt || 0)) < 30000) {
                    // Recent remote deletion - respect it
                    activityMap.delete(localActivity.id);
                  } else {
                    // Old deletion - keep local active state
                    delete merged.deleted;
                    delete merged.deletedAt;
                    activityMap.set(localActivity.id, merged);
                  }
                } else {
                  // Update with merged data
                  activityMap.set(localActivity.id, merged);
                }
              }
            });
            
            mergedUserDays[day].activities = Array.from(activityMap.values());
          });
          
          // Add any days that exist only locally
          Object.keys(localUserDays).forEach(day => {
            if (!mergedUserDays[day]) {
              mergedUserDays[day] = JSON.parse(JSON.stringify(localUserDays[day]));
            }
          });
          
          mergedUsers[userId].days = mergedUserDays;
        }
      }
    });
    
    // Return merged users directly - no deduplication needed
    return mergedUsers;
  }
}

export default new ConflictResolver();
