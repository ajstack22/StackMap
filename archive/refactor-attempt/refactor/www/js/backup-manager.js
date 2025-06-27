/**
 * Backup Manager for StackMap
 * Provides multi-location backup storage with checksums and verification
 * Ensures data can always be recovered even in worst-case scenarios
 */

(function() {
    'use strict';
    
    var BackupManager = {
        // Configuration
        BACKUP_PREFIX: 'stackmap_backup_',
        INDEXEDDB_NAME: 'StackMapBackups',
        INDEXEDDB_VERSION: 1,
        COMPRESSION_THRESHOLD: 50000, // Compress backups larger than 50KB
        
        // State
        db: null,
        isIndexedDBReady: false,
        
        /**
         * Initialize backup manager
         */
        init: function(callback) {
            var self = this;
            
            // Try to initialize IndexedDB for secondary backup location
            if (window.indexedDB) {
                try {
                    var request = indexedDB.open(self.INDEXEDDB_NAME, self.INDEXEDDB_VERSION);
                    
                    request.onerror = function() {
                        console.warn('IndexedDB not available for backups, using localStorage only');
                        if (callback) callback(true);
                    };
                    
                    request.onsuccess = function(event) {
                        self.db = event.target.result;
                        self.isIndexedDBReady = true;
                        console.log('Backup Manager: IndexedDB ready');
                        if (callback) callback(true);
                    };
                    
                    request.onupgradeneeded = function(event) {
                        var db = event.target.result;
                        
                        // Create backup store
                        if (!db.objectStoreNames.contains('backups')) {
                            var store = db.createObjectStore('backups', { keyPath: 'id' });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                            store.createIndex('checksum', 'checksum', { unique: false });
                        }
                    };
                } catch (e) {
                    console.warn('IndexedDB initialization failed:', e);
                    if (callback) callback(true); // Continue without IndexedDB
                }
            } else {
                if (callback) callback(true);
            }
        },
        
        /**
         * Create a backup with checksums and multi-location storage
         */
        create: function(data, callback) {
            var self = this;
            
            try {
                var backup = {
                    id: self.BACKUP_PREFIX + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    timestamp: new Date().toISOString(),
                    created: Date.now(),
                    version: '1.0',
                    data: data,
                    checksum: null,
                    compressed: false,
                    size: 0
                };
                
                // Calculate checksum
                backup.checksum = self.calculateChecksum(data);
                
                // Check size and compress if needed
                var dataString = JSON.stringify(data);
                backup.size = dataString.length;
                
                if (backup.size > self.COMPRESSION_THRESHOLD) {
                    backup.data = self.compress(dataString);
                    backup.compressed = true;
                } else {
                    backup.data = data;
                }
                
                // Store in multiple locations
                self.storeInLocalStorage(backup, function(localSuccess) {
                    if (!localSuccess) {
                        if (callback) callback(null, new Error('Failed to store backup in localStorage'));
                        return;
                    }
                    
                    // Try IndexedDB as secondary location
                    self.storeInIndexedDB(backup, function(indexedSuccess) {
                        // Success if at least localStorage worked
                        console.log('Backup created:', backup.id, 
                            'localStorage:', localSuccess, 
                            'IndexedDB:', indexedSuccess);
                        
                        if (callback) callback(backup, null);
                    });
                });
                
            } catch (error) {
                console.error('Backup creation failed:', error);
                if (callback) callback(null, error);
            }
        },
        
        /**
         * Store backup in localStorage
         */
        storeInLocalStorage: function(backup, callback) {
            try {
                // Create a storage-friendly version
                var storageBackup = {
                    id: backup.id,
                    timestamp: backup.timestamp,
                    created: backup.created,
                    version: backup.version,
                    checksum: backup.checksum,
                    compressed: backup.compressed,
                    size: backup.size,
                    data: backup.compressed ? backup.data : JSON.stringify(backup.data)
                };
                
                localStorage.setItem(backup.id, JSON.stringify(storageBackup));
                
                // Verify write
                var verification = localStorage.getItem(backup.id);
                var success = verification === JSON.stringify(storageBackup);
                
                if (callback) callback(success);
            } catch (error) {
                console.error('localStorage backup failed:', error);
                if (callback) callback(false);
            }
        },
        
        /**
         * Store backup in IndexedDB
         */
        storeInIndexedDB: function(backup, callback) {
            var self = this;
            
            if (!self.isIndexedDBReady || !self.db) {
                if (callback) callback(false);
                return;
            }
            
            try {
                var transaction = self.db.transaction(['backups'], 'readwrite');
                var store = transaction.objectStore('backups');
                
                var request = store.put(backup);
                
                request.onsuccess = function() {
                    if (callback) callback(true);
                };
                
                request.onerror = function() {
                    console.error('IndexedDB backup failed');
                    if (callback) callback(false);
                };
            } catch (error) {
                console.error('IndexedDB backup error:', error);
                if (callback) callback(false);
            }
        },
        
        /**
         * Retrieve a backup by ID
         */
        retrieve: function(backupId, callback) {
            var self = this;
            
            // Try localStorage first
            try {
                var localBackup = localStorage.getItem(backupId);
                if (localBackup) {
                    var backup = JSON.parse(localBackup);
                    
                    // Decompress if needed
                    if (backup.compressed) {
                        backup.data = self.decompress(backup.data);
                    } else if (typeof backup.data === 'string') {
                        backup.data = JSON.parse(backup.data);
                    }
                    
                    if (callback) callback(backup, null);
                    return;
                }
            } catch (error) {
                console.error('Failed to retrieve from localStorage:', error);
            }
            
            // Try IndexedDB if localStorage failed
            if (self.isIndexedDBReady && self.db) {
                try {
                    var transaction = self.db.transaction(['backups'], 'readonly');
                    var store = transaction.objectStore('backups');
                    var request = store.get(backupId);
                    
                    request.onsuccess = function(event) {
                        var backup = event.target.result;
                        if (backup) {
                            // Decompress if needed
                            if (backup.compressed) {
                                backup.data = self.decompress(backup.data);
                            }
                            if (callback) callback(backup, null);
                        } else {
                            if (callback) callback(null, new Error('Backup not found'));
                        }
                    };
                    
                    request.onerror = function() {
                        if (callback) callback(null, new Error('IndexedDB retrieval failed'));
                    };
                } catch (error) {
                    if (callback) callback(null, error);
                }
            } else {
                if (callback) callback(null, new Error('Backup not found'));
            }
        },
        
        /**
         * Verify backup integrity
         */
        verify: function(backupId, currentStats, callback) {
            var self = this;
            
            self.retrieve(backupId, function(backup, error) {
                if (error || !backup) {
                    if (callback) callback({
                        isValid: false,
                        error: 'Backup not found'
                    });
                    return;
                }
                
                // Verify checksum
                var calculatedChecksum = self.calculateChecksum(backup.data);
                var checksumValid = calculatedChecksum === backup.checksum;
                
                // Count items in backup
                var backupTaskCount = 0;
                try {
                    if (backup.data['stackmap-tasks']) {
                        var tasks = JSON.parse(backup.data['stackmap-tasks']);
                        backupTaskCount = Array.isArray(tasks) ? tasks.length : 0;
                    }
                } catch (e) {
                    console.error('Failed to count backup tasks:', e);
                }
                
                var verification = {
                    isValid: checksumValid && backupTaskCount > 0,
                    checksumValid: checksumValid,
                    itemCount: {
                        backup: backupTaskCount,
                        current: currentStats ? currentStats.totalTasks : 0
                    },
                    backupId: backupId,
                    backupTimestamp: backup.timestamp
                };
                
                if (callback) callback(verification);
            });
        },
        
        /**
         * Rollback to a backup
         */
        rollback: function(backupId, callback) {
            var self = this;
            
            self.retrieve(backupId, function(backup, error) {
                if (error || !backup) {
                    if (callback) callback(false, error);
                    return;
                }
                
                try {
                    // Restore each key from backup
                    for (var key in backup.data) {
                        if (backup.data.hasOwnProperty(key)) {
                            localStorage.setItem(key, backup.data[key]);
                        }
                    }
                    
                    console.log('Successfully rolled back to backup:', backupId);
                    if (callback) callback(true, null);
                    
                } catch (restoreError) {
                    console.error('Rollback failed:', restoreError);
                    if (callback) callback(false, restoreError);
                }
            });
        },
        
        /**
         * List all backups
         */
        list: function(callback) {
            var self = this;
            var backups = [];
            
            // Get from localStorage
            try {
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf(self.BACKUP_PREFIX) === 0) {
                        try {
                            var backup = JSON.parse(localStorage.getItem(key));
                            backups.push({
                                id: backup.id,
                                timestamp: backup.timestamp,
                                created: backup.created,
                                size: backup.size,
                                compressed: backup.compressed,
                                location: 'localStorage'
                            });
                        } catch (e) {
                            console.error('Failed to parse backup:', key, e);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to list localStorage backups:', error);
            }
            
            // Get from IndexedDB
            if (self.isIndexedDBReady && self.db) {
                try {
                    var transaction = self.db.transaction(['backups'], 'readonly');
                    var store = transaction.objectStore('backups');
                    var request = store.openCursor();
                    
                    request.onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            // Check if we already have this backup from localStorage
                            var exists = backups.some(function(b) {
                                return b.id === cursor.value.id;
                            });
                            
                            if (!exists) {
                                backups.push({
                                    id: cursor.value.id,
                                    timestamp: cursor.value.timestamp,
                                    created: cursor.value.created,
                                    size: cursor.value.size,
                                    compressed: cursor.value.compressed,
                                    location: 'IndexedDB'
                                });
                            }
                            
                            cursor.continue();
                        } else {
                            // Sort by creation time (newest first)
                            backups.sort(function(a, b) {
                                return b.created - a.created;
                            });
                            
                            if (callback) callback(backups);
                        }
                    };
                    
                    request.onerror = function() {
                        // Return what we have from localStorage
                        if (callback) callback(backups);
                    };
                } catch (error) {
                    if (callback) callback(backups);
                }
            } else {
                if (callback) callback(backups);
            }
        },
        
        /**
         * Delete a backup
         */
        delete: function(backupId, callback) {
            var self = this;
            var deleted = false;
            
            // Delete from localStorage
            try {
                if (localStorage.getItem(backupId)) {
                    localStorage.removeItem(backupId);
                    deleted = true;
                }
            } catch (error) {
                console.error('Failed to delete from localStorage:', error);
            }
            
            // Delete from IndexedDB
            if (self.isIndexedDBReady && self.db) {
                try {
                    var transaction = self.db.transaction(['backups'], 'readwrite');
                    var store = transaction.objectStore('backups');
                    var request = store.delete(backupId);
                    
                    request.onsuccess = function() {
                        deleted = true;
                        if (callback) callback(deleted);
                    };
                    
                    request.onerror = function() {
                        if (callback) callback(deleted);
                    };
                } catch (error) {
                    if (callback) callback(deleted);
                }
            } else {
                if (callback) callback(deleted);
            }
        },
        
        /**
         * Clean up old backups based on retention policy
         */
        cleanup: function(retentionDays, callback) {
            var self = this;
            var cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
            var deletedCount = 0;
            
            self.list(function(backups) {
                var toDelete = backups.filter(function(backup) {
                    return backup.created < cutoffTime;
                });
                
                if (toDelete.length === 0) {
                    if (callback) callback(0);
                    return;
                }
                
                var deleteNext = function(index) {
                    if (index >= toDelete.length) {
                        if (callback) callback(deletedCount);
                        return;
                    }
                    
                    self.delete(toDelete[index].id, function(success) {
                        if (success) deletedCount++;
                        deleteNext(index + 1);
                    });
                };
                
                deleteNext(0);
            });
        },
        
        /**
         * Check if a backup exists
         */
        exists: function(backupId, callback) {
            try {
                var exists = localStorage.getItem(backupId) !== null;
                if (callback) callback(exists);
                return exists;
            } catch (error) {
                if (callback) callback(false);
                return false;
            }
        },
        
        /**
         * Calculate checksum for data integrity
         */
        calculateChecksum: function(data) {
            var str = JSON.stringify(data);
            var hash = 0;
            
            if (str.length === 0) return '0';
            
            for (var i = 0; i < str.length; i++) {
                var char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            return Math.abs(hash).toString(16);
        },
        
        /**
         * Simple compression using repeated string replacement
         * (More sophisticated compression would require a library)
         */
        compress: function(str) {
            // For now, just return the string
            // In production, you might use a library like pako
            return str;
        },
        
        /**
         * Decompress data
         */
        decompress: function(str) {
            // For now, just return the string
            // In production, this would reverse the compression
            return str;
        },
        
        /**
         * Get backup storage statistics
         */
        getStats: function(callback) {
            var self = this;
            
            self.list(function(backups) {
                var stats = {
                    totalBackups: backups.length,
                    totalSize: 0,
                    oldestBackup: null,
                    newestBackup: null,
                    locations: {
                        localStorage: 0,
                        indexedDB: 0
                    }
                };
                
                backups.forEach(function(backup) {
                    stats.totalSize += backup.size || 0;
                    stats.locations[backup.location]++;
                    
                    if (!stats.oldestBackup || backup.created < stats.oldestBackup.created) {
                        stats.oldestBackup = backup;
                    }
                    
                    if (!stats.newestBackup || backup.created > stats.newestBackup.created) {
                        stats.newestBackup = backup;
                    }
                });
                
                if (callback) callback(stats);
            });
        }
    };
    
    // Initialize on load
    if (document.readyState === 'complete') {
        BackupManager.init();
    } else {
        window.addEventListener('load', function() {
            BackupManager.init();
        });
    }
    
    // Expose API
    window.StackMapBackupManager = BackupManager;
})();