/**
 * Migration: Tasks to Activities
 * Safely migrates all task references to activity references
 * Version 2.0.0 - Enhanced with backup, progress tracking, and data transformation
 */

(function() {
    'use strict';
    
    const TaskToActivityMigration = {
        version: '2.0.0',
        
        // Migration state
        state: {
            inProgress: false,
            currentStep: '',
            progress: 0,
            totalItems: 0,
            processedItems: 0,
            errors: [],
            backupData: null
        },
        
        /**
         * Check if migration is needed
         */
        isNeeded: function() {
            const migrationStatus = localStorage.getItem('stackmap_migration_tasks_to_activities');
            return migrationStatus !== 'completed';
        },
        
        /**
         * Run the migration with progress tracking
         */
        migrate: function(callback, progressCallback) {
            const self = this;
            
            // Error boundary wrapper
            try {
                if (self.state.inProgress) {
                    console.warn('Migration: Already in progress');
                    if (callback) callback(false, 'Migration already in progress');
                    return;
                }
                
                self.state.inProgress = true;
                self.state.errors = [];
                console.log('Migration: Starting tasks to activities migration v' + self.version);
                
                // Set up global error handler
                const originalOnError = window.onerror;
                window.onerror = function(msg, url, line, col, error) {
                    console.error('Migration: Global error caught', error);
                    self.state.errors.push({
                        type: 'global',
                        message: msg,
                        error: error
                    });
                    // Don't prevent default error handling
                    if (originalOnError) {
                        return originalOnError(msg, url, line, col, error);
                    }
                    return false;
                };
            
            // Create backup first
            self.createBackup(function(backupSuccess) {
                if (!backupSuccess) {
                    console.error('Migration: Failed to create backup');
                    self.state.inProgress = false;
                    if (callback) callback(false, 'Failed to create backup');
                    return;
                }
                
                // Migration steps with progress tracking
                const steps = [
                    { name: 'localStorage', fn: self.migrateLocalStorage.bind(self), weight: 20 },
                    { name: 'SQLite', fn: self.migrateSQLiteData.bind(self), weight: 30 },
                    { name: 'dataTransform', fn: self.transformStoredData.bind(self), weight: 30 },
                    { name: 'updateCache', fn: self.updateCachedData.bind(self), weight: 10 },
                    { name: 'verify', fn: self.verifyMigration.bind(self), weight: 10 }
                ];
                
                self.runStepsWithProgress(steps, function(success, error) {
                    // Restore original error handler
                    window.onerror = originalOnError;
                    
                    // Pass result to callback
                    if (callback) callback(success, error);
                }, progressCallback);
            });
            
            } catch (error) {
                // Catch any synchronous errors
                console.error('Migration: Fatal error', error);
                self.state.inProgress = false;
                self.state.errors.push({
                    type: 'fatal',
                    message: error.message,
                    error: error
                });
                if (callback) callback(false, 'Fatal error: ' + error.message);
            }
        },
        
        /**
         * Create backup before migration
         */
        createBackup: function(callback) {
            const self = this;
            console.log('Migration: Creating backup');
            
            try {
                const backup = {
                    version: self.version,
                    timestamp: new Date().toISOString(),
                    localStorage: {},
                    sqliteKeys: []
                };
                
                // Backup localStorage
                const keysToBackup = ['stackmap_tasks', 'stackmap_tasks_backup', 'stackmap_task_drafts', 'stackmap_last_task_id'];
                keysToBackup.forEach(function(key) {
                    const value = localStorage.getItem(key);
                    if (value !== null) {
                        backup.localStorage[key] = value;
                    }
                });
                
                // Backup user-specific keys
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes('task') && !keysToBackup.includes(key)) {
                        backup.localStorage[key] = localStorage.getItem(key);
                    }
                }
                
                // Store backup
                self.state.backupData = backup;
                localStorage.setItem('stackmap_migration_backup_' + Date.now(), JSON.stringify(backup));
                console.log('Migration: Backup created successfully');
                callback(true);
            } catch (error) {
                console.error('Migration: Backup failed', error);
                callback(false, error);
            }
        },
        
        /**
         * Run migration steps with progress tracking
         */
        runStepsWithProgress: function(steps, callback, progressCallback) {
            const self = this;
            let currentStepIndex = 0;
            let cumulativeWeight = 0;
            
            // Calculate total weight
            const totalWeight = steps.reduce(function(sum, step) {
                return sum + step.weight;
            }, 0);
            
            function nextStep() {
                if (currentStepIndex >= steps.length) {
                    self.state.progress = 100;
                    self.state.inProgress = false;
                    console.log('Migration: All steps completed');
                    
                    // Mark migration as complete
                    localStorage.setItem('stackmap_migration_tasks_to_activities', 'completed');
                    localStorage.setItem('stackmap_migration_version', self.version);
                    
                    if (progressCallback) progressCallback(100, 'Migration complete');
                    if (callback) callback(true);
                    return;
                }
                
                const step = steps[currentStepIndex];
                self.state.currentStep = step.name;
                currentStepIndex++;
                
                console.log(`Migration: Starting step ${step.name}`);
                
                step.fn(function(success, error) {
                    if (!success) {
                        self.state.errors.push({ step: step.name, error: error });
                        console.error(`Migration: Step ${step.name} failed`, error);
                        self.state.inProgress = false;
                        
                        // Attempt rollback
                        self.rollback(function() {
                            if (callback) callback(false, error);
                        });
                        return;
                    }
                    
                    // Update progress
                    cumulativeWeight += step.weight;
                    self.state.progress = Math.round((cumulativeWeight / totalWeight) * 100);
                    
                    if (progressCallback) {
                        progressCallback(self.state.progress, `Completed ${step.name}`);
                    }
                    
                    // Continue with next step
                    setTimeout(nextStep, 100); // Small delay for UI updates
                });
            }
            
            nextStep();
        },
        
        /**
         * Migrate localStorage keys
         */
        migrateLocalStorage: function(callback) {
            const self = this;
            console.log('Migration: Migrating localStorage keys');
            
            try {
                // Primary keys to migrate
                const keyMappings = {
                    'stackmap_tasks': 'stackmap_activities',
                    'stackmap_tasks_backup': 'stackmap_activities_backup',
                    'stackmap_task_drafts': 'stackmap_activity_drafts',
                    'stackmap_last_task_id': 'stackmap_last_activity_id'
                };
                
                let migrationCount = 0;
                
                // Migrate primary keys
                Object.keys(keyMappings).forEach(function(oldKey) {
                    const newKey = keyMappings[oldKey];
                    const value = localStorage.getItem(oldKey);
                    
                    if (value !== null) {
                        // Save with new key
                        localStorage.setItem(newKey, value);
                        // Keep old key for rollback capability
                        localStorage.setItem(oldKey + '_migrated', 'true');
                        console.log(`Migration: Migrated ${oldKey} to ${newKey}`);
                        migrationCount++;
                    }
                });
                
                // Migrate user-specific keys (e.g., user_123_tasks)
                const allKeys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) allKeys.push(key);
                }
                
                allKeys.forEach(function(key) {
                    if (key.includes('_tasks') && !keyMappings[key] && !key.includes('_migrated')) {
                        const newKey = key.replace('_tasks', '_activities');
                        const value = localStorage.getItem(key);
                        if (value !== null) {
                            localStorage.setItem(newKey, value);
                            localStorage.setItem(key + '_migrated', 'true');
                            console.log(`Migration: Migrated user key ${key} to ${newKey}`);
                            migrationCount++;
                        }
                    }
                    
                    // Handle draft keys
                    if (key.includes('_task_draft_') && !key.includes('_migrated')) {
                        const newKey = key.replace('_task_draft_', '_activity_draft_');
                        const value = localStorage.getItem(key);
                        if (value !== null) {
                            localStorage.setItem(newKey, value);
                            localStorage.setItem(key + '_migrated', 'true');
                            migrationCount++;
                        }
                    }
                });
                
                self.state.processedItems += migrationCount;
                console.log(`Migration: Migrated ${migrationCount} localStorage keys`);
                callback(true);
            } catch (error) {
                console.error('Migration: localStorage migration failed', error);
                callback(false, error);
            }
        },
        
        /**
         * Transform stored data from task to activity format
         */
        transformStoredData: function(callback) {
            const self = this;
            console.log('Migration: Transforming stored data');
            
            try {
                // Transform main activities data
                const activitiesData = localStorage.getItem('stackmap_activities');
                if (activitiesData) {
                    const activities = JSON.parse(activitiesData);
                    let transformCount = 0;
                    
                    // Transform each activity object
                    activities.forEach(function(item) {
                        // Rename task-specific fields to activity
                        if (item.taskId) {
                            item.activityId = item.taskId;
                            delete item.taskId;
                            transformCount++;
                        }
                        
                        // Update any internal references
                        if (item.parentTaskId) {
                            item.parentActivityId = item.parentTaskId;
                            delete item.parentTaskId;
                        }
                        
                        // Update type field if needed
                        if (item.type === 'task') {
                            item.type = 'activity';
                        }
                        
                        // Ensure proper field names
                        if (!item.activityId && item.id && item.id.startsWith('task_')) {
                            item.activityId = item.id.replace('task_', 'activity_');
                        }
                    });
                    
                    // Save transformed data
                    localStorage.setItem('stackmap_activities', JSON.stringify(activities));
                    console.log(`Migration: Transformed ${transformCount} activity objects`);
                }
                
                // Transform backup data if exists
                const backupData = localStorage.getItem('stackmap_activities_backup');
                if (backupData) {
                    const backup = JSON.parse(backupData);
                    if (Array.isArray(backup)) {
                        backup.forEach(function(item) {
                            if (item.taskId) {
                                item.activityId = item.taskId;
                                delete item.taskId;
                            }
                        });
                        localStorage.setItem('stackmap_activities_backup', JSON.stringify(backup));
                    }
                }
                
                self.state.processedItems += transformCount;
                callback(true);
            } catch (error) {
                console.error('Migration: Data transformation failed', error);
                callback(false, error);
            }
        },
        
        /**
         * Migrate SQLite data if using SQLite storage
         */
        migrateSQLiteData: function(callback) {
            console.log('Migration: Checking SQLite storage');
            
            // Check if SQLite is available and ready
            if (!window.TaskSQLite || !window.TaskSQLite.isReady) {
                console.log('Migration: SQLite not available, skipping');
                callback(true);
                return;
            }
            
            // Get all keys that need migration
            window.TaskSQLite.getAllKeys(function(keys, error) {
                if (error) {
                    console.error('Migration: Failed to get SQLite keys', error);
                    callback(false, error);
                    return;
                }
                
                // Filter task-related keys
                const taskKeys = keys.filter(function(key) {
                    return key.includes('task') || key.includes('Task');
                });
                
                if (taskKeys.length === 0) {
                    console.log('Migration: No task keys found in SQLite');
                    callback(true);
                    return;
                }
                
                // Migrate each key
                let migrated = 0;
                const errors = [];
                
                taskKeys.forEach(function(oldKey) {
                    // Generate new key
                    const newKey = oldKey
                        .replace(/task/g, 'activity')
                        .replace(/Task/g, 'Activity');
                    
                    // Get value
                    window.TaskSQLite.get(oldKey, function(value, error) {
                        if (error) {
                            errors.push(error);
                            migrated++;
                        } else {
                            // Save with new key
                            window.TaskSQLite.set(newKey, value, function(success, error) {
                                if (!success) {
                                    errors.push(error);
                                }
                                migrated++;
                                
                                // Check if all keys migrated
                                if (migrated === taskKeys.length) {
                                    if (errors.length > 0) {
                                        console.error('Migration: Some SQLite keys failed', errors);
                                        callback(false, errors);
                                    } else {
                                        console.log('Migration: All SQLite keys migrated');
                                        callback(true);
                                    }
                                }
                            });
                        }
                    });
                });
            });
        },
        
        /**
         * Update cached data in memory
         */
        updateCachedData: function(callback) {
            const self = this;
            console.log('Migration: Updating cached data');
            
            try {
                // Update TaskDisplay to use new storage keys
                if (window.TaskDisplay) {
                    window.TaskDisplay.storageKey = 'stackmap_activities';
                    window.TaskDisplay.backupKey = 'stackmap_activities_backup';
                    window.TaskDisplay.draftKeyPrefix = 'stackmap_activity_draft_';
                }
                
                // Update any other modules that might cache task references
                if (window.Storage) {
                    window.Storage.TASKS_KEY = 'stackmap_activities';
                    window.Storage.BACKUP_KEY = 'stackmap_activities_backup';
                }
                
                // Update StorageAdapter if available
                if (window.StorageAdapter) {
                    window.StorageAdapter.KEYS.TASKS = 'stackmap_activities';
                    window.StorageAdapter.KEYS.TASKS_BACKUP = 'stackmap_activities_backup';
                }
                
                // Update demo mode references
                if (window.DemoMode) {
                    window.DemoMode.STORAGE_KEY = 'stackmap_activities';
                }
                
                callback(true);
            } catch (error) {
                console.error('Migration: Failed to update cached data', error);
                callback(false, error);
            }
        },
        
        /**
         * Verify migration was successful
         */
        verifyMigration: function(callback) {
            const self = this;
            console.log('Migration: Verifying migration');
            
            try {
                let verificationPassed = true;
                const issues = [];
                
                // Check primary keys exist
                const requiredKeys = ['stackmap_activities', 'stackmap_last_activity_id'];
                requiredKeys.forEach(function(key) {
                    if (!localStorage.getItem(key)) {
                        // Check if there's data in the old key
                        const oldKey = key.replace('activities', 'tasks').replace('activity', 'task');
                        if (localStorage.getItem(oldKey)) {
                            issues.push(`Key ${key} not migrated properly`);
                            verificationPassed = false;
                        }
                    }
                });
                
                // Verify data structure
                const activitiesData = localStorage.getItem('stackmap_activities');
                if (activitiesData) {
                    try {
                        const activities = JSON.parse(activitiesData);
                        if (Array.isArray(activities)) {
                            // Check for any remaining task references
                            activities.forEach(function(item, index) {
                                if (item.taskId || (item.id && item.id.startsWith('task_'))) {
                                    issues.push(`Activity at index ${index} still has task references`);
                                    verificationPassed = false;
                                }
                            });
                        }
                    } catch (e) {
                        issues.push('Activities data is not valid JSON');
                        verificationPassed = false;
                    }
                }
                
                // Count total migrated items
                let migratedCount = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes('_migrated')) {
                        migratedCount++;
                    }
                }
                
                if (verificationPassed) {
                    console.log(`Migration: Verification passed. ${migratedCount} items migrated.`);
                    self.state.totalItems = migratedCount;
                    callback(true);
                } else {
                    console.error('Migration: Verification failed', issues);
                    callback(false, issues);
                }
            } catch (error) {
                console.error('Migration: Verification error', error);
                callback(false, error);
            }
        },
        
        /**
         * Rollback the migration if needed
         */
        rollback: function(callback) {
            const self = this;
            console.log('Migration: Rolling back tasks to activities migration');
            
            try {
                // Use backup data if available
                if (self.state.backupData) {
                    console.log('Migration: Restoring from backup');
                    
                    // Restore all backed up localStorage keys
                    Object.keys(self.state.backupData.localStorage).forEach(function(key) {
                        localStorage.setItem(key, self.state.backupData.localStorage[key]);
                        console.log(`Migration: Restored ${key}`);
                    });
                } else {
                    // Manual rollback
                    console.log('Migration: No backup found, performing manual rollback');
                    
                    // Primary keys to restore
                    const keyMappings = {
                        'stackmap_tasks': 'stackmap_activities',
                        'stackmap_tasks_backup': 'stackmap_activities_backup',
                        'stackmap_task_drafts': 'stackmap_activity_drafts',
                        'stackmap_last_task_id': 'stackmap_last_activity_id'
                    };
                    
                    // Restore primary keys
                    Object.keys(keyMappings).forEach(function(oldKey) {
                        const newKey = keyMappings[oldKey];
                        const migratedValue = localStorage.getItem(newKey);
                        
                        if (migratedValue !== null) {
                            localStorage.setItem(oldKey, migratedValue);
                            localStorage.removeItem(newKey);
                        }
                    });
                    
                    // Restore user-specific and draft keys
                    const allKeys = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key) allKeys.push(key);
                    }
                    
                    allKeys.forEach(function(key) {
                        if (key.includes('_activities') && key.includes('_migrated')) {
                            const originalKey = key.replace('_migrated', '').replace('_activities', '_tasks');
                            const value = localStorage.getItem(key.replace('_migrated', ''));
                            if (value) {
                                localStorage.setItem(originalKey, value);
                                localStorage.removeItem(key.replace('_migrated', ''));
                            }
                        }
                        
                        if (key.includes('_activity_draft_')) {
                            const originalKey = key.replace('_activity_draft_', '_task_draft_');
                            const value = localStorage.getItem(key);
                            if (value) {
                                localStorage.setItem(originalKey, value);
                                localStorage.removeItem(key);
                            }
                        }
                    });
                }
                
                // Remove all migration markers
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes('_migrated')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(function(key) {
                    localStorage.removeItem(key);
                });
                
                // Remove migration status
                localStorage.removeItem('stackmap_migration_tasks_to_activities');
                localStorage.removeItem('stackmap_migration_version');
                
                // Restore module references
                if (window.TaskDisplay) {
                    window.TaskDisplay.storageKey = 'stackmap_tasks';
                    window.TaskDisplay.backupKey = 'stackmap_tasks_backup';
                    window.TaskDisplay.draftKeyPrefix = 'stackmap_task_draft_';
                }
                
                if (window.Storage) {
                    window.Storage.TASKS_KEY = 'stackmap_tasks';
                    window.Storage.BACKUP_KEY = 'stackmap_tasks_backup';
                }
                
                if (window.StorageAdapter) {
                    window.StorageAdapter.KEYS.TASKS = 'stackmap_tasks';
                    window.StorageAdapter.KEYS.TASKS_BACKUP = 'stackmap_tasks_backup';
                }
                
                if (window.DemoMode) {
                    window.DemoMode.STORAGE_KEY = 'stackmap_tasks';
                }
                
                // Reset state
                self.state = {
                    inProgress: false,
                    currentStep: '',
                    progress: 0,
                    totalItems: 0,
                    processedItems: 0,
                    errors: [],
                    backupData: null
                };
                
                console.log('Migration: Rollback completed');
                if (callback) callback(true);
            } catch (error) {
                console.error('Migration: Rollback failed', error);
                if (callback) callback(false, error);
            }
        },
        
        /**
         * Get migration state for UI display
         */
        getState: function() {
            return this.state;
        },
        
        /**
         * Clean up old migration backups (keep last 3)
         */
        cleanupOldBackups: function() {
            const backupKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('stackmap_migration_backup_')) {
                    backupKeys.push(key);
                }
            }
            
            // Sort by timestamp (newest first)
            backupKeys.sort().reverse();
            
            // Keep only the 3 most recent
            if (backupKeys.length > 3) {
                for (let i = 3; i < backupKeys.length; i++) {
                    localStorage.removeItem(backupKeys[i]);
                    console.log('Migration: Removed old backup', backupKeys[i]);
                }
            }
        }
    };
    
    // Expose migration
    window.TaskToActivityMigration = TaskToActivityMigration;
})();