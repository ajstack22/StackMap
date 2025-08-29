/**
 * Simple Conflict Resolution for Minimal Sync
 * 
 * Strategy: Last-Write-Wins (LWW) per field with clear logging
 * No complex CRDT structures, just timestamps and merge logic
 */

class ConflictResolver {
  constructor() {
    this.mergeLog = [];
    this.enableLogging = true;
  }

  /**
   * Main merge function - combines local and remote data
   */
  mergeStates(local, remote) {
    console.log('[ConflictResolver] 🔀 Starting merge');
    this.mergeLog = [];
    
    // Handle edge cases
    if (!local && !remote) {
      this.log('Both states null, returning empty state');
      return this.createEmptyState();
    }
    if (!local) {
      this.log('No local state, using remote');
      return this.addMetadata(remote);
    }
    if (!remote) {
      this.log('No remote state, using local');
      return this.addMetadata(local);
    }

    // Extract metadata
    const localMeta = local.metadata || {};
    const remoteMeta = remote.metadata || {};
    
    // Start with a new merged state
    const merged = {
      users: this.mergeUsers(local.users, remote.users, localMeta, remoteMeta),
      activities: this.mergeActivities(local.activities, remote.activities, localMeta, remoteMeta),
      settings: this.mergeSettings(local.settings, remote.settings, localMeta, remoteMeta),
      library: this.mergeLibrary(local.library, remote.library, localMeta, remoteMeta),
      metadata: this.mergeMetadata(localMeta, remoteMeta)
    };

    // Log summary
    this.logSummary();
    
    return merged;
  }

  /**
   * Merge users - LWW per user
   */
  mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta) {
    if (!localUsers && !remoteUsers) return {};
    if (!localUsers) {
      this.log('No local users, using remote users');
      return remoteUsers || {};
    }
    if (!remoteUsers) {
      this.log('No remote users, using local users');
      return localUsers || {};
    }

    // Get timestamps
    const localTimestamp = (localMeta.fieldTimestamps?.users) || 0;
    const remoteTimestamp = (remoteMeta.fieldTimestamps?.users) || 0;
    
    // Simple LWW for entire users object
    if (remoteTimestamp > localTimestamp) {
      this.log(`Users: Remote wins (${remoteTimestamp} > ${localTimestamp})`);
      return remoteUsers;
    } else if (localTimestamp > remoteTimestamp) {
      this.log(`Users: Local wins (${localTimestamp} > ${remoteTimestamp})`);
      return localUsers;
    } else {
      // Same timestamp - merge additively (keep all unique users)
      this.log('Users: Same timestamp, merging additively');
      const merged = { ...localUsers };
      
      // Add any users from remote that don't exist locally
      Object.keys(remoteUsers).forEach(userId => {
        if (!merged[userId]) {
          merged[userId] = remoteUsers[userId];
          this.log(`  Added user ${userId} from remote`);
        }
      });
      
      return merged;
    }
  }

  /**
   * Merge activities - More granular, activity by activity
   */
  mergeActivities(localActivities, remoteActivities, localMeta, remoteMeta) {
    if (!localActivities && !remoteActivities) return {};
    if (!localActivities) {
      this.log('No local activities, using remote');
      return remoteActivities || {};
    }
    if (!remoteActivities) {
      this.log('No remote activities, using local');
      return localActivities || {};
    }

    const merged = {};
    const allIds = new Set([
      ...Object.keys(localActivities),
      ...Object.keys(remoteActivities)
    ]);

    allIds.forEach(activityId => {
      const local = localActivities[activityId];
      const remote = remoteActivities[activityId];
      
      if (!local && remote) {
        // New activity from remote
        merged[activityId] = remote;
        this.log(`Activity ${activityId}: New from remote`);
      } else if (local && !remote) {
        // Activity only exists locally
        merged[activityId] = local;
        this.log(`Activity ${activityId}: Only exists locally`);
      } else if (local && remote) {
        // Activity exists in both - compare timestamps
        const localTime = local.modifiedAt || local.createdAt || 0;
        const remoteTime = remote.modifiedAt || remote.createdAt || 0;
        
        if (remoteTime > localTime) {
          merged[activityId] = remote;
          this.log(`Activity ${activityId}: Remote wins (${remoteTime} > ${localTime})`);
        } else if (localTime > remoteTime) {
          merged[activityId] = local;
          this.log(`Activity ${activityId}: Local wins (${localTime} > ${remoteTime})`);
        } else {
          // Same timestamp - use device ID as tiebreaker
          const winner = this.tiebreaker(localMeta.deviceId, remoteMeta.deviceId);
          merged[activityId] = winner === 'local' ? local : remote;
          this.log(`Activity ${activityId}: Tie broken by device ID (${winner})`);
        }
      }
    });

    return merged;
  }

  /**
   * Merge settings - LWW for entire settings object
   */
  mergeSettings(localSettings, remoteSettings, localMeta, remoteMeta) {
    if (!localSettings && !remoteSettings) return {};
    if (!localSettings) {
      this.log('No local settings, using remote');
      return remoteSettings || {};
    }
    if (!remoteSettings) {
      this.log('No remote settings, using local');
      return localSettings || {};
    }

    const localTimestamp = (localMeta.fieldTimestamps?.settings) || 0;
    const remoteTimestamp = (remoteMeta.fieldTimestamps?.settings) || 0;
    
    if (remoteTimestamp > localTimestamp) {
      this.log(`Settings: Remote wins (${remoteTimestamp} > ${localTimestamp})`);
      return remoteSettings;
    } else if (localTimestamp > remoteTimestamp) {
      this.log(`Settings: Local wins (${localTimestamp} > ${remoteTimestamp})`);
      return localSettings;
    } else {
      // Same timestamp - use device ID as tiebreaker
      const winner = this.tiebreaker(localMeta.deviceId, remoteMeta.deviceId);
      this.log(`Settings: Tie broken by device ID (${winner})`);
      return winner === 'local' ? localSettings : remoteSettings;
    }
  }

  /**
   * Merge library - Additive merge (keep all categories)
   */
  mergeLibrary(localLibrary, remoteLibrary, localMeta, remoteMeta) {
    if (!localLibrary && !remoteLibrary) return {};
    if (!localLibrary) {
      this.log('No local library, using remote');
      return remoteLibrary || {};
    }
    if (!remoteLibrary) {
      this.log('No remote library, using local');
      return localLibrary || {};
    }

    // For library, we do additive merge - keep all unique categories
    this.log('Library: Additive merge (keeping all categories)');
    const merged = { ...localLibrary };
    
    Object.keys(remoteLibrary).forEach(categoryId => {
      if (!merged[categoryId]) {
        merged[categoryId] = remoteLibrary[categoryId];
        this.log(`  Added category ${categoryId} from remote`);
      } else {
        // Category exists in both - merge activities within it
        const localCat = merged[categoryId];
        const remoteCat = remoteLibrary[categoryId];
        
        // Merge activities array (keep unique)
        const allActivities = new Set([
          ...(localCat.activities || []),
          ...(remoteCat.activities || [])
        ]);
        
        merged[categoryId] = {
          ...localCat,
          activities: Array.from(allActivities)
        };
        
        if (allActivities.size > (localCat.activities?.length || 0)) {
          this.log(`  Merged activities in category ${categoryId}`);
        }
      }
    });
    
    return merged;
  }

  /**
   * Merge metadata
   */
  mergeMetadata(localMeta, remoteMeta) {
    const now = Date.now();
    
    return {
      lastModified: now,
      lastMerged: now,
      deviceId: localMeta.deviceId || this.generateDeviceId(),
      fieldTimestamps: {
        users: Math.max(
          localMeta.fieldTimestamps?.users || 0,
          remoteMeta.fieldTimestamps?.users || 0
        ),
        activities: Math.max(
          localMeta.fieldTimestamps?.activities || 0,
          remoteMeta.fieldTimestamps?.activities || 0
        ),
        settings: Math.max(
          localMeta.fieldTimestamps?.settings || 0,
          remoteMeta.fieldTimestamps?.settings || 0
        ),
        library: Math.max(
          localMeta.fieldTimestamps?.library || 0,
          remoteMeta.fieldTimestamps?.library || 0
        )
      },
      mergeLog: this.mergeLog.slice(-10) // Keep last 10 merge decisions
    };
  }

  /**
   * Deterministic tiebreaker using device IDs
   */
  tiebreaker(localDeviceId, remoteDeviceId) {
    if (!localDeviceId && !remoteDeviceId) return 'local';
    if (!localDeviceId) return 'remote';
    if (!remoteDeviceId) return 'local';
    
    // Alphabetically compare device IDs for deterministic result
    return localDeviceId < remoteDeviceId ? 'local' : 'remote';
  }

  /**
   * Add metadata to a state if it doesn't have it
   */
  addMetadata(state) {
    if (!state) return this.createEmptyState();
    
    if (!state.metadata) {
      const now = Date.now();
      state.metadata = {
        lastModified: now,
        deviceId: this.generateDeviceId(),
        fieldTimestamps: {
          users: now,
          activities: now,
          settings: now,
          library: now
        }
      };
    }
    
    return state;
  }

  /**
   * Create an empty state with metadata
   */
  createEmptyState() {
    const now = Date.now();
    return {
      users: {},
      activities: {},
      settings: {},
      library: {},
      metadata: {
        lastModified: now,
        deviceId: this.generateDeviceId(),
        fieldTimestamps: {
          users: now,
          activities: now,
          settings: now,
          library: now
        }
      }
    };
  }

  /**
   * Generate a simple device ID
   */
  generateDeviceId() {
    // Simple hex ID (16 chars)
    return Math.random().toString(16).substring(2, 10) + 
           Math.random().toString(16).substring(2, 10);
  }

  /**
   * Log merge decision
   */
  log(message) {
    if (this.enableLogging) {
      console.log(`[ConflictResolver] ${message}`);
      this.mergeLog.push({
        timestamp: Date.now(),
        message
      });
    }
  }

  /**
   * Log merge summary
   */
  logSummary() {
    if (this.enableLogging && this.mergeLog.length > 0) {
      console.log('[ConflictResolver] 📊 Merge Summary:');
      console.log(`  Total decisions: ${this.mergeLog.length}`);
      
      const remoteWins = this.mergeLog.filter(l => l.message.includes('Remote wins')).length;
      const localWins = this.mergeLog.filter(l => l.message.includes('Local wins')).length;
      const ties = this.mergeLog.filter(l => l.message.includes('Tie broken')).length;
      
      console.log(`  Remote wins: ${remoteWins}`);
      console.log(`  Local wins: ${localWins}`);
      console.log(`  Ties resolved: ${ties}`);
    }
  }

  /**
   * Get the merge log for debugging
   */
  getMergeLog() {
    return this.mergeLog;
  }

  /**
   * Clear the merge log
   */
  clearLog() {
    this.mergeLog = [];
  }
}

// Export singleton instance
export default new ConflictResolver();