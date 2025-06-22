# StackMap Migration Guide

## Overview

This guide provides detailed instructions for migrating between different versions of StackMap, handling data format changes, and ensuring smooth upgrades for users.

## Version History

### Current Version: 1.4.0 (June 2025)
- Enhanced mobile experience
- Improved sync system with operation log
- Unified panel management system
- Better error handling and recovery

### Previous Versions
- **1.3.0**: Multi-user support, card library system
- **1.2.0**: Google Drive sync, PWA enhancements
- **1.1.0**: Day-specific schedules, time badges
- **1.0.0**: Initial release with core features

## Data Migration Strategies

### 1. Automatic Migration on Load

```javascript
// In StackMapApp.loadFromLocalStorage()
loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem(this.getStorageKey('stackmap-data'));
        if (!stored) return false;
        
        let data = JSON.parse(stored);
        
        // Check data version and migrate if needed
        data = this.migrateData(data);
        
        // Apply migrated data
        this.appState.loadFromJSON(data);
        return true;
    } catch (error) {
        console.error('[Migration] Load error:', error);
        return this.handleCorruptedData();
    }
}

migrateData(data) {
    const currentVersion = CONFIG.DATA_VERSION;
    const dataVersion = data.version || '0.1';
    
    if (dataVersion === currentVersion) {
        return data; // No migration needed
    }
    
    console.log(`[Migration] Migrating from ${dataVersion} to ${currentVersion}`);
    
    // Apply migrations in sequence
    let migrated = data;
    
    if (this.versionCompare(dataVersion, '1.0') < 0) {
        migrated = this.migrateTo1_0(migrated);
    }
    
    if (this.versionCompare(dataVersion, '1.1') < 0) {
        migrated = this.migrateTo1_1(migrated);
    }
    
    if (this.versionCompare(dataVersion, '1.2') < 0) {
        migrated = this.migrateTo1_2(migrated);
    }
    
    if (this.versionCompare(dataVersion, '1.3') < 0) {
        migrated = this.migrateTo1_3(migrated);
    }
    
    if (this.versionCompare(dataVersion, '1.4') < 0) {
        migrated = this.migrateTo1_4(migrated);
    }
    
    // Update version
    migrated.version = currentVersion;
    
    // Save migrated data
    this.saveToLocalStorage();
    
    return migrated;
}
```

### 2. Version-Specific Migrations

#### Migration to 1.0 (Initial Structure)
```javascript
migrateTo1_0(data) {
    console.log('[Migration] Applying 1.0 migration');
    
    // Ensure basic structure
    const migrated = {
        version: '1.0',
        activities: Array.isArray(data) ? data : (data.activities || []),
        settings: data.settings || {
            title: 'StackMap User',
            subtitle: 'Routine Ready',
            backgroundColor: '#667eea',
            showNumbers: true,
            showCompletionIndicators: true
        }
    };
    
    // Ensure all activities have required fields
    migrated.activities = migrated.activities.map((activity, index) => ({
        id: activity.id || `act-${Date.now()}-${index}`,
        emoji: activity.emoji || '⭐',
        title: activity.title || 'Activity',
        description: activity.description || '',
        completed: Boolean(activity.completed),
        cardNumber: activity.cardNumber || (index + 1),
        backgroundColor: activity.backgroundColor || '#667eea'
    }));
    
    return migrated;
}
```

#### Migration to 1.1 (Day-Specific Schedules)
```javascript
migrateTo1_1(data) {
    console.log('[Migration] Applying 1.1 migration');
    
    const migrated = { ...data };
    
    // Add day context to activities
    migrated.activities = migrated.activities.map(activity => ({
        ...activity,
        dayContext: activity.dayContext || 'today',
        time: activity.time || null
    }));
    
    // Initialize UI state
    migrated.ui = migrated.ui || {
        editMode: false,
        currentDay: 'today',
        selectedEmoji: '⭐'
    };
    
    return migrated;
}
```

#### Migration to 1.2 (Google Drive Sync)
```javascript
migrateTo1_2(data) {
    console.log('[Migration] Applying 1.2 migration');
    
    const migrated = { ...data };
    
    // Add sync metadata
    migrated.syncMetadata = {
        version: 0,
        lastModified: new Date().toISOString(),
        deviceId: this.generateDeviceId(),
        deviceName: this.getDeviceName()
    };
    
    // Add sync settings
    migrated.settings = {
        ...migrated.settings,
        autoSync: true,
        backupReminder: true
    };
    
    return migrated;
}
```

#### Migration to 1.3 (Multi-User Support)
```javascript
migrateTo1_3(data) {
    console.log('[Migration] Applying 1.3 migration');
    
    const migrated = { ...data };
    
    // Convert to multi-user structure
    const defaultUser = {
        id: CONFIG.DEFAULT_USER_ID,
        name: migrated.settings?.title || 'StackMap User',
        activities: migrated.activities || [],
        tomorrowActivities: [], // New in 1.3
        settings: migrated.settings || {},
        library: [] // Personal card library
    };
    
    // Create users structure
    migrated.users = {
        currentUserId: CONFIG.DEFAULT_USER_ID,
        profiles: {
            [CONFIG.DEFAULT_USER_ID]: defaultUser
        },
        groupLibrary: [] // Shared library
    };
    
    // Move activities to user profile
    delete migrated.activities;
    
    // Add card type to activities
    defaultUser.activities = defaultUser.activities.map(activity => ({
        ...activity,
        recurring: activity.recurring !== false, // Default true
        libraryCard: false
    }));
    
    return migrated;
}
```

#### Migration to 1.4 (Enhanced Sync & UI)
```javascript
migrateTo1_4(data) {
    console.log('[Migration] Applying 1.4 migration');
    
    const migrated = { ...data };
    
    // Add operation log structure
    migrated._operationLog = [];
    migrated._dirtyUsers = [];
    migrated._dirtyActivities = {};
    
    // Update sync metadata
    migrated.syncMetadata = {
        ...migrated.syncMetadata,
        syncQueue: [],
        lastSyncAttempt: null,
        syncErrors: []
    };
    
    // Ensure all users have tomorrow activities
    if (migrated.users?.profiles) {
        Object.values(migrated.users.profiles).forEach(user => {
            if (!user.tomorrowActivities) {
                // Clone today's activities for tomorrow
                user.tomorrowActivities = this.deepCloneActivities(
                    user.activities || [],
                    true // Generate new IDs
                );
            }
        });
    }
    
    // Add new UI state fields
    migrated.ui = {
        ...migrated.ui,
        fabExpanded: false,
        fabAnimating: false,
        cardFilter: ''
    };
    
    return migrated;
}
```

### 3. Data Structure Validation

```javascript
// Validate migrated data structure
validateDataStructure(data) {
    const errors = [];
    
    // Check version
    if (!data.version) {
        errors.push('Missing version field');
    }
    
    // Check users structure
    if (!data.users || !data.users.profiles) {
        errors.push('Invalid users structure');
    }
    
    // Check each user profile
    Object.entries(data.users.profiles || {}).forEach(([userId, user]) => {
        if (!user.id || user.id !== userId) {
            errors.push(`User ${userId} has mismatched ID`);
        }
        
        if (!Array.isArray(user.activities)) {
            errors.push(`User ${userId} has invalid activities`);
        }
        
        // Validate each activity
        user.activities.forEach((activity, index) => {
            if (!activity.id) {
                errors.push(`Activity ${index} missing ID`);
            }
            if (!activity.title) {
                errors.push(`Activity ${activity.id} missing title`);
            }
        });
    });
    
    if (errors.length > 0) {
        console.error('[Validation] Data structure errors:', errors);
        throw new ValidationError(errors);
    }
    
    return true;
}
```

### 4. Backup Before Migration

```javascript
// Always backup before migration
createBackupBeforeMigration(data) {
    const backup = {
        timestamp: new Date().toISOString(),
        version: data.version || 'unknown',
        data: JSON.parse(JSON.stringify(data)) // Deep clone
    };
    
    try {
        // Store backup
        const backupKey = `stackmap-backup-${backup.timestamp}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));
        
        // Keep only last 3 backups
        this.cleanupOldBackups();
        
        console.log(`[Backup] Created backup: ${backupKey}`);
        return backupKey;
    } catch (error) {
        console.error('[Backup] Failed to create backup:', error);
        // Continue with migration anyway
        return null;
    }
}

cleanupOldBackups() {
    const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('stackmap-backup-'))
        .sort()
        .reverse();
    
    // Keep only the 3 most recent
    backupKeys.slice(3).forEach(key => {
        localStorage.removeItem(key);
    });
}
```

## Import/Export Migration

### 1. Import Compatibility

```javascript
// Handle imports from different versions
importData(importedData) {
    try {
        // Parse if string
        const data = typeof importedData === 'string' 
            ? JSON.parse(importedData) 
            : importedData;
        
        // Check version compatibility
        const importVersion = data.version || '0.1';
        const currentVersion = CONFIG.DATA_VERSION;
        
        if (this.versionCompare(importVersion, currentVersion) > 0) {
            throw new Error(
                `Cannot import data from newer version (${importVersion}). ` +
                `Please update StackMap first.`
            );
        }
        
        // Migrate if needed
        const migrated = this.migrateData(data);
        
        // Validate structure
        this.validateDataStructure(migrated);
        
        // Merge or replace
        return this.mergeImportedData(migrated);
        
    } catch (error) {
        console.error('[Import] Error:', error);
        throw new ImportError(error.message);
    }
}
```

### 2. Export with Version Info

```javascript
// Export data with migration info
exportData() {
    const exportData = {
        version: CONFIG.DATA_VERSION,
        exportDate: new Date().toISOString(),
        appVersion: CONFIG.APP_VERSION,
        deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
        },
        data: this.appState.toJSON()
    };
    
    // Add migration history if available
    exportData.migrationHistory = this.getMigrationHistory();
    
    return exportData;
}
```

## Storage Migration

### 1. LocalStorage Key Migration

```javascript
// Migrate old storage keys to new format
migrateStorageKeys() {
    const keyMappings = {
        // Old key -> New key
        'stackmap-activities': 'stackmap-data',
        'stackmap-preferences': 'stackmap-settings',
        'stackmap-theme': 'stackmap-data',
        'stackMapDemoMode': 'stackmap-demo-mode'
    };
    
    Object.entries(keyMappings).forEach(([oldKey, newKey]) => {
        const oldData = localStorage.getItem(oldKey);
        if (oldData && !localStorage.getItem(newKey)) {
            console.log(`[Migration] Moving ${oldKey} to ${newKey}`);
            localStorage.setItem(newKey, oldData);
            localStorage.removeItem(oldKey);
        }
    });
}
```

### 2. Storage Format Migration

```javascript
// Migrate storage format (e.g., compressed to uncompressed)
migrateStorageFormat() {
    try {
        const keys = Object.keys(localStorage)
            .filter(key => key.startsWith('stackmap-'));
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            
            // Check if compressed (old format)
            if (this.isCompressed(value)) {
                const decompressed = this.decompress(value);
                localStorage.setItem(key, decompressed);
                console.log(`[Migration] Decompressed ${key}`);
            }
        });
    } catch (error) {
        console.error('[Migration] Storage format migration failed:', error);
    }
}
```

## UI Migration

### 1. Settings Migration

```javascript
// Migrate UI settings to new format
migrateUISettings(oldSettings) {
    const migrated = {
        // Map old settings to new
        theme: {
            primaryColor: oldSettings.backgroundColor || '#667eea',
            mode: oldSettings.darkMode ? 'dark' : 'light'
        },
        display: {
            showNumbers: oldSettings.showNumbers ?? true,
            showCompletions: oldSettings.showCompletionIndicators ?? true,
            cardSize: oldSettings.largeCards ? 'large' : 'normal'
        },
        accessibility: {
            reduceMotion: oldSettings.disableAnimations ?? false,
            highContrast: oldSettings.highContrast ?? false
        }
    };
    
    return migrated;
}
```

### 2. Component State Migration

```javascript
// Migrate component states
migrateComponentStates() {
    // Old panel state to new
    const oldPanelState = localStorage.getItem('stackmap-panel-state');
    if (oldPanelState) {
        const state = JSON.parse(oldPanelState);
        
        // Convert to new format
        const newState = {
            leftPanelOpen: state.preferencesOpen || false,
            rightPanelOpen: state.managementOpen || false,
            activePanel: null
        };
        
        // Save in new format
        this.hybridPanelManager.setState(newState);
        
        // Remove old state
        localStorage.removeItem('stackmap-panel-state');
    }
}
```

## Testing Migrations

### 1. Migration Test Suite

```javascript
// Test migration functions
describe('Data Migration', () => {
    it('should migrate from v1.0 to current', () => {
        const oldData = {
            activities: [
                { title: 'Test', emoji: '🧪' }
            ],
            settings: { title: 'User' }
        };
        
        const migrated = migrateData(oldData);
        
        expect(migrated.version).toBe(CONFIG.DATA_VERSION);
        expect(migrated.users.profiles.default.activities).toHaveLength(1);
        expect(migrated.users.profiles.default.activities[0].id).toBeDefined();
    });
    
    it('should handle corrupted data gracefully', () => {
        const corrupted = { invalid: 'data' };
        
        const migrated = migrateData(corrupted);
        
        expect(migrated.version).toBe(CONFIG.DATA_VERSION);
        expect(migrated.users).toBeDefined();
    });
});
```

### 2. Migration Simulation

```javascript
// Development tool to test migrations
class MigrationTester {
    static async testMigration(fromVersion, toVersion) {
        // Load test data for version
        const testData = await this.loadTestData(fromVersion);
        
        // Perform migration
        console.time('Migration');
        const migrated = migrateData(testData);
        console.timeEnd('Migration');
        
        // Validate result
        try {
            validateDataStructure(migrated);
            console.log('✅ Migration successful');
            return { success: true, data: migrated };
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return { success: false, error };
        }
    }
}
```

## Rollback Procedures

### 1. Automatic Rollback

```javascript
// Rollback on migration failure
async performSafeMigration(data) {
    // Create backup
    const backupKey = this.createBackupBeforeMigration(data);
    
    try {
        // Attempt migration
        const migrated = this.migrateData(data);
        
        // Validate
        this.validateDataStructure(migrated);
        
        // Test critical functionality
        await this.testCriticalFunctions(migrated);
        
        // Success - apply migrated data
        this.appState.loadFromJSON(migrated);
        
        console.log('[Migration] Completed successfully');
        return { success: true };
        
    } catch (error) {
        console.error('[Migration] Failed, rolling back:', error);
        
        // Restore from backup
        if (backupKey) {
            const backup = localStorage.getItem(backupKey);
            if (backup) {
                const backupData = JSON.parse(backup);
                this.appState.loadFromJSON(backupData.data);
                console.log('[Migration] Rolled back to backup');
            }
        }
        
        return { success: false, error };
    }
}
```

### 2. Manual Rollback

```javascript
// User-initiated rollback
showRollbackOptions() {
    const backups = this.getAvailableBackups();
    
    const modal = `
        <div class="rollback-modal">
            <h2>Restore Previous Version</h2>
            <p>Select a backup to restore:</p>
            <ul>
                ${backups.map(backup => `
                    <li>
                        <button onclick="app.restoreBackup('${backup.key}')">
                            ${backup.date} - Version ${backup.version}
                        </button>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    this.showModal(modal);
}
```

## Communication

### 1. Migration Notices

```javascript
// Inform users about migration
showMigrationNotice(fromVersion, toVersion) {
    const notice = document.createElement('div');
    notice.className = 'migration-notice';
    notice.innerHTML = `
        <div class="notice-content">
            <h3>StackMap Updated!</h3>
            <p>Your data has been upgraded from version ${fromVersion} to ${toVersion}.</p>
            <p>New features available:</p>
            <ul>
                ${this.getNewFeatures(toVersion).map(feature => 
                    `<li>${feature}</li>`
                ).join('')}
            </ul>
            <button onclick="this.parentElement.parentElement.remove()">
                Got it!
            </button>
        </div>
    `;
    
    document.body.appendChild(notice);
}
```

### 2. Migration Documentation

Always update:
1. Version number in `CONFIG.DATA_VERSION`
2. Migration function for new version
3. This migration guide
4. User-facing changelog
5. Test cases for migration

## Best Practices

1. **Always backup** before migration
2. **Test migrations** thoroughly
3. **Validate data** after migration
4. **Provide rollback** options
5. **Communicate changes** to users
6. **Handle edge cases** gracefully
7. **Log migration steps** for debugging
8. **Keep migrations idempotent**
9. **Test with real user data** (anonymized)
10. **Monitor migration success** rates

## Troubleshooting

### Common Migration Issues

1. **Storage Quota Exceeded**
   - Clean up old backups
   - Compress data if needed
   - Prompt user to export data

2. **Corrupted Data**
   - Attempt repair
   - Fall back to defaults
   - Restore from backup

3. **Version Mismatch**
   - Check version comparison logic
   - Handle future versions gracefully
   - Provide clear error messages

4. **Performance Issues**
   - Migrate in chunks for large datasets
   - Show progress indicator
   - Use Web Workers if needed

## Conclusion

Proper migration handling ensures users can seamlessly upgrade to new versions while preserving their important routine data. Always prioritize data integrity and user experience during migrations.