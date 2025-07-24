import { useAppStore } from '../../stores';

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
  completedActivities: STRATEGIES.MERGE,
  
  // Objects - merge properties
  users: STRATEGIES.MERGE,
  
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
      
      if (resolution.requiresUserInput) {
        needsUserInput.push(conflict);
      } else {
        resolved.push(resolution);
      }
    }
    
    // Add to history
    this.conflictHistory.push(...resolved);
    this.pendingConflicts = needsUserInput;
    
    return {
      resolved,
      pending: needsUserInput,
      finalState: this.applyResolutions(resolved)
    };
  }

  /**
   * Resolve a single conflict
   */
  async resolveConflict(conflict, options = {}) {
    const { strategy = conflict.strategy, preferLocal = false } = options;
    
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
        resolution.requiresUserInput = true;
        resolution.choices = {
          local: conflict.localValue,
          remote: conflict.remoteValue,
          merge: this.mergeValues(conflict.field, conflict.localValue, conflict.remoteValue)
        };
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
      if (field === 'completedActivities') {
        // For completed activities, merge by unique ID
        const merged = [...localValue];
        const localIds = new Set(localValue.map(item => 
          `${item.id}_${item.userId}_${item.date}`
        ));
        
        for (const item of remoteValue) {
          const itemId = `${item.id}_${item.userId}_${item.date}`;
          if (!localIds.has(itemId)) {
            merged.push(item);
          }
        }
        
        return merged;
      } else if (field === 'activities') {
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
}

export default new ConflictResolver();