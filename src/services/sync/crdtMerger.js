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
      
      // Convert description field (if present)
      description: activity.description !== undefined ? 
        (this.isCRDT(activity.description) ? activity.description :
         this.toCRDT(activity.description, activity.modifiedAt || 0, deviceId)) : undefined,
      
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
    
    // Add description if present
    if (crdtActivity.description !== undefined) {
      activity.description = this.fromCRDT(crdtActivity.description);
    }

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
      deleted: this.mergeCRDTValues(localCRDT.deleted, remoteCRDT.deleted),
      // Handle description as CRDT if present
      description: (localCRDT.description || remoteCRDT.description) ? 
        this.mergeCRDTValues(localCRDT.description, remoteCRDT.description) : undefined
    };
    
    // Preserve any other additional non-CRDT fields (future compatibility)
    Object.keys(localCRDT).forEach(key => {
      if (!mergedCRDT.hasOwnProperty(key) && key !== 'modifiedAt' && key !== 'completedAt' && 
          key !== 'uncompletedAt' && key !== 'deletedAt') {
        mergedCRDT[key] = localCRDT[key];
      }
    });
    Object.keys(remoteCRDT).forEach(key => {
      if (!mergedCRDT.hasOwnProperty(key) && key !== 'modifiedAt' && key !== 'completedAt' && 
          key !== 'uncompletedAt' && key !== 'deletedAt') {
        mergedCRDT[key] = remoteCRDT[key];
      }
    });

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

    // Create maps for quick lookup
    const localMap = new Map();
    localActivities.forEach(activity => {
      if (activity && activity.id) {
        localMap.set(activity.id, activity);
      }
    });
    
    const remoteMap = new Map();
    remoteActivities.forEach(activity => {
      if (activity && activity.id) {
        remoteMap.set(activity.id, activity);
      }
    });
    
    // Check if either side has explicit reorder timestamps
    const localOrderTime = Math.max(...localActivities.map(a => a?.orderChangedAt || 0), 0);
    const remoteOrderTime = Math.max(...remoteActivities.map(a => a?.orderChangedAt || 0), 0);
    
    // Use the order with the most recent reorder operation
    const useRemoteOrder = remoteOrderTime > localOrderTime;
    
    if (useRemoteOrder && remoteActivities.some(a => a?.sortIndex !== undefined)) {
      // Remote has newer order - sort by sortIndex if available
      const sortedRemote = [...remoteActivities].sort((a, b) => 
        (a?.sortIndex ?? Number.MAX_VALUE) - (b?.sortIndex ?? Number.MAX_VALUE)
      );
      
      sortedRemote.forEach(remoteActivity => {
        if (!remoteActivity || !remoteActivity.id) return;
        
        const localActivity = localMap.get(remoteActivity.id);
        if (localActivity) {
          // Merge field values using CRDT, but keep remote position
          const merged = this.mergeActivities(localActivity, remoteActivity, deviceId);
          if (merged && !merged.deleted) {
            mergedActivities.push(merged);
            processedIds.add(remoteActivity.id);
          }
        } else {
          // Only exists remotely
          if (!remoteActivity.deleted) {
            mergedActivities.push(remoteActivity);
            processedIds.add(remoteActivity.id);
          }
        }
      });
    } else {
      // Use local order or remote order as-is if no sortIndex
      const primaryActivities = useRemoteOrder ? remoteActivities : localActivities;
      const otherMap = useRemoteOrder ? localMap : remoteMap;
      
      primaryActivities.forEach(primaryActivity => {
        if (!primaryActivity || !primaryActivity.id) return;
        
        const otherActivity = otherMap.get(primaryActivity.id);
        if (otherActivity) {
          // Merge the two versions
          const localAct = useRemoteOrder ? otherActivity : primaryActivity;
          const remoteAct = useRemoteOrder ? primaryActivity : otherActivity;
          const merged = this.mergeActivities(localAct, remoteAct, deviceId);
          if (merged && !merged.deleted) {
            mergedActivities.push(merged);
            processedIds.add(primaryActivity.id);
          }
        } else {
          // Only exists in primary
          if (!primaryActivity.deleted) {
            mergedActivities.push(primaryActivity);
            processedIds.add(primaryActivity.id);
          }
        }
      });
    }
    
    // Add any activities that weren't processed (new items from other source)
    const processedSource = useRemoteOrder ? localActivities : remoteActivities;
    processedSource.forEach(activity => {
      if (activity && activity.id && !processedIds.has(activity.id)) {
        if (!activity.deleted) {
          mergedActivities.push(activity);
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

    console.log('[CRDTMerger] mergeUsers start:', {
      localUserIds: Object.keys(localUsers),
      remoteUserIds: Object.keys(remoteUsers)
    });

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
        console.log(`[CRDTMerger] User ${userId} only exists remotely`);
        mergedUsers[userId] = remoteUser;
        return;
      }
      if (!remoteUser) {
        console.log(`[CRDTMerger] User ${userId} only exists locally`);
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
    console.log('[CRDTMerger] mergeStates START:', {
      local: {
        userCount: Object.keys(localState.users || {}).length,
        currentUser: localState.currentUser,
        activities: localState.users?.[localState.currentUser]?.days?.today?.activities?.length || 0
      },
      remote: {
        userCount: Object.keys(remoteState.users || {}).length,
        currentUser: remoteState.currentUser,
        activities: remoteState.users?.[remoteState.currentUser]?.days?.today?.activities?.length || 0
      }
    });

    eventLogger.logSync('CRDT_MERGE_START', {
      localUserCount: Object.keys(localState.users || {}).length,
      remoteUserCount: Object.keys(remoteState.users || {}).length
    });

    // CRITICAL: If local has no meaningful data (e.g., just joined), prefer remote entirely
    const localActivityCount = Object.values(localState.users || {}).reduce((sum, user) => 
      sum + Object.values(user.days || {}).reduce((daySum, day) => 
        daySum + (day.activities?.length || 0), 0), 0);
    
    const remoteActivityCount = Object.values(remoteState.users || {}).reduce((sum, user) => 
      sum + Object.values(user.days || {}).reduce((daySum, day) => 
        daySum + (day.activities?.length || 0), 0), 0);
    
    console.log('[CRDTMerger] Activity counts:', { localActivityCount, remoteActivityCount });
    
    // If local has no activities but remote does, just use remote state entirely
    // This handles the case when Browser B joins and shouldn't merge its starter data
    if (localActivityCount === 0 && remoteActivityCount > 0) {
      console.log('[CRDTMerger] Local has no activities, using remote state entirely');
      return {
        ...remoteState,
        currentUser: remoteState.currentUser || localState.currentUser,
        currentDay: remoteState.currentDay || localState.currentDay
      };
    }

    const merged = {
      users: this.mergeUsers(localState.users, remoteState.users, deviceId),
      library: { ...remoteState.library, ...localState.library }, // Simple merge for library
      globalSettings: { ...remoteState.globalSettings, ...localState.globalSettings },
      currentUser: localState.currentUser || remoteState.currentUser,
      currentDay: localState.currentDay || remoteState.currentDay
    };

    console.log('[CRDTMerger] mergeStates COMPLETE:', {
      mergedUserCount: Object.keys(merged.users).length,
      mergedCurrentUser: merged.currentUser,
      mergedActivities: merged.users?.[merged.currentUser]?.days?.today?.activities?.length || 0,
      firstActivity: merged.users?.[merged.currentUser]?.days?.today?.activities?.[0]?.text
    });

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