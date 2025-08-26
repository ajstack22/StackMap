/**
 * CRDT-based merger for conflict-free sync
 * Uses Last-Write-Wins (LWW) strategy per field
 */

import eventLogger from './eventLogger';

class CRDTMerger {
  /**
   * Convert a regular value to CRDT format
   */
  toCRDT(value, timestamp, deviceId) {
    return {
      value,
      timestamp: timestamp || 0,  // Use 0 as default, not Date.now()
      device: deviceId || 'unknown'
    };
  }

  /**
   * Extract value from CRDT format
   */
  fromCRDT(crdtValue) {
    if (!crdtValue || typeof crdtValue !== 'object') {
      return crdtValue;
    }
    return crdtValue.value !== undefined ? crdtValue.value : crdtValue;
  }

  /**
   * Merge two CRDT values using LWW strategy
   */
  mergeCRDTValues(local, remote) {
    // Handle null/undefined cases
    if (!local && !remote) return null;
    if (!local) return remote;
    if (!remote) return local;

    // If neither is CRDT format, prefer local (current state)
    if (!this.isCRDT(local) && !this.isCRDT(remote)) {
      return local;
    }

    // Convert to CRDT format if needed
    const localCRDT = this.isCRDT(local) ? local : this.toCRDT(local, Date.now(), 'local');
    const remoteCRDT = this.isCRDT(remote) ? remote : this.toCRDT(remote, Date.now() - 1, 'remote');

    // Last-write-wins: compare timestamps
    if (localCRDT.timestamp > remoteCRDT.timestamp) {
      return localCRDT;
    } else if (remoteCRDT.timestamp > localCRDT.timestamp) {
      return remoteCRDT;
    } else {
      // Same timestamp - use device ID as tiebreaker (deterministic)
      return (localCRDT.device || '') > (remoteCRDT.device || '') ? localCRDT : remoteCRDT;
    }
  }

  /**
   * Check if value is in CRDT format
   */
  isCRDT(value) {
    return value && 
           typeof value === 'object' && 
           'value' in value && 
           'timestamp' in value;
  }

  /**
   * Convert activity to CRDT format
   */
  activityToCRDT(activity, deviceId) {
    if (!activity) return null;

    const crdtActivity = {
      id: activity.id,
      // Convert text field
      text: this.isCRDT(activity.text) ? activity.text : 
            this.toCRDT(activity.text, activity.modifiedAt || 0, deviceId),
      
      // Convert icon field
      icon: this.isCRDT(activity.icon) ? activity.icon :
            this.toCRDT(activity.icon, activity.modifiedAt || 0, deviceId),
      
      // Handle completion state specially
      completed: this.createCompletionCRDT(activity, deviceId),
      
      // Convert other fields
      pinned: this.isCRDT(activity.pinned) ? activity.pinned :
              this.toCRDT(!!activity.pinned, activity.modifiedAt || 0, deviceId),
      
      deleted: this.isCRDT(activity.deleted) ? activity.deleted :
               this.toCRDT(!!activity.deleted, activity.deletedAt || activity.modifiedAt || 0, deviceId)
    };

    // Preserve any additional fields
    Object.keys(activity).forEach(key => {
      if (!crdtActivity[key] && key !== 'modifiedAt' && key !== 'completedAt' && 
          key !== 'uncompletedAt' && key !== 'deletedAt') {
        crdtActivity[key] = activity[key];
      }
    });

    return crdtActivity;
  }

  /**
   * Create CRDT for completion state with proper timestamp handling
   */
  createCompletionCRDT(activity, deviceId) {
    // Determine the most recent completion-related action
    const completedAt = activity.completedAt || 0;
    const uncompletedAt = activity.uncompletedAt || 0;
    
    // Use the most recent timestamp
    let timestamp;
    let value;
    
    if (completedAt > uncompletedAt) {
      timestamp = completedAt;
      value = true;
    } else if (uncompletedAt > completedAt) {
      timestamp = uncompletedAt;
      value = false;
    } else {
      // No timestamps or equal - use current state with modifiedAt
      timestamp = activity.modifiedAt || 0;
      value = !!activity.completed;
    }

    return {
      value,
      timestamp,
      device: activity.completedBy || activity.uncompletedBy || deviceId || 'unknown'
    };
  }

  /**
   * Convert CRDT activity back to regular format
   */
  activityFromCRDT(crdtActivity) {
    if (!crdtActivity) return null;

    const activity = {
      id: crdtActivity.id,
      text: this.fromCRDT(crdtActivity.text),
      icon: this.fromCRDT(crdtActivity.icon),
      completed: this.fromCRDT(crdtActivity.completed),
      pinned: this.fromCRDT(crdtActivity.pinned),
      deleted: this.fromCRDT(crdtActivity.deleted)
    };

    // Add timestamps based on completion state
    const completionCRDT = crdtActivity.completed;
    if (this.isCRDT(completionCRDT)) {
      if (completionCRDT.value) {
        activity.completedAt = completionCRDT.timestamp;
        activity.completedBy = completionCRDT.device;
      } else {
        activity.uncompletedAt = completionCRDT.timestamp;
        activity.uncompletedBy = completionCRDT.device;
      }
    }

    // Set modifiedAt to the most recent field change
    const timestamps = [
      crdtActivity.text?.timestamp || 0,
      crdtActivity.icon?.timestamp || 0,
      crdtActivity.completed?.timestamp || 0,
      crdtActivity.pinned?.timestamp || 0,
      crdtActivity.deleted?.timestamp || 0
    ];
    activity.modifiedAt = Math.max(...timestamps);

    // Preserve any additional fields
    Object.keys(crdtActivity).forEach(key => {
      if (!activity[key] && key !== 'text' && key !== 'icon' && 
          key !== 'completed' && key !== 'pinned' && key !== 'deleted') {
        activity[key] = crdtActivity[key];
      }
    });

    return activity;
  }

  /**
   * Merge two activities using CRDT rules
   */
  mergeActivities(localActivity, remoteActivity, deviceId) {
    if (!localActivity && !remoteActivity) return null;
    if (!localActivity) return remoteActivity;
    if (!remoteActivity) return localActivity;

    eventLogger.logConflict('MERGE_ACTIVITY', {
      activityId: localActivity.id,
      localCompleted: localActivity.completed,
      remoteCompleted: remoteActivity.completed,
      localTimestamp: localActivity.modifiedAt || localActivity.completedAt || localActivity.uncompletedAt,
      remoteTimestamp: remoteActivity.modifiedAt || remoteActivity.completedAt || remoteActivity.uncompletedAt
    });

    // Convert both to CRDT format
    const localCRDT = this.activityToCRDT(localActivity, deviceId);
    const remoteCRDT = this.activityToCRDT(remoteActivity, 'remote');

    // Merge each field
    const mergedCRDT = {
      id: localCRDT.id,
      text: this.mergeCRDTValues(localCRDT.text, remoteCRDT.text),
      icon: this.mergeCRDTValues(localCRDT.icon, remoteCRDT.icon),
      completed: this.mergeCRDTValues(localCRDT.completed, remoteCRDT.completed),
      pinned: this.mergeCRDTValues(localCRDT.pinned, remoteCRDT.pinned),
      deleted: this.mergeCRDTValues(localCRDT.deleted, remoteCRDT.deleted)
    };

    // Convert back to regular format
    const merged = this.activityFromCRDT(mergedCRDT);

    eventLogger.logConflict('MERGE_RESULT', {
      activityId: merged.id,
      resultCompleted: merged.completed,
      resultTimestamp: merged.modifiedAt
    });

    return merged;
  }

  /**
   * Merge activity arrays
   */
  mergeActivityArrays(localActivities = [], remoteActivities = [], deviceId) {
    const mergedActivities = [];
    const processedIds = new Set();

    // Log the merge operation
    eventLogger.log('ACTIVITY_MERGE', 'START', {
      localCount: localActivities.length,
      remoteCount: remoteActivities.length,
      deviceId
    });

    // Create a map of remote activities for quick lookup
    const remoteMap = new Map();
    remoteActivities.forEach(activity => {
      if (activity && activity.id) {
        remoteMap.set(activity.id, activity);
      }
    });

    // Process activities in local order first (preserves user's arrangement)
    localActivities.forEach((localActivity, index) => {
      if (!localActivity || !localActivity.id) return;
      
      const remoteActivity = remoteMap.get(localActivity.id);
      if (remoteActivity) {
        // Merge the two versions
        const merged = this.mergeActivities(localActivity, remoteActivity, deviceId);
        if (merged && !merged.deleted) {
          mergedActivities.push(merged);
          processedIds.add(localActivity.id);
        }
      } else {
        // Only exists locally
        if (!localActivity.deleted) {
          mergedActivities.push(localActivity);
          processedIds.add(localActivity.id);
        }
      }
    });

    // Add any remote activities that weren't in local (new activities from other devices)
    remoteActivities.forEach(remoteActivity => {
      if (remoteActivity && remoteActivity.id && !processedIds.has(remoteActivity.id)) {
        if (!remoteActivity.deleted) {
          mergedActivities.push(remoteActivity);
        }
      }
    });

    eventLogger.log('ACTIVITY_MERGE', 'COMPLETE', {
      mergedCount: mergedActivities.length,
      localOrder: localActivities.map(a => a?.id).filter(Boolean),
      mergedOrder: mergedActivities.map(a => a?.id).filter(Boolean)
    });

    return mergedActivities;
  }

  /**
   * Merge complete user data structures
   */
  mergeUsers(localUsers = {}, remoteUsers = {}, deviceId) {
    const mergedUsers = {};

    // Get all unique user IDs
    const allUserIds = new Set([
      ...Object.keys(localUsers),
      ...Object.keys(remoteUsers)
    ]);

    allUserIds.forEach(userId => {
      const localUser = localUsers[userId];
      const remoteUser = remoteUsers[userId];

      if (!localUser && !remoteUser) return;
      if (!localUser) {
        mergedUsers[userId] = remoteUser;
        return;
      }
      if (!remoteUser) {
        mergedUsers[userId] = localUser;
        return;
      }

      // Merge user properties
      mergedUsers[userId] = {
        ...localUser,
        ...remoteUser,
        // Merge name with LWW based on modification time
        name: this.mergeSimpleValue(
          localUser.name, 
          remoteUser.name,
          localUser.modifiedAt,
          remoteUser.modifiedAt
        ),
        // Merge icon similarly
        icon: this.mergeSimpleValue(
          localUser.icon,
          remoteUser.icon,
          localUser.modifiedAt,
          remoteUser.modifiedAt
        ),
        // Merge days
        days: this.mergeDays(localUser.days, remoteUser.days, deviceId)
      };
    });

    return mergedUsers;
  }

  /**
   * Merge days structure
   */
  mergeDays(localDays = {}, remoteDays = {}, deviceId) {
    const mergedDays = {};

    // Get all unique day keys
    const allDays = new Set([
      ...Object.keys(localDays),
      ...Object.keys(remoteDays)
    ]);

    allDays.forEach(day => {
      const localDay = localDays[day];
      const remoteDay = remoteDays[day];

      if (!localDay && !remoteDay) return;
      if (!localDay) {
        mergedDays[day] = remoteDay;
        return;
      }
      if (!remoteDay) {
        mergedDays[day] = localDay;
        return;
      }

      // Merge activities for this day
      mergedDays[day] = {
        activities: this.mergeActivityArrays(
          localDay.activities,
          remoteDay.activities,
          deviceId
        )
      };
    });

    return mergedDays;
  }

  /**
   * Simple LWW merge for non-CRDT values
   */
  mergeSimpleValue(localValue, remoteValue, localTime, remoteTime) {
    if (localValue === remoteValue) return localValue;
    if (!localTime && !remoteTime) return localValue;
    if (!remoteTime || localTime > remoteTime) return localValue;
    return remoteValue;
  }

  /**
   * Main merge function for complete state
   */
  mergeStates(localState, remoteState, deviceId) {
    eventLogger.logSync('CRDT_MERGE_START', {
      localUserCount: Object.keys(localState.users || {}).length,
      remoteUserCount: Object.keys(remoteState.users || {}).length
    });

    const merged = {
      users: this.mergeUsers(localState.users, remoteState.users, deviceId),
      library: { ...remoteState.library, ...localState.library }, // Simple merge for library
      globalSettings: { ...remoteState.globalSettings, ...localState.globalSettings },
      currentUser: localState.currentUser || remoteState.currentUser,
      currentDay: localState.currentDay || remoteState.currentDay
    };

    eventLogger.logSync('CRDT_MERGE_COMPLETE', {
      mergedUserCount: Object.keys(merged.users).length,
      totalActivities: Object.values(merged.users).reduce((sum, user) => 
        sum + Object.values(user.days || {}).reduce((daySum, day) => 
          daySum + (day.activities?.length || 0), 0), 0)
    });

    return merged;
  }
}

// Export singleton instance
export default new CRDTMerger();