/**
 * Migration Manager for SQLite Storage
 * Handles safe migration from localStorage to SQLite with 30-day backup retention
 */

(function() {
    'use strict';
    
    const MigrationManager = {
        BACKUP_PREFIX: 'stackmap_backup_',
        BACKUP_RETENTION_DAYS: 30,
        
        /**
         * Migrate data from localStorage to SQLite
         */
        migrateFromLocalStorage: function(sqliteAdapter, callback) {
            const self = this;
            console.log('Migration: Starting localStorage to SQLite migration...');
            
            // Step 1: Create backup
            const backup = self.createBackup();
            if (!backup) {
                if (callback) callback(false, 'Failed to create backup');
                return;
            }
            
            console.log('Migration: Backup created with ID:', backup.id);
            
            // Step 2: Get all localStorage data
            const data = self.getAllLocalStorageData();
            console.log('Migration: Found data:', {
                keys: Object.keys(data),
                itemCount: Object.keys(data).length
            });
            
            // Step 3: Validate data
            if (!self.validateData(data)) {
                console.error('Migration: Data validation failed');
                if (callback) callback(false, 'Data validation failed');
                return;
            }
            
            // Step 4: Migrate data to SQLite
            self.migrateDataToSQLite(sqliteAdapter, data, function(success, error) {
                if (success) {
                    // Step 5: Verify migration
                    self.verifyMigration(sqliteAdapter, data, function(verified) {
                        if (verified) {
                            // Step 6: Mark as migrated
                            localStorage.setItem('stackmap_migrated_to_sqlite', 'true');
                            localStorage.setItem('stackmap_migration_date', Date.now().toString());
                            
                            console.log('Migration: Completed successfully!');
                            
                            // Schedule backup cleanup
                            self.scheduleBackupCleanup();
                            
                            if (callback) callback(true);
                        } else {
                            console.error('Migration: Verification failed');
                            self.rollbackMigration(backup);
                            if (callback) callback(false, 'Migration verification failed');
                        }
                    });
                } else {
                    console.error('Migration: Failed to migrate data:', error);
                    self.rollbackMigration(backup);
                    if (callback) callback(false, error);
                }
            });
        },
        
        /**
         * Create a backup of all localStorage data
         */
        createBackup: function() {
            try {
                const backupId = Date.now().toString();
                const backup = {
                    id: backupId,
                    createdAt: Date.now(),
                    data: {}
                };
                
                // Backup all stackmap keys
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('stackmap')) {
                        backup.data[key] = localStorage.getItem(key);
                    }
                }
                
                // Store backup
                localStorage.setItem(this.BACKUP_PREFIX + backupId, JSON.stringify(backup));
                
                return backup;
            } catch (error) {
                console.error('Migration: Failed to create backup:', error);
                return null;
            }
        },
        
        /**
         * Get all localStorage data
         */
        getAllLocalStorageData: function() {
            const data = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('stackmap-') && !key.startsWith(this.BACKUP_PREFIX)) {
                    try {
                        const value = localStorage.getItem(key);
                        data[key] = JSON.parse(value);
                    } catch (e) {
                        console.warn('Migration: Failed to parse data for key:', key);
                    }
                }
            }
            
            return data;
        },
        
        /**
         * Validate data structure
         */
        validateData: function(data) {
            // Basic validation - ensure data is not empty
            if (!data || Object.keys(data).length === 0) {
                return true; // Empty data is valid (fresh start)
            }
            
            // Check each item has required structure
            for (const key in data) {
                const item = data[key];
                if (!item || typeof item !== 'object') {
                    console.error('Migration: Invalid data structure for key:', key);
                    return false;
                }
                
                // Check for corruption
                if (item.checksum && item.data) {
                    // Verify checksum if present
                    const calculated = this.calculateChecksum(item.data);
                    if (calculated !== item.checksum) {
                        console.error('Migration: Checksum mismatch for key:', key);
                        return false;
                    }
                }
            }
            
            return true;
        },
        
        /**
         * Calculate checksum (same as storage adapter)
         */
        calculateChecksum: function(data) {
            const str = JSON.stringify(data);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
        },
        
        /**
         * Migrate data to SQLite
         */
        migrateDataToSQLite: function(sqliteAdapter, data, callback) {
            const self = this;
            const keys = Object.keys(data);
            let completed = 0;
            const errors = [];
            
            if (keys.length === 0) {
                if (callback) callback(true);
                return;
            }
            
            // Migrate each key
            keys.forEach(function(key) {
                const cleanKey = key.replace('stackmap-', '');
                sqliteAdapter.setItem(cleanKey, data[key], function(error) {
                    completed++;
                    
                    if (error) {
                        errors.push({ key: key, error: error });
                    }
                    
                    // Check if all migrations are complete
                    if (completed === keys.length) {
                        if (errors.length > 0) {
                            console.error('Migration: Errors occurred:', errors);
                            if (callback) callback(false, `Migration errors: ${errors.length}`);
                        } else {
                            if (callback) callback(true);
                        }
                    }
                });
            });
        },
        
        /**
         * Verify migration success
         */
        verifyMigration: function(sqliteAdapter, originalData, callback) {
            const self = this;
            const keys = Object.keys(originalData);
            let verified = 0;
            const failures = [];
            
            if (keys.length === 0) {
                if (callback) callback(true);
                return;
            }
            
            keys.forEach(function(key) {
                const cleanKey = key.replace('stackmap-', '');
                sqliteAdapter.getItem(cleanKey, function(error, data) {
                    verified++;
                    
                    if (error || !data) {
                        failures.push(key);
                    } else {
                        // Verify data matches
                        const original = originalData[key];
                        if (JSON.stringify(original) !== JSON.stringify(data)) {
                            failures.push(key);
                        }
                    }
                    
                    if (verified === keys.length) {
                        if (failures.length > 0) {
                            console.error('Migration: Verification failed for keys:', failures);
                            if (callback) callback(false);
                        } else {
                            if (callback) callback(true);
                        }
                    }
                });
            });
        },
        
        /**
         * Rollback migration on failure
         */
        rollbackMigration: function(backup) {
            console.log('Migration: Rolling back...');
            
            if (!backup || !backup.data) {
                console.error('Migration: No backup available for rollback');
                return;
            }
            
            // Restore each key
            for (const key in backup.data) {
                try {
                    localStorage.setItem(key, backup.data[key]);
                } catch (e) {
                    console.error('Migration: Failed to restore key:', key);
                }
            }
            
            console.log('Migration: Rollback complete');
        },
        
        /**
         * Schedule cleanup of old backups
         */
        scheduleBackupCleanup: function() {
            const self = this;
            
            // Run cleanup on next tick
            setTimeout(function() {
                self.cleanupOldBackups();
            }, 1000);
        },
        
        /**
         * Clean up backups older than retention period
         */
        cleanupOldBackups: function() {
            const self = this;
            const now = Date.now();
            const retentionMs = this.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
            let cleaned = 0;
            
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.BACKUP_PREFIX)) {
                    try {
                        const backup = JSON.parse(localStorage.getItem(key));
                        if (backup && backup.createdAt) {
                            const age = now - backup.createdAt;
                            if (age > retentionMs) {
                                localStorage.removeItem(key);
                                cleaned++;
                            }
                        }
                    } catch (e) {
                        // Remove invalid backups
                        localStorage.removeItem(key);
                        cleaned++;
                    }
                }
            }
            
            if (cleaned > 0) {
                console.log('Migration: Cleaned up', cleaned, 'old backups');
            }
        },
        
        /**
         * Check if migration has already been performed
         */
        hasMigrated: function() {
            return localStorage.getItem('stackmap_migrated_to_sqlite') === 'true';
        },
        
        /**
         * Get migration status
         */
        getStatus: function() {
            const migrated = this.hasMigrated();
            const migrationDate = localStorage.getItem('stackmap_migration_date');
            let backupCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.BACKUP_PREFIX)) {
                    backupCount++;
                }
            }
            
            return {
                migrated: migrated,
                migrationDate: migrationDate ? new Date(parseInt(migrationDate)) : null,
                backupCount: backupCount
            };
        }
    };
    
    // Expose to global scope
    window.MigrationManager = MigrationManager;
})();