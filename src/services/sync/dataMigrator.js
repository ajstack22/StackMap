/**
 * Data migrator for converting old sync format to CRDT format
 * Handles one-time migration when old data is detected
 */

import crdtMerger from './crdtMerger';

class DataMigrator {
  /**
   * Check if data needs migration
   */
  needsMigration(data) {
    if (!data || !data.users) return false;
    
    // Check if any activity lacks CRDT format or has old field names
    for (const userId in data.users) {
      const user = data.users[userId];
      if (user.days) {
        for (const day in user.days) {
          const activities = user.days[day]?.activities || [];
          for (const activity of activities) {
            // Check for old field names or missing CRDT format
            if (activity && (
              !this.hasCRDTFormat(activity) ||
              activity.title !== undefined ||
              activity.emoji !== undefined ||
              activity.name !== undefined
            )) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if an activity has CRDT format
   */
  hasCRDTFormat(activity) {
    // Check if key fields are in CRDT format
    return (
      crdtMerger.isCRDT(activity.text) ||
      crdtMerger.isCRDT(activity.icon) ||
      crdtMerger.isCRDT(activity.completed)
    );
  }
  
  /**
   * Migrate data to CRDT format
   */
  migrateToCRDT(data, deviceId = 'migrated') {
    if (!data || !data.users) return data;
    
    console.log('[DataMigrator] Starting migration to CRDT format');
    
    const migratedData = {
      ...data,
      users: {}
    };
    
    // Migrate each user
    for (const userId in data.users) {
      const user = data.users[userId];
      migratedData.users[userId] = {
        ...user,
        days: {}
      };
      
      // Migrate each day's activities
      if (user.days) {
        for (const day in user.days) {
          const dayData = user.days[day];
          const activities = dayData?.activities || [];
          
          // Convert each activity to CRDT format
          const migratedActivities = activities.map(activity => {
            if (!activity) return null;
            
            // Skip if already fully in CRDT format with correct field names
            if (this.hasCRDTFormat(activity) && 
                activity.title === undefined && 
                activity.emoji === undefined &&
                activity.name === undefined) {
              return activity;
            }
            
            // Determine timestamp for migration
            const timestamp = activity.modifiedAt || 
                            activity.completedAt || 
                            activity.uncompletedAt || 
                            activity.createdAt || 
                            Date.now();
            
            // Normalize field names and convert to CRDT format
            const normalized = {
              id: activity.id,
              text: activity.text || activity.name || activity.title || '',
              icon: activity.icon || activity.emoji || '📝',
              description: activity.description || '',
              completed: !!activity.completed,
              pinned: !!activity.pinned,
              deleted: !!activity.deleted,
              modifiedAt: timestamp,
              completedAt: activity.completedAt || (activity.completed ? timestamp : 0),
              uncompletedAt: activity.uncompletedAt || (!activity.completed ? timestamp : 0),
              completedBy: activity.completedBy || deviceId,
              uncompletedBy: activity.uncompletedBy || deviceId,
              deletedAt: activity.deletedAt || (activity.deleted ? timestamp : 0),
              // Preserve sort order if it exists
              orderChangedAt: activity.orderChangedAt,
              sortIndex: activity.sortIndex
            };
            
            // Convert to CRDT format
            return crdtMerger.activityToCRDT(normalized, deviceId);
          }).filter(Boolean);
          
          migratedData.users[userId].days[day] = {
            ...dayData,
            activities: migratedActivities
          };
        }
      }
    }
    
    console.log('[DataMigrator] Migration complete', {
      userCount: Object.keys(migratedData.users).length,
      totalActivities: Object.values(migratedData.users).reduce(
        (sum, user) => sum + Object.values(user.days || {}).reduce(
          (daySum, day) => daySum + (day.activities?.length || 0), 0
        ), 0
      )
    });
    
    return migratedData;
  }
  
  /**
   * Check and migrate data if needed
   */
  async checkAndMigrate(data, deviceId) {
    if (this.needsMigration(data)) {
      console.log('[DataMigrator] Old format detected, migrating to CRDT');
      return this.migrateToCRDT(data, deviceId);
    }
    return data;
  }
}

export default new DataMigrator();