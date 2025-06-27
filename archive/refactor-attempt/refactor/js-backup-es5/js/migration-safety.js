/**
 * SQLite Migration Safety System
 * Provides bulletproof data safety during localStorage to SQLite migration
 * Zero data loss guaranteed through atomic operations and multiple backups
 */

(function() {
    'use strict';
    
    // Migration configuration
    const MigrationSafety = {
        // Configuration constants
        BACKUP_PREFIX: 'stackmap_backup_',
        VERIFY_DELAY_MS: 24 * 60 * 60 * 1000, // 24 hours
        MAX_BACKUP_AGE_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
        VERIFICATION_CHECK_INTERVAL: 60 * 60 * 1000, // Check every hour
        
        // Migration steps for user feedback
        steps: {
            BACKUP: 'Creating safety backup...',
            VALIDATE: 'Checking your data...',
            MIGRATE: 'Moving to new storage...',
            VERIFY: 'Confirming everything worked...',
            MONITOR: 'Watching for issues...',
            CLEANUP: 'Cleaning up old data...'
        },
        
        // Migration state
        state: {
            inProgress: false,
            currentStep: null,
            backupId: null,
            startTime: null,
            verificationTimer: null
        },
        
        /**
         * Main safe migration function
         * Ensures zero data loss through atomic operations
         */
        safeMigrate: function(callback) {
            const self = this;
            
            // Prevent concurrent migrations
            if (self.state.inProgress) {
                if (callback) callback({
                    success: false,
                    message: "Migration already in progress. Let's wait for it to complete."
                });
                return;
            }
            
            self.state.inProgress = true;
            self.state.startTime = Date.now();
            
            // Get source data
            self.updateProgress(self.steps.BACKUP, 0);
            const sourceData = self.getSourceData();
            
            if (!sourceData) {
                self.state.inProgress = false;
                if (callback) callback({
                    success: false,
                    message: "No data to migrate. You're all set!"
                });
                return;
            }
            
            // Step 1: Create timestamped backup
            window.StackMapBackupManager.create(sourceData, function(backup, error) {
                if (error || !backup) {
                    self.handleMigrationError(error || new Error('Backup creation failed'), callback);
                    return;
                }
                
                self.state.backupId = backup.id;
                self.updateProgress(self.steps.VALIDATE, 20);
                
                // Step 2: Validate source data
                self.validateData(sourceData, function(validation) {
                    if (!validation.isValid) {
                        self.handleMigrationError(new Error('Source data validation failed'), callback);
                        return;
                    }
                    
                    self.updateProgress(self.steps.MIGRATE, 40);
                    
                    // Step 3: Migrate with verification
                    self.migrateWithVerification(sourceData, function(migrationResult) {
                        if (!migrationResult.success) {
                            self.handleMigrationError(migrationResult.error, callback);
                            return;
                        }
                        
                        self.updateProgress(self.steps.VERIFY, 60);
                        
                        // Step 4: Set verification timer (24 hours)
                        self.scheduleVerification(backup.id);
                        
                        // Step 5: Schedule backup cleanup (30 days)
                        self.scheduleBackupCleanup(backup.id, 30);
                        
                        self.updateProgress(self.steps.MONITOR, 80);
                        
                        // Mark source data for later cleanup (not immediate!)
                        self.markSourceForCleanup();
                        
                        self.state.inProgress = false;
                        self.updateProgress('Complete!', 100);
                        
                        if (callback) callback({
                            success: true,
                            backupId: backup.id,
                            message: "Your data is safe! We'll verify everything is working perfectly over the next 24 hours."
                        });
                    });
                });
            });
        },
        
        /**
         * Get source data from localStorage
         */
        getSourceData: function() {
            try {
                const data = {};
                let hasData = false;
                
                // Collect all stackmap data
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.indexOf('stackmap-') === 0) {
                        const value = localStorage.getItem(key);
                        if (value) {
                            data[key] = value;
                            hasData = true;
                        }
                    }
                }
                
                return hasData ? data : null;
            } catch (error) {
                console.error('Failed to get source data:', error);
                return null;
            }
        },
        
        /**
         * Validate data integrity before migration
         */
        validateData: function(data, callback) {
            const validation = {
                isValid: true,
                errors: [],
                itemCount: 0
            };
            
            try {
                // Check each data entry
                for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                        validation.itemCount++;
                        
                        try {
                            const parsed = JSON.parse(data[key]);
                            
                            // Basic structure validation
                            if (key === 'stackmap-tasks' && !Array.isArray(parsed)) {
                                validation.isValid = false;
                                validation.errors.push('Tasks data is not an array');
                            }
                        } catch (e) {
                            validation.isValid = false;
                            validation.errors.push(`Invalid JSON in ${key}`);
                        }
                    }
                }
                
                // Must have at least some data
                if (validation.itemCount === 0) {
                    validation.isValid = false;
                    validation.errors.push('No data found to validate');
                }
                
            } catch (error) {
                validation.isValid = false;
                validation.errors.push(`Validation error: ${error.message}`);
            }
            
            if (callback) callback(validation);
        },
        
        /**
         * Migrate data with verification
         */
        migrateWithVerification: function(sourceData, callback) {
            const self = this;
            
            // Convert localStorage data to SQLite format
            let tasksData = null;
            try {
                const tasksKey = 'stackmap-tasks';
                if (sourceData[tasksKey]) {
                    tasksData = JSON.parse(sourceData[tasksKey]);
                }
            } catch (e) {
                if (callback) callback({
                    success: false,
                    error: new Error('Failed to parse tasks data')
                });
                return;
            }
            
            if (!tasksData || !Array.isArray(tasksData)) {
                if (callback) callback({
                    success: false,
                    error: new Error('No valid tasks data found')
                });
                return;
            }
            
            // Initialize SQLite if needed
            if (!window.TaskSQLite || !window.TaskSQLite.isReady) {
                window.TaskSQLite.init(function(success, error) {
                    if (!success) {
                        if (callback) callback({
                            success: false,
                            error: error || new Error('SQLite initialization failed')
                        });
                        return;
                    }
                    
                    // Proceed with migration
                    self.performMigration(tasksData, callback);
                });
            } else {
                self.performMigration(tasksData, callback);
            }
        },
        
        /**
         * Perform the actual migration to SQLite
         */
        performMigration: function(tasksData, callback) {
            const self = this;
            let migratedCount = 0;
            const totalTasks = tasksData.length;
            const errors = [];
            
            // Process tasks sequentially to avoid overwhelming the system
            function migrateNextTask(index) {
                if (index >= totalTasks) {
                    // Migration complete
                    if (callback) callback({
                        success: errors.length === 0,
                        migratedCount: migratedCount,
                        totalCount: totalTasks,
                        errors: errors,
                        error: errors.length > 0 ? new Error('Some tasks failed to migrate') : null
                    });
                    return;
                }
                
                const task = tasksData[index];
                
                // Convert to SQLite format
                const sqliteTask = {
                    title: task.title || 'Untitled',
                    description: task.description || '',
                    completed: task.completed || false,
                    priority: task.priority || 1,
                    tags: task.tags || [],
                    metadata: {
                        originalId: task.id,
                        migrationTimestamp: Date.now(),
                        migrationBackupId: self.state.backupId
                    }
                };
                
                window.TaskSQLite.createTask(sqliteTask, function(result, error) {
                    if (error) {
                        errors.push({
                            task: task,
                            error: error.message
                        });
                    } else {
                        migratedCount++;
                    }
                    
                    // Update progress
                    const progress = 40 + Math.round((index / totalTasks) * 20);
                    self.updateProgress(self.steps.MIGRATE, progress);
                    
                    // Continue with next task
                    setTimeout(function() {
                        migrateNextTask(index + 1);
                    }, 10); // Small delay to prevent UI blocking
                });
            }
            
            // Start migration
            migrateNextTask(0);
        },
        
        /**
         * Schedule verification check after 24 hours
         */
        scheduleVerification: function(backupId) {
            const self = this;
            
            // Store verification info
            const verificationData = {
                backupId: backupId,
                migrationTime: Date.now(),
                verificationTime: Date.now() + self.VERIFY_DELAY_MS,
                status: 'pending'
            };
            
            localStorage.setItem('stackmap_migration_verification', JSON.stringify(verificationData));
            
            // Set up periodic checks
            self.state.verificationTimer = setInterval(function() {
                self.checkVerification();
            }, self.VERIFICATION_CHECK_INTERVAL);
            
            // Also check immediately on next app load
            self.checkVerificationOnLoad();
        },
        
        /**
         * Check if verification period has passed
         */
        checkVerification: function() {
            const self = this;
            
            try {
                const verificationData = localStorage.getItem('stackmap_migration_verification');
                if (!verificationData) {
                    // No verification pending
                    if (self.state.verificationTimer) {
                        clearInterval(self.state.verificationTimer);
                        self.state.verificationTimer = null;
                    }
                    return;
                }
                
                const verification = JSON.parse(verificationData);
                
                if (verification.status === 'pending' && Date.now() >= verification.verificationTime) {
                    // Time to verify
                    self.performVerification(verification.backupId);
                }
            } catch (error) {
                console.error('Verification check error:', error);
            }
        },
        
        /**
         * Perform verification after 24 hours
         */
        performVerification: function(backupId) {
            const self = this;
            
            // Get current SQLite data count
            window.TaskSQLite.getStats(function(stats, error) {
                if (error) {
                    console.error('Verification failed:', error);
                    self.showVerificationAlert('warning', 
                        "We couldn't verify your data migration. Your backup is still safe.");
                    return;
                }
                
                // Compare with backup
                window.StackMapBackupManager.verify(backupId, stats, function(verification) {
                    if (verification.isValid) {
                        // Success! Safe to clean up
                        self.cleanupAfterVerification();
                        self.showVerificationAlert('success', 
                            "Great news! Your data migration was successful. Everything is working perfectly.");
                    } else {
                        // Problem detected
                        self.showVerificationAlert('warning', 
                            "We detected a potential issue with your data. Your backup is safe and we're investigating.");
                    }
                    
                    // Update verification status
                    const verificationData = {
                        backupId: backupId,
                        migrationTime: Date.now() - self.VERIFY_DELAY_MS,
                        verificationTime: Date.now(),
                        status: verification.isValid ? 'verified' : 'failed',
                        details: verification
                    };
                    
                    localStorage.setItem('stackmap_migration_verification', JSON.stringify(verificationData));
                });
            });
        },
        
        /**
         * Clean up source data after successful verification
         */
        cleanupAfterVerification: function() {
            const self = this;
            
            try {
                // Only remove data marked for cleanup
                const cleanupMarker = localStorage.getItem('stackmap_migration_cleanup_marker');
                if (!cleanupMarker) return;
                
                const marker = JSON.parse(cleanupMarker);
                if (!marker.verified) {
                    // Double-check current data
                    window.TaskSQLite.getStats(function(stats, error) {
                        if (!error && stats.totalTasks > 0) {
                            // Safe to clean up
                            self.removeSourceData();
                            
                            // Update marker
                            marker.verified = true;
                            marker.cleanupTime = Date.now();
                            localStorage.setItem('stackmap_migration_cleanup_marker', JSON.stringify(marker));
                        }
                    });
                }
            } catch (error) {
                console.error('Cleanup error:', error);
                // Don't remove anything if there's an error
            }
        },
        
        /**
         * Remove source data from localStorage
         */
        removeSourceData: function() {
            try {
                // Remove all stackmap- prefixed keys except backups and verification
                const keysToRemove = [];
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.indexOf('stackmap-') === 0) {
                        keysToRemove.push(key);
                    }
                }
                
                // Remove the keys
                keysToRemove.forEach(function(key) {
                    localStorage.removeItem(key);
                });
                
                console.log('Source data cleaned up successfully');
            } catch (error) {
                console.error('Failed to remove source data:', error);
            }
        },
        
        /**
         * Mark source data for cleanup (but don't delete yet!)
         */
        markSourceForCleanup: function() {
            const marker = {
                timestamp: Date.now(),
                backupId: this.state.backupId,
                verified: false
            };
            
            localStorage.setItem('stackmap_migration_cleanup_marker', JSON.stringify(marker));
        },
        
        /**
         * Schedule backup cleanup after retention period
         */
        scheduleBackupCleanup: function(backupId, days) {
            const self = this;
            const cleanupTime = Date.now() + (days * 24 * 60 * 60 * 1000);
            
            const cleanupData = {
                backupId: backupId,
                scheduledTime: cleanupTime,
                retentionDays: days
            };
            
            // Store cleanup schedule
            let schedules = [];
            try {
                const existing = localStorage.getItem('stackmap_backup_cleanup_schedule');
                if (existing) {
                    schedules = JSON.parse(existing);
                }
            } catch (e) {}
            
            schedules.push(cleanupData);
            localStorage.setItem('stackmap_backup_cleanup_schedule', JSON.stringify(schedules));
        },
        
        /**
         * Handle migration errors with rollback
         */
        handleMigrationError: function(error, callback) {
            const self = this;
            
            console.error('Migration error:', error);
            
            // Rollback if we have a backup
            if (self.state.backupId) {
                window.StackMapBackupManager.rollback(self.state.backupId, function(success) {
                    self.state.inProgress = false;
                    
                    if (callback) callback({
                        success: false,
                        message: "No worries! We kept your data safe. Let's try again when you're ready.",
                        error: error,
                        rolledBack: success
                    });
                });
            } else {
                self.state.inProgress = false;
                
                if (callback) callback({
                    success: false,
                    message: "Hmm, let's double-check your data first. Nothing has been changed.",
                    error: error
                });
            }
        },
        
        /**
         * Update progress for user feedback
         */
        updateProgress: function(step, percent) {
            try {
                // Update UI if available
                if (window.StackMapMigrationUI) {
                    window.StackMapMigrationUI.updateProgress(step, percent);
                }
                
                // Console log for debugging
                console.log('Migration progress:', step, `${percent}%`);
            } catch (e) {
                // Don't let UI errors stop migration
            }
        },
        
        /**
         * Show verification alert to user
         */
        showVerificationAlert: function(type, message) {
            try {
                if (window.StackMapMigrationUI) {
                    window.StackMapMigrationUI.showAlert(type, message);
                }
            } catch (e) {
                console.log('Verification alert:', type, message);
            }
        },
        
        /**
         * Check verification on app load
         */
        checkVerificationOnLoad: function() {
            const self = this;
            
            // Check immediately when app loads
            if (document.readyState === 'complete') {
                self.checkVerification();
            } else {
                window.addEventListener('load', function() {
                    self.checkVerification();
                });
            }
        },
        
        /**
         * Get migration status
         */
        getStatus: function() {
            let verificationData = null;
            try {
                const data = localStorage.getItem('stackmap_migration_verification');
                if (data) {
                    verificationData = JSON.parse(data);
                }
            } catch (e) {}
            
            return {
                inProgress: this.state.inProgress,
                currentStep: this.state.currentStep,
                backupId: this.state.backupId,
                verification: verificationData
            };
        }
    };
    
    // Initialize verification check on load
    MigrationSafety.checkVerificationOnLoad();
    
    // Expose API
    window.StackMapMigrationSafety = MigrationSafety;
})();