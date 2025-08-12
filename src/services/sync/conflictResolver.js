import { useAppStore } from '../../stores';
import { validateSyncedData, repairSyncedData } from './dataValidator';

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
          
          resolution.resolvedValue = this.mergeUsersPreservingCompleted(
            conflict.localValue,
            conflict.remoteValue
          );
          
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
        
        // Merge remote activities (overwrites if same ID)
        for (const activity of remoteValue) {
          const existing = activityMap.get(activity.id);
          if (!existing || (activity.lastModified || 0) > (existing.lastModified || 0)) {
            activityMap.set(activity.id, activity);
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
    const newState = { ...currentState };
    
    for (const resolution of resolutions) {
      if (!resolution.requiresUserInput && resolution.resolvedValue !== undefined) {
        newState[resolution.field] = resolution.resolvedValue;
      }
    }
    
    // Validate the final state
    if (!validateSyncedData(newState)) {
      console.error('Conflict resolution resulted in invalid state, attempting repair');
      
      // Try to repair the state
      const repairedState = repairSyncedData(newState);
      
      if (!validateSyncedData(repairedState)) {
        console.error('Conflict resolution repair failed, state still invalid');
        // Log more details for debugging
        console.error('Current state:', currentState);
        console.error('Resolutions applied:', resolutions);
        console.error('Failed state:', newState);
        throw new Error('Conflict resolution failed validation');
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
    
    // Track users by name and emoji to detect duplicates
    const usersByNameAndEmoji = new Map();
    const processedUserIds = new Set();
    
    // First, process all users from both local and remote
    const allUserIds = new Set([...Object.keys(localUsers), ...Object.keys(remoteUsers)]);
    
    // Build a map of existing users by name+emoji to detect duplicates
    allUserIds.forEach(userId => {
      const user = localUsers[userId] || remoteUsers[userId];
      if (user && !user.deleted) {
        const key = `${user.name}|${user.icon}`;
        if (!usersByNameAndEmoji.has(key)) {
          usersByNameAndEmoji.set(key, []);
        }
        usersByNameAndEmoji.get(key).push({ userId, source: localUsers[userId] ? 'local' : 'remote' });
      }
    });
    
    allUserIds.forEach(userId => {
      // Skip if already processed as part of deduplication
      if (processedUserIds.has(userId)) {
        return;
      }
      const localUser = localUsers[userId];
      const remoteUser = remoteUsers[userId];
      
      // Check for duplicates before processing
      if (localUser && !localUser.deleted || remoteUser && !remoteUser.deleted) {
        const user = localUser || remoteUser;
        const key = `${user.name}|${user.icon}`;
        const duplicates = usersByNameAndEmoji.get(key) || [];
        
        if (duplicates.length > 1) {
          // Found duplicates - merge them into one user

          // Choose the oldest user ID as the primary one
          const sortedDuplicates = duplicates.sort((a, b) => {
            const aId = a.userId;
            const bId = b.userId;
            // Extract timestamp from user ID (user_<timestamp>_<index>)
            const aTimestamp = parseInt(aId.split('_')[1]) || 0;
            const bTimestamp = parseInt(bId.split('_')[1]) || 0;
            return aTimestamp - bTimestamp;
          });
          
          const primaryUserId = sortedDuplicates[0].userId;
          
          // If this is not the primary user, skip it
          if (userId !== primaryUserId) {
            processedUserIds.add(userId);
            return;
          }
          
          // Merge all duplicate users into the primary one
          let mergedUser = null;
          const mergedDays = {};
          
          duplicates.forEach(dup => {
            processedUserIds.add(dup.userId);
            const dupUser = localUsers[dup.userId] || remoteUsers[dup.userId];
            
            if (!mergedUser) {
              mergedUser = JSON.parse(JSON.stringify(dupUser));
              mergedUser.id = primaryUserId;
            }
            
            // Merge activities from all duplicates
            const dupDays = dupUser.days || {};
            Object.keys(dupDays).forEach(day => {
              if (!mergedDays[day]) {
                mergedDays[day] = { activities: [] };
              }
              
              const activities = dupDays[day]?.activities || [];
              // Add activities, avoiding duplicates by ID
              const existingIds = new Set(mergedDays[day].activities.map(a => a.id));
              activities.forEach(activity => {
                if (!existingIds.has(activity.id) && !activity.deleted) {
                  mergedDays[day].activities.push(activity);
                }
              });
            });
          });
          
          if (mergedUser) {
            mergedUser.days = mergedDays;
            mergedUsers[primaryUserId] = mergedUser;
          }
          return;
        }
      }
      
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
            
            // Add remote activities first
            mergedActivities.forEach(activity => {
              activityMap.set(activity.id, { ...activity });
            });
            
            // Process local activities
            localActivities.forEach(localActivity => {
              const remoteActivity = activityMap.get(localActivity.id);
              
              if (localActivity.deleted) {
                // If locally deleted recently, keep the deletion
                if ((Date.now() - (localActivity.deletedAt || 0)) < 30000) {
                  activityMap.set(localActivity.id, localActivity);
                }
                // Otherwise, if remote has it non-deleted, keep remote version
              } else if (!remoteActivity) {
                // Activity only exists locally
                activityMap.set(localActivity.id, localActivity);
              } else {
                // Activity exists in both - merge states
                const merged = { ...remoteActivity };
                
                // Preserve local completed state
                if (localActivity.completed) {
                  merged.completed = true;
                }
                
                // Handle deletion conflicts
                if (remoteActivity.deleted && !localActivity.deleted) {
                  // Remote deleted but local is active
                  if ((Date.now() - (remoteActivity.deletedAt || 0)) < 30000) {
                    // Recent remote deletion - respect it
                    merged.deleted = true;
                    merged.deletedAt = remoteActivity.deletedAt;
                  } else {
                    // Old deletion - keep local active state
                    delete merged.deleted;
                    delete merged.deletedAt;
                  }
                }
                
                activityMap.set(localActivity.id, merged);
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
    
    return mergedUsers;
  }
}

export default new ConflictResolver();