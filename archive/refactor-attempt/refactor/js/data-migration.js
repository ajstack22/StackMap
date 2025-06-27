/**
 * Data Migration System - Story #107 User Data Separation
 * Handles migration from global activities to user-specific data
 * Ensures zero data loss during migration process
 */

(function() {
    'use strict';
    
    const DataMigration = {
        isInitialized: false,
        isMigrating: false,
        
        // Migration configuration
        config: {
            migrationVersion: 6, // Schema version 6 for user separation
            backupKey: 'stackmap_migration_backup',
            migrationStatusKey: 'stackmap_migration_status',
            maxRetries: 3,
            retryDelay: 1000 // 1 second
        },
        
        // Migration state tracking
        state: {
            hasGlobalActivities: false,
            migrationNeeded: false,
            backupCreated: false,
            migrationComplete: false
        },
        
        /**
         * Initialize migration system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            try {
                // Check if migration is needed
                self.checkMigrationStatus();
                
                // Listen for user context initialization
                document.addEventListener('userContextInitialized', function(e) {
                    if (self.state.migrationNeeded) {
                        setTimeout(() => self.promptMigration(), 1000); // Allow UI to settle
                    }
                });
                
                self.isInitialized = true;
                console.log('DataMigration: Initialized');
                
            } catch (error) {
                console.error('DataMigration: Failed to initialize:', error);
            }
        },
        
        /**
         * Check if migration is needed
         */
        checkMigrationStatus: function() {
            const self = this;
            
            try {
                // Check if migration was already completed
                const migrationStatus = localStorage.getItem(self.config.migrationStatusKey);
                if (migrationStatus) {
                    const status = JSON.parse(migrationStatus);
                    if (status.completed && status.version >= self.config.migrationVersion) {
                        console.log('DataMigration: Migration already completed');
                        self.state.migrationComplete = true;
                        return;
                    }
                }
                
                // Check for global activities that need migration
                const globalActivities = self.detectGlobalActivities();
                self.state.hasGlobalActivities = globalActivities.length > 0;
                self.state.migrationNeeded = self.state.hasGlobalActivities;
                
                console.log('DataMigration: Migration needed:', self.state.migrationNeeded, 
                          'Global activities found:', globalActivities.length);
                
            } catch (error) {
                console.error('DataMigration: Failed to check migration status:', error);
            }
        },
        
        /**
         * Detect existing global activities
         */
        detectGlobalActivities: function() {
            const globalActivities = [];
            
            try {
                // Check stackmap_activities (new format)
                const activitiesData = localStorage.getItem('stackmap_activities');
                if (activitiesData) {
                    const activities = JSON.parse(activitiesData);
                    if (Array.isArray(activities) && activities.length > 0) {
                        // Check if activities lack userId
                        const activitiesNeedingMigration = activities.filter(activity => !activity.userId);
                        globalActivities.push(...activitiesNeedingMigration);
                    }
                }
                
                // Check stackmap_tasks (legacy format)
                const tasksData = localStorage.getItem('stackmap_tasks');
                if (tasksData) {
                    const tasks = JSON.parse(tasksData);
                    if (Array.isArray(tasks) && tasks.length > 0) {
                        // Convert tasks to activities format
                        const convertedTasks = tasks.map(task => ({
                            ...task,
                            // Map task fields to activity fields
                            timeframe: task.timeframe || 'today',
                            day: task.day || task.timeframe || 'today'
                        }));
                        globalActivities.push(...convertedTasks);
                    }
                }
                
                return globalActivities;
                
            } catch (error) {
                console.error('DataMigration: Failed to detect global activities:', error);
                return [];
            }
        },
        
        /**
         * Prompt user for migration
         */
        promptMigration: function() {
            const self = this;
            
            if (self.isMigrating) return;
            
            try {
                const globalActivities = self.detectGlobalActivities();
                if (globalActivities.length === 0) {
                    return; // No activities to migrate
                }
                
                // Create migration prompt
                const message = `Found ${globalActivities.length} existing activities that need to be migrated to the new user system.\n\nThis will:\n• Associate activities with your user account\n• Enable proper multi-user support\n• Keep all your existing data safe\n\nProceed with migration?`;
                
                if (confirm(message)) {
                    self.startMigration();
                } else {
                    console.log('DataMigration: User declined migration');
                    // Store declined status
                    localStorage.setItem(self.config.migrationStatusKey, JSON.stringify({
                        completed: false,
                        declined: true,
                        timestamp: Date.now()
                    }));
                }
                
            } catch (error) {
                console.error('DataMigration: Failed to prompt migration:', error);
            }
        },
        
        /**
         * Start migration process
         */
        startMigration: function() {
            const self = this;
            
            if (self.isMigrating) {
                console.warn('DataMigration: Migration already in progress');
                return;
            }
            
            console.log('DataMigration: Starting migration process');
            self.isMigrating = true;
            
            // Show progress indication
            self.showMigrationProgress('Starting migration...');
            
            // Run migration steps
            Promise.resolve()
                .then(() => self.createBackup())
                .then(() => self.migrateActivities())
                .then(() => self.validateMigration())
                .then(() => self.cleanupGlobalData())
                .then(() => self.completeMigration())
                .catch(error => self.handleMigrationError(error))
                .finally(() => {
                    self.isMigrating = false;
                    self.hideMigrationProgress();
                });
        },
        
        /**
         * Create backup of existing data
         */
        createBackup: function() {
            const self = this;
            
            return new Promise((resolve, reject) => {
                try {
                    self.showMigrationProgress('Creating backup...');
                    
                    const backup = {
                        timestamp: Date.now(),
                        version: self.config.migrationVersion,
                        data: {}
                    };
                    
                    // Backup all relevant localStorage data
                    const keysToBackup = [
                        'stackmap_activities',
                        'stackmap_tasks',
                        'stackmap_users',
                        'stackmap_settings'
                    ];
                    
                    keysToBackup.forEach(key => {
                        const data = localStorage.getItem(key);
                        if (data) {
                            backup.data[key] = data;
                        }
                    });
                    
                    // Store backup
                    localStorage.setItem(self.config.backupKey, JSON.stringify(backup));
                    self.state.backupCreated = true;
                    
                    console.log('DataMigration: Backup created successfully');
                    resolve();
                    
                } catch (error) {
                    reject(new Error('Failed to create backup: ' + error.message));
                }
            });
        },
        
        /**
         * Migrate activities to user-specific storage
         */
        migrateActivities: function() {
            const self = this;
            
            return new Promise((resolve, reject) => {
                try {
                    self.showMigrationProgress('Migrating activities...');
                    
                    // Get current user ID
                    const userId = window.UserContext ? window.UserContext.getCurrentUserId() : null;
                    if (!userId) {
                        reject(new Error('No current user ID available for migration'));
                        return;
                    }
                    
                    // Get global activities
                    const globalActivities = self.detectGlobalActivities();
                    if (globalActivities.length === 0) {
                        console.log('DataMigration: No activities to migrate');
                        resolve();
                        return;
                    }
                    
                    // Group activities by timeframe
                    const activitiesByTimeframe = {
                        today: [],
                        tomorrow: []
                    };
                    
                    globalActivities.forEach(activity => {
                        // Ensure activity has userId
                        activity.userId = userId;
                        
                        // Determine timeframe
                        const timeframe = activity.timeframe || activity.day || 'today';
                        const targetTimeframe = timeframe === 'someday' ? 'tomorrow' : timeframe;
                        
                        if (activitiesByTimeframe[targetTimeframe]) {
                            activitiesByTimeframe[targetTimeframe].push(activity);
                        } else {
                            // Default to today for unknown timeframes
                            activitiesByTimeframe.today.push(activity);
                        }
                    });
                    
                    // Migrate activities using UserDataManager
                    if (window.UserDataManager) {
                        const todaySuccess = window.UserDataManager.setUserActivities(
                            userId, 'today', activitiesByTimeframe.today
                        );
                        const tomorrowSuccess = window.UserDataManager.setUserActivities(
                            userId, 'tomorrow', activitiesByTimeframe.tomorrow
                        );
                        
                        if (todaySuccess && tomorrowSuccess) {
                            console.log(`DataMigration: Successfully migrated ${globalActivities.length} activities`);
                            resolve();
                        } else {
                            reject(new Error('Failed to save migrated activities'));
                        }
                    } else {
                        reject(new Error('UserDataManager not available'));
                    }
                    
                } catch (error) {
                    reject(new Error('Failed to migrate activities: ' + error.message));
                }
            });
        },
        
        /**
         * Validate migration was successful
         */
        validateMigration: function() {
            const self = this;
            
            return new Promise((resolve, reject) => {
                try {
                    self.showMigrationProgress('Validating migration...');
                    
                    const userId = window.UserContext ? window.UserContext.getCurrentUserId() : null;
                    if (!userId) {
                        reject(new Error('No user ID for validation'));
                        return;
                    }
                    
                    // Get migrated activities
                    const todayActivities = window.UserDataManager ? 
                        window.UserDataManager.getUserActivities(userId, 'today') : [];
                    const tomorrowActivities = window.UserDataManager ? 
                        window.UserDataManager.getUserActivities(userId, 'tomorrow') : [];
                    
                    const totalMigrated = todayActivities.length + tomorrowActivities.length;
                    const originalCount = self.detectGlobalActivities().length;
                    
                    if (totalMigrated >= originalCount) {
                        console.log(`DataMigration: Validation successful - ${totalMigrated} activities migrated`);
                        
                        // Validate all activities have userId
                        const allActivities = [...todayActivities, ...tomorrowActivities];
                        const invalidActivities = allActivities.filter(activity => !activity.userId);
                        
                        if (invalidActivities.length > 0) {
                            reject(new Error(`${invalidActivities.length} activities missing userId`));
                        } else {
                            resolve();
                        }
                    } else {
                        reject(new Error(`Migration validation failed: ${totalMigrated} migrated vs ${originalCount} original`));
                    }
                    
                } catch (error) {
                    reject(new Error('Validation failed: ' + error.message));
                }
            });
        },
        
        /**
         * Clean up global data after successful migration
         */
        cleanupGlobalData: function() {
            const self = this;
            
            return new Promise((resolve, reject) => {
                try {
                    self.showMigrationProgress('Cleaning up old data...');
                    
                    // Remove global activity data
                    localStorage.removeItem('stackmap_activities');
                    localStorage.removeItem('stackmap_tasks');
                    
                    console.log('DataMigration: Cleaned up global activity data');
                    resolve();
                    
                } catch (error) {
                    reject(new Error('Cleanup failed: ' + error.message));
                }
            });
        },
        
        /**
         * Complete migration process
         */
        completeMigration: function() {
            const self = this;
            
            return new Promise((resolve) => {
                try {
                    self.showMigrationProgress('Finalizing migration...');
                    
                    // Mark migration as complete
                    const migrationStatus = {
                        completed: true,
                        version: self.config.migrationVersion,
                        timestamp: Date.now(),
                        backupKey: self.config.backupKey
                    };
                    
                    localStorage.setItem(self.config.migrationStatusKey, JSON.stringify(migrationStatus));
                    self.state.migrationComplete = true;
                    
                    // Clear badge cache to ensure fresh rendering
                    if (window.BadgeCache) {
                        window.BadgeCache.clear();
                    }
                    
                    // Refresh activity display
                    if (window.ActivityDisplay && window.ActivityDisplay.render) {
                        window.ActivityDisplay.render();
                    }
                    
                    // Dispatch completion event
                    document.dispatchEvent(new CustomEvent('migrationCompleted', {
                        detail: { version: self.config.migrationVersion }
                    }));
                    
                    console.log('DataMigration: Migration completed successfully');
                    
                    // Show success message
                    setTimeout(() => {
                        alert('Migration completed successfully! Your activities have been migrated to the new user system.');
                    }, 500);
                    
                    resolve();
                    
                } catch (error) {
                    console.error('DataMigration: Failed to complete migration:', error);
                    resolve(); // Don't reject to avoid error handling
                }
            });
        },
        
        /**
         * Handle migration errors
         */
        handleMigrationError: function(error) {
            const self = this;
            
            console.error('DataMigration: Migration failed:', error);
            
            // Attempt rollback if backup exists
            if (self.state.backupCreated) {
                const rollbackConfirm = confirm(
                    'Migration failed: ' + error.message + '\n\nWould you like to restore from backup?'
                );
                
                if (rollbackConfirm) {
                    self.rollbackMigration();
                }
            } else {
                alert('Migration failed: ' + error.message + '\n\nYour original data is preserved.');
            }
        },
        
        /**
         * Rollback migration from backup
         */
        rollbackMigration: function() {
            const self = this;
            
            try {
                self.showMigrationProgress('Rolling back migration...');
                
                const backupData = localStorage.getItem(self.config.backupKey);
                if (!backupData) {
                    throw new Error('No backup data found');
                }
                
                const backup = JSON.parse(backupData);
                
                // Restore backed up data
                Object.keys(backup.data).forEach(key => {
                    localStorage.setItem(key, backup.data[key]);
                });
                
                // Remove migration status
                localStorage.removeItem(self.config.migrationStatusKey);
                
                console.log('DataMigration: Rollback completed');
                alert('Migration has been rolled back. Your original data has been restored.');
                
                // Refresh display
                if (window.ActivityDisplay && window.ActivityDisplay.render) {
                    window.ActivityDisplay.render();
                }
                
            } catch (error) {
                console.error('DataMigration: Rollback failed:', error);
                alert('Rollback failed: ' + error.message);
            } finally {
                self.hideMigrationProgress();
            }
        },
        
        /**
         * Show migration progress
         */
        showMigrationProgress: function(message) {
            // Simple progress indication
            let progressEl = document.getElementById('migration-progress');
            if (!progressEl) {
                progressEl = document.createElement('div');
                progressEl.id = 'migration-progress';
                progressEl.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 8px;
                    z-index: 9999;
                    text-align: center;
                `;
                document.body.appendChild(progressEl);
            }
            
            progressEl.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 10px;">Migrating Data</div>
                <div style="font-size: 14px;">${message}</div>
                <div style="margin-top: 15px;">
                    <div style="width: 200px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: #4a90e2; animation: progress 2s ease-in-out infinite;"></div>
                    </div>
                </div>
            `;
            
            // Add CSS animation if not exists
            if (!document.getElementById('migration-progress-style')) {
                const style = document.createElement('style');
                style.id = 'migration-progress-style';
                style.textContent = `
                    @keyframes progress {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(0%); }
                        100% { transform: translateX(100%); }
                    }
                `;
                document.head.appendChild(style);
            }
        },
        
        /**
         * Hide migration progress
         */
        hideMigrationProgress: function() {
            const progressEl = document.getElementById('migration-progress');
            if (progressEl) {
                progressEl.remove();
            }
            
            const styleEl = document.getElementById('migration-progress-style');
            if (styleEl) {
                styleEl.remove();
            }
        },
        
        /**
         * Get migration status
         */
        getMigrationStatus: function() {
            return {
                isInitialized: this.isInitialized,
                isMigrating: this.isMigrating,
                state: { ...this.state }
            };
        }
    };
    
    // Export to global scope
    window.DataMigration = DataMigration;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DataMigration.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => DataMigration.init(), 100);
    }
    
})();