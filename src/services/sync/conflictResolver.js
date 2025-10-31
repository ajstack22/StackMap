/**
 * Simple Conflict Resolution for Minimal Sync
 *
 * Strategy: Last-Write-Wins (LWW) per field with clear logging
 * No complex CRDT structures, just timestamps and merge logic
 */

import { getActivityText } from '../../utils/fieldAccessors';

class ConflictResolver {
  constructor() {
    this.mergeLog = [];
    this.enableLogging = true;
  }

  /**
   * Main merge function - combines local and remote data
   */
  mergeStates(local, remote) {
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
   * @description Merge users with per-user granular merge
   * @param {Object} localUsers - Local users object
   * @param {Object} remoteUsers - Remote users object
   * @param {Object} localMeta - Local metadata
   * @param {Object} remoteMeta - Remote metadata
   * @returns {Object} Merged users object
   */
  mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta) {
    // Handle edge cases first
    const edgeResult = this.handleUserEdgeCases(localUsers, remoteUsers);
    if (edgeResult !== null) return edgeResult;

    // Check for significant time difference
    const timeBasedResult = this.checkUserTimestamps(
      localUsers, remoteUsers, localMeta, remoteMeta
    );
    if (timeBasedResult !== null) return timeBasedResult;

    // Perform detailed merge
    return this.performDetailedUserMerge(localUsers, remoteUsers, localMeta, remoteMeta);
  }

  /**
   * @description Handle edge cases where one or both user sets are missing
   * @param {Object} localUsers - Local users
   * @param {Object} remoteUsers - Remote users
   * @returns {Object|null} Users object or null to continue
   * @private
   */
  handleUserEdgeCases(localUsers, remoteUsers) {
    if (!localUsers && !remoteUsers) return {};

    if (!localUsers) {
      this.log('No local users, using remote users');
      return remoteUsers || {};
    }

    if (!remoteUsers) {
      this.log('No remote users, using local users');
      return localUsers || {};
    }

    return null; // Continue with normal merge
  }

  /**
   * @description Check if timestamps indicate one side should win entirely
   * @param {Object} localUsers - Local users
   * @param {Object} remoteUsers - Remote users
   * @param {Object} localMeta - Local metadata
   * @param {Object} remoteMeta - Remote metadata
   * @returns {Object|null} Users object or null to continue
   * @private
   */
  checkUserTimestamps(localUsers, remoteUsers, localMeta, remoteMeta) {
    const localUserTime = localMeta?.fieldTimestamps?.users || 0;
    const remoteUserTime = remoteMeta?.fieldTimestamps?.users || 0;
    const TIME_THRESHOLD = 3000; // 3 seconds

    // Check if remote is significantly newer
    if (remoteUserTime > localUserTime + TIME_THRESHOLD) {
      const diff = (remoteUserTime - localUserTime) / 1000;
      this.log(`Using remote users (newer by ${diff}s)`);
      return remoteUsers;
    }

    // Check if local is significantly newer
    if (localUserTime > remoteUserTime + TIME_THRESHOLD) {
      const diff = (localUserTime - remoteUserTime) / 1000;
      this.log(`Using local users (newer by ${diff}s)`);
      return localUsers;
    }

    return null; // Continue with detailed merge
  }

  /**
   * @description Perform detailed user-by-user merge
   * @param {Object} localUsers - Local users
   * @param {Object} remoteUsers - Remote users
   * @param {Object} localMeta - Local metadata
   * @param {Object} remoteMeta - Remote metadata
   * @returns {Object} Merged users
   * @private
   */
  performDetailedUserMerge(localUsers, remoteUsers, localMeta, remoteMeta) {
    const merged = {};
    const allUserIds = new Set([
      ...Object.keys(localUsers),
      ...Object.keys(remoteUsers)
    ]);

    allUserIds.forEach(userId => {
      const localUser = localUsers[userId];
      const remoteUser = remoteUsers[userId];

      merged[userId] = this.mergeUser(
        localUser, remoteUser, userId, localMeta, remoteMeta
      );
    });

    return merged;
  }

  /**
   * @description Merge a single user
   * @param {Object} localUser - Local user data
   * @param {Object} remoteUser - Remote user data
   * @param {string} userId - User ID
   * @param {Object} localMeta - Local metadata
   * @param {Object} remoteMeta - Remote metadata
   * @returns {Object} Merged user
   * @private
   */
  mergeUser(localUser, remoteUser, userId, localMeta, remoteMeta) {
    // User only exists remotely
    if (!localUser && remoteUser) {
      this.log(`User ${userId}: Added from remote`);
      return remoteUser;
    }

    // User only exists locally
    if (localUser && !remoteUser) {
      this.log(`User ${userId}: Kept local (not in remote)`);
      return localUser;
    }

    // User exists in both - merge based on modification
    if (localUser && remoteUser) {
      return this.mergeIndividualUser(
        localUser, remoteUser, userId, localMeta, remoteMeta
      );
    }

    // Should not reach here
    return null;
  }
  
  /**
   * @description Merge individual user with activity preservation
   * @param {Object} localUser - Local user data
   * @param {Object} remoteUser - Remote user data
   * @param {string} userId - User ID
   * @param {Object} localMeta - Local metadata
   * @param {Object} remoteMeta - Remote metadata
   * @returns {Object} Merged user data
   */
  mergeIndividualUser(localUser, remoteUser, userId, localMeta, remoteMeta) {
    // Determine base user from timestamps
    const mergedUser = this.selectBaseUser(localUser, remoteUser, userId);

    // Handle timestamp equality or missing timestamps
    if (this.shouldMergeUserProperties(localUser, remoteUser)) {
      this.mergeUserProperties(
        mergedUser, localUser, remoteUser, localMeta, remoteMeta
      );
    }

    // Merge days/activities additively
    this.mergeUserActivities(mergedUser, localUser, remoteUser);

    return mergedUser;
  }

  /**
   * @description Select base user based on modification timestamps
   * @param {Object} localUser - Local user
   * @param {Object} remoteUser - Remote user
   * @param {string} userId - User ID for logging
   * @returns {Object} Base user object
   * @private
   */
  selectBaseUser(localUser, remoteUser, userId) {
    const localModified = localUser.lastModified || 0;
    const remoteModified = remoteUser.lastModified || 0;

    if (remoteModified > localModified) {
      this.log(`User ${userId}: Using remote as base (${remoteModified} > ${localModified})`);
      return { ...remoteUser };
    }

    if (localModified > remoteModified) {
      this.log(`User ${userId}: Using local as base (${localModified} > ${remoteModified})`);
      return { ...localUser };
    }

    // Equal or no timestamps - default to local
    return { ...localUser };
  }

  /**
   * @description Check if user properties need merging
   * @param {Object} localUser - Local user
   * @param {Object} remoteUser - Remote user
   * @returns {boolean} True if properties should be merged
   * @private
   */
  shouldMergeUserProperties(localUser, remoteUser) {
    const localModified = localUser.lastModified || 0;
    const remoteModified = remoteUser.lastModified || 0;

    // Only merge properties if timestamps are equal or missing
    return localModified === remoteModified;
  }

  /**
   * @description Merge user name and icon properties
   * @param {Object} mergedUser - User object to update
   * @param {Object} localUser - Local user
   * @param {Object} remoteUser - Remote user
   * @param {Object} localMeta - Local metadata
   * @param {Object} remoteMeta - Remote metadata
   * @private
   */
  mergeUserProperties(mergedUser, localUser, remoteUser, localMeta, remoteMeta) {
    // Check if name or icon differs
    const hasPropertyDifference =
      remoteUser.name !== localUser.name ||
      remoteUser.icon !== localUser.icon;

    if (!hasPropertyDifference) return;

    // Use device ID as tiebreaker
    const localDeviceId = localUser.deviceId || localMeta?.deviceId;
    const remoteDeviceId = remoteUser.deviceId || remoteMeta?.deviceId;
    const winner = this.tiebreaker(localDeviceId, remoteDeviceId);

    if (winner === 'remote') {
      mergedUser.name = remoteUser.name;
      mergedUser.icon = remoteUser.icon;
    }
  }

  /**
   * @description Merge user activities from both sources
   * @param {Object} mergedUser - User object to update
   * @param {Object} localUser - Local user
   * @param {Object} remoteUser - Remote user
   * @private
   */
  mergeUserActivities(mergedUser, localUser, remoteUser) {
    if (!localUser.days && !remoteUser.days) return;

    mergedUser.days = this.mergeUserDays(
      localUser.days || {},
      remoteUser.days || {}
    );
  }
  
  /**
   * Merge user days and activities additively
   */
  mergeUserDays(localDays, remoteDays) {
    if (!localDays && !remoteDays) return {};
    if (!localDays) return remoteDays;
    if (!remoteDays) return localDays;
    
    const merged = {};
    const allDays = new Set([
      ...Object.keys(localDays),
      ...Object.keys(remoteDays)
    ]);
    
    allDays.forEach(day => {
      const localDay = localDays[day];
      const remoteDay = remoteDays[day];
      
      if (!localDay) {
        merged[day] = remoteDay;
      } else if (!remoteDay) {
        merged[day] = localDay;
      } else {
        // Merge activities for this day
        // Explicitly exclude activities from spread to prevent override
        const { activities: _localAct, ...localWithoutActivities } = localDay;
        const { activities: _remoteAct, ...remoteWithoutActivities } = remoteDay;

        merged[day] = {
          ...localWithoutActivities,
          ...remoteWithoutActivities,
          // Explicitly merge activities - guaranteed not overridden by spread
          activities: this.mergeActivitiesArray(
            localDay.activities || [],
            remoteDay.activities || []
          )
        };
      }
    });
    
    return merged;
  }
  
  /**
   * Merge activities arrays - additive with deduplication
   */
  mergeActivitiesArray(localActivities, remoteActivities) {
    const merged = [...localActivities];
    const existingIds = new Set(localActivities.map(a => a.id));
    
    remoteActivities.forEach(activity => {
      if (!existingIds.has(activity.id)) {
        merged.push(activity);
        this.log(`  Added activity: ${getActivityText(activity)}`);
      } else {
        // Activity exists - check if remote is newer
        const localActivity = localActivities.find(a => a.id === activity.id);
        const localTime = localActivity?.modifiedAt || localActivity?.createdAt || 0;
        const remoteTime = activity.modifiedAt || activity.createdAt || 0;

        if (remoteTime > localTime) {
          const index = merged.findIndex(a => a.id === activity.id);
          merged[index] = activity;
          this.log(`  Updated activity: ${getActivityText(activity)}`);
        }
      }
    });
    
    return merged;
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
      return localSettings ?? {};
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
   * Merge library - Granular merge preserving all data
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

    // Start with a merged structure
    const merged = {};
    
    // Merge categories array additively
    if (localLibrary.categories || remoteLibrary.categories) {
      merged.categories = this.mergeLibraryCategories(
        localLibrary.categories,
        remoteLibrary.categories
      );
    }
    
    // Merge templates array additively
    if (localLibrary.templates || remoteLibrary.templates) {
      merged.templates = this.mergeLibraryTemplates(
        localLibrary.templates,
        remoteLibrary.templates
      );
    }
    
    // Merge activities array additively
    if (localLibrary.activities || remoteLibrary.activities) {
      merged.activities = this.mergeLibraryActivities(
        localLibrary.activities,
        remoteLibrary.activities
      );
    }
    
    // Merge userAddedActivityIds - union of both sets
    if (localLibrary.userAddedActivityIds || remoteLibrary.userAddedActivityIds) {
      const localIds = localLibrary.userAddedActivityIds || [];
      const remoteIds = remoteLibrary.userAddedActivityIds || [];
      merged.userAddedActivityIds = [...new Set([...localIds, ...remoteIds])];
      
      if (merged.userAddedActivityIds.length > localIds.length) {
        this.log(`Library: Added ${merged.userAddedActivityIds.length - localIds.length} user activity IDs from remote`);
      }
    }
    
    // Preserve any other properties
    const allKeys = new Set([
      ...Object.keys(localLibrary),
      ...Object.keys(remoteLibrary)
    ]);
    
    allKeys.forEach(key => {
      if (!['categories', 'templates', 'activities', 'userAddedActivityIds'].includes(key)) {
        // For other properties, use LWW based on timestamps
        const localTimestamp = (localMeta.fieldTimestamps?.library) || 0;
        const remoteTimestamp = (remoteMeta.fieldTimestamps?.library) || 0;
        
        if (remoteTimestamp > localTimestamp) {
          merged[key] = remoteLibrary[key];
        } else if (localTimestamp > remoteTimestamp) {
          merged[key] = localLibrary[key];
        } else {
          // Same timestamp - merge if possible, otherwise use tiebreaker
          merged[key] = localLibrary[key]; // Default to local
        }
      }
    });
    
    return merged;
  }
  
  /**
   * Merge library categories additively
   */
  mergeLibraryCategories(localCategories, remoteCategories) {
    if (!localCategories) return remoteCategories || [];
    if (!remoteCategories) return localCategories;
    
    // Handle both array and object formats
    const localArray = Array.isArray(localCategories) ? localCategories : [];
    const remoteArray = Array.isArray(remoteCategories) ? remoteCategories : [];
    
    const merged = [...localArray];
    const existingIds = new Set(localArray.map(c => c.id || c.name));
    
    remoteArray.forEach(category => {
      const categoryId = category.id || category.name;
      if (!existingIds.has(categoryId)) {
        merged.push(category);
        this.log(`  Added category: ${category.name}`);
      }
    });
    
    return merged;
  }
  
  /**
   * Merge library templates additively
   */
  mergeLibraryTemplates(localTemplates, remoteTemplates) {
    if (!localTemplates) return remoteTemplates || [];
    if (!remoteTemplates) return localTemplates;
    
    const merged = [...localTemplates];
    const existingIds = new Set(localTemplates.map(t => t.id));
    
    remoteTemplates.forEach(template => {
      if (!existingIds.has(template.id)) {
        merged.push(template);
        this.log(`  Added template: ${template.name || template.text}`);
      }
    });
    
    return merged;
  }
  
  /**
   * Merge library activities additively
   */
  mergeLibraryActivities(localActivities, remoteActivities) {
    if (!localActivities) return remoteActivities || [];
    if (!remoteActivities) return localActivities;
    
    const merged = [...localActivities];
    const existingIds = new Set(localActivities.map(a => a.id));
    
    remoteActivities.forEach(activity => {
      if (!existingIds.has(activity.id)) {
        merged.push(activity);
        this.log(`  Added library activity: ${getActivityText(activity)}`);
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
    // Use crypto.getRandomValues for secure ID generation
    if (typeof global !== 'undefined' && global.crypto?.getRandomValues) {
      const bytes = new Uint8Array(8);
      global.crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Fallback: use Date.now() and a counter for uniqueness
      const timestamp = Date.now().toString(16);
      const counter = (this.idCounter = (this.idCounter || 0) + 1).toString(16).padStart(4, '0');
      return timestamp + counter;
    }
  }

  /**
   * Log merge decision
   */
  log(message) {
    if (this.enableLogging) {
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
      // Could add merge statistics logging here if needed
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