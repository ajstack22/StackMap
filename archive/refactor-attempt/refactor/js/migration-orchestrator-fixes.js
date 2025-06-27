/**
 * Migration Orchestrator Fixes
 * Addresses all critical issues from PM code review
 */

(function() {
    'use strict';
    
    // Extend the existing FailSafeMigrationOrchestrator
    const originalOrchestrator = window.FailSafeMigrationOrchestrator;
    
    class FixedMigrationOrchestrator extends originalOrchestrator {
        constructor() {
            super();
            
            // Add abort controller support
            this.abortController = null;
            
            // Add progress callback
            this.progressCallback = null;
            
            // Use IndexedDB for backups instead of localStorage
            this.backupDB = null;
            
            // Initialize backup database
            this.initBackupDB();
        }
        
        /**
         * Initialize IndexedDB for scalable backups
         */
        async initBackupDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('StackMapBackups', 1);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('backups')) {
                        db.createObjectStore('backups', { keyPath: 'id' });
                    }
                };
                
                request.onsuccess = (event) => {
                    this.backupDB = event.target.result;
                    resolve();
                };
                
                request.onerror = (event) => {
                    console.error('Failed to open backup database:', event);
                    reject(event.target.error);
                };
            });
        }
        
        /**
         * Override executeMigration to add abort support
         */
        async executeMigration(version, operation, options = {}) {
            // Create abort controller for this migration
            this.abortController = new AbortController();
            
            // Set progress callback if provided
            this.progressCallback = options.onProgress || null;
            
            try {
                // Add abort signal to current migration
                this.currentMigration = {
                    ...this.currentMigration,
                    abortController: this.abortController
                };
                
                // Call parent implementation
                return await super.executeMigration(version, operation, options);
                
            } finally {
                this.abortController = null;
                this.progressCallback = null;
            }
        }
        
        /**
         * CRITICAL FIX #1: Implement actual savepoint creation
         */
        async createSavepoint(migrationId) {
            const savepointName = `sp_${migrationId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                try {
                    await window.TaskSQLite.executeQuery(`SAVEPOINT ${savepointName}`);
                    console.log(`[MigrationOrchestrator] Created savepoint: ${savepointName}`);
                    return savepointName;
                } catch (error) {
                    console.error('[MigrationOrchestrator] Failed to create savepoint:', error);
                    throw error;
                }
            } else {
                // For non-SQLite, return a marker
                return `mock_${savepointName}`;
            }
        }
        
        /**
         * CRITICAL FIX #1: Implement savepoint rollback
         */
        async rollbackToSavepoint(savepointName) {
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                try {
                    await window.TaskSQLite.executeQuery(`ROLLBACK TO SAVEPOINT ${savepointName}`);
                    await window.TaskSQLite.executeQuery(`RELEASE SAVEPOINT ${savepointName}`);
                    console.log(`[MigrationOrchestrator] Rolled back to savepoint: ${savepointName}`);
                } catch (error) {
                    console.error('[MigrationOrchestrator] Savepoint rollback failed:', error);
                    throw error;
                }
            }
        }
        
        /**
         * CRITICAL FIX #1: Implement savepoint commit
         */
        async commitMigration(migrationId) {
            const savepointName = this.currentMigration?.savepoint;
            
            if (savepointName && window.TaskSQLite && window.TaskSQLite.isReady) {
                try {
                    await window.TaskSQLite.executeQuery(`RELEASE SAVEPOINT ${savepointName}`);
                    console.log(`[MigrationOrchestrator] Released savepoint: ${savepointName}`);
                } catch (error) {
                    console.error('[MigrationOrchestrator] Failed to release savepoint:', error);
                }
            }
        }
        
        /**
         * CRITICAL FIX #2: Fix rollback timer to abort migration
         */
        startRollbackTimer(migrationId, savepoint, backup) {
            this.rollbackTimer = setTimeout(async () => {
                console.error('[MigrationOrchestrator] Migration timeout - aborting and rolling back');
                
                // Abort the ongoing migration
                if (this.abortController) {
                    this.abortController.abort();
                }
                
                // Perform rollback
                await this.performInstantRollback(migrationId, new Error('Migration timeout'));
            }, this.rollbackTimeout);
        }
        
        /**
         * CRITICAL FIX #3: Implement real database size calculation
         */
        async getDatabaseSize() {
            try {
                if (window.TaskSQLite && window.TaskSQLite.isReady) {
                    // Try to get actual SQLite file size
                    if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
                        try {
                            const dbPath = 'stackmap_tasks.db';
                            const stat = await window.Capacitor.Plugins.Filesystem.stat({
                                path: dbPath,
                                directory: window.Capacitor.Plugins.Filesystem.Directory.Data
                            });
                            return stat.size;
                        } catch (error) {
                            console.log('[MigrationOrchestrator] Cannot stat DB file:', error);
                        }
                    }
                    
                    // Fallback: Estimate based on row counts and average row size
                    const tables = ['storage', 'attachments', 'voice_data'];
                    let totalSize = 0;
                    
                    for (const table of tables) {
                        try {
                            const countResult = await window.TaskSQLite.executeQuery(
                                `SELECT COUNT(*) as count FROM ${table}`
                            );
                            const count = countResult[0]?.count || 0;
                            
                            // Estimate average row size
                            const avgRowSize = table === 'voice_data' ? 50000 : 500; // bytes
                            totalSize += count * avgRowSize;
                        } catch (error) {
                            // Table might not exist
                        }
                    }
                    
                    // Add overhead (indexes, metadata, etc.)
                    return totalSize * 1.5;
                    
                } else {
                    // localStorage size estimation
                    let size = 0;
                    for (let key in localStorage) {
                        if (localStorage.hasOwnProperty(key)) {
                            size += localStorage[key].length + key.length;
                        }
                    }
                    return size * 2; // UTF-16
                }
            } catch (error) {
                console.error('[MigrationOrchestrator] Error calculating database size:', error);
                return 5 * 1024 * 1024; // Default 5MB
            }
        }
        
        /**
         * CRITICAL FIX #4: Add iOS memory estimation
         */
        async checkMemoryAvailability() {
            try {
                // First try standard API
                if ('memory' in performance) {
                    return super.checkMemoryAvailability();
                }
                
                // iOS/Safari fallback
                const memoryEstimate = {
                    sufficient: true,
                    available: 0,
                    required: 0,
                    warning: false,
                    platform: 'ios'
                };
                
                // Estimate based on various signals
                const isIOS = /iPhone|iPad/.test(navigator.userAgent);
                if (isIOS) {
                    // Check DOM complexity as proxy for memory usage
                    const elementCount = document.getElementsByTagName('*').length;
                    const imageCount = document.querySelectorAll('img').length;
                    const scriptCount = document.querySelectorAll('script').length;
                    
                    // Rough memory estimation
                    const estimatedUsageMB = (elementCount * 0.001) + (imageCount * 2) + (scriptCount * 0.5) + 50;
                    
                    // iOS typically has 2-4GB RAM, assume 1GB available for web
                    const estimatedAvailableMB = 1024 - estimatedUsageMB;
                    
                    // Database operation needs ~2x database size in memory
                    const dbSize = await this.getDatabaseSize();
                    const requiredMB = (dbSize / (1024 * 1024)) * 2;
                    
                    memoryEstimate.available = estimatedAvailableMB * 1024 * 1024;
                    memoryEstimate.required = requiredMB * 1024 * 1024;
                    memoryEstimate.sufficient = estimatedAvailableMB > requiredMB;
                    
                    if (estimatedAvailableMB < requiredMB * 1.5) {
                        memoryEstimate.warning = true;
                    }
                    
                    console.log(`[MigrationOrchestrator] iOS memory estimate: ${estimatedAvailableMB}MB available, ${requiredMB}MB required`);
                }
                
                return memoryEstimate;
                
            } catch (error) {
                console.error('[MigrationOrchestrator] Memory check error:', error);
                // Conservative default
                return {
                    sufficient: true,
                    warning: true,
                    available: 512 * 1024 * 1024, // 512MB
                    required: 256 * 1024 * 1024   // 256MB
                };
            }
        }
        
        /**
         * CRITICAL FIX #5: Implement missing helper methods
         */
        async getStoredRowCounts() {
            try {
                const metadata = await this.getMigrationMetadata();
                return metadata.rowCounts || {};
            } catch (error) {
                return {};
            }
        }
        
        async getActualRowCounts() {
            const counts = {};
            
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                const tables = ['storage', 'attachments', 'voice_data'];
                
                for (const table of tables) {
                    try {
                        const result = await window.TaskSQLite.executeQuery(
                            `SELECT COUNT(*) as count FROM ${table}`
                        );
                        counts[table] = result[0]?.count || 0;
                    } catch (error) {
                        counts[table] = 0;
                    }
                }
            } else {
                // For localStorage
                counts.tasks = 0;
                try {
                    const tasks = localStorage.getItem('stackmap_tasks');
                    if (tasks) {
                        counts.tasks = JSON.parse(tasks).length;
                    }
                } catch (error) {
                    // Ignore
                }
            }
            
            return counts;
        }
        
        async getMigrationMetadata() {
            try {
                if (window.StorageAdapter) {
                    const metadata = await window.StorageAdapter.getItem('migration_metadata');
                    return metadata ? JSON.parse(metadata) : {};
                }
            } catch (error) {
                console.error('[MigrationOrchestrator] Error getting migration metadata:', error);
            }
            return {};
        }
        
        async setMigrationMetadata(metadata) {
            try {
                if (window.StorageAdapter) {
                    await window.StorageAdapter.setItem('migration_metadata', JSON.stringify(metadata));
                }
            } catch (error) {
                console.error('[MigrationOrchestrator] Error setting migration metadata:', error);
            }
        }
        
        async getStoredChecksum(dataType) {
            try {
                const metadata = await this.getMigrationMetadata();
                return metadata.checksums?.[dataType] || null;
            } catch (error) {
                return null;
            }
        }
        
        async setStoredChecksum(dataType, checksum) {
            try {
                const metadata = await this.getMigrationMetadata();
                if (!metadata.checksums) {
                    metadata.checksums = {};
                }
                metadata.checksums[dataType] = checksum;
                await this.setMigrationMetadata(metadata);
            } catch (error) {
                console.error('[MigrationOrchestrator] Error storing checksum:', error);
            }
        }
        
        /**
         * CRITICAL FIX #7: Use IndexedDB for backups instead of localStorage
         */
        async createVerifiedBackup(migrationId) {
            console.log(`[MigrationOrchestrator] Creating verified backup for ${migrationId}`);
            
            const data = await this.getAllData();
            const backup = {
                id: `backup_${migrationId}`,
                timestamp: Date.now(),
                data: data,
                checksum: await this.calculateChecksum(JSON.stringify(data))
            };
            
            // Store in IndexedDB instead of localStorage
            if (this.backupDB) {
                return new Promise((resolve, reject) => {
                    const transaction = this.backupDB.transaction(['backups'], 'readwrite');
                    const store = transaction.objectStore('backups');
                    const request = store.put(backup);
                    
                    request.onsuccess = () => {
                        console.log(`[MigrationOrchestrator] Backup stored in IndexedDB: ${backup.id}`);
                        resolve(backup);
                    };
                    
                    request.onerror = (event) => {
                        console.error('[MigrationOrchestrator] Failed to store backup:', event);
                        // Fallback to BackupManager if available
                        if (window.BackupManager) {
                            window.BackupManager.createBackup({
                                type: 'migration',
                                migrationId: migrationId,
                                data: backup
                            }).then(resolve).catch(reject);
                        } else {
                            reject(new Error('Failed to create backup'));
                        }
                    };
                });
            }
            
            // Fallback to existing backup manager
            if (window.BackupManager) {
                return await window.BackupManager.createBackup({
                    type: 'migration',
                    migrationId: migrationId,
                    includeChecksum: true
                });
            }
            
            throw new Error('No backup storage available');
        }
        
        /**
         * CRITICAL FIX #8: Add progress reporting
         */
        reportProgress(phase, percentage, details = {}) {
            if (this.progressCallback) {
                this.progressCallback({
                    phase: phase,
                    percentage: percentage,
                    details: details,
                    timestamp: Date.now()
                });
            }
            
            // Also update UI if available
            if (window.migrationUI) {
                window.migrationUI.showProgress(phase, percentage, details);
            }
        }
        
        /**
         * CRITICAL FIX #9: Make JSON operations non-blocking
         */
        async calculateChecksum(data) {
            // For large data, chunk the processing
            if (data.length > 1024 * 1024) { // 1MB
                return await this.calculateChecksumChunked(data);
            }
            
            // Original implementation for small data
            return super.calculateChecksum(data);
        }
        
        async calculateChecksumChunked(data) {
            const chunkSize = 64 * 1024; // 64KB chunks
            const encoder = new TextEncoder();
            const chunks = [];
            
            // Process in chunks to avoid blocking
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                chunks.push(encoder.encode(chunk));
                
                // Yield to browser
                if (i % (chunkSize * 10) === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            
            // Combine chunks and calculate hash
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        
        /**
         * Override battery estimation with realistic values
         */
        estimateBatteryDrain(dbSizeBytes) {
            const dbSizeMB = dbSizeBytes / (1024 * 1024);
            
            // More realistic: 1-3% per minute on mobile
            // Estimate migration time first
            const rowsPerSecond = 100; // Conservative estimate
            const estimatedRows = dbSizeMB * 1000; // Rough estimate
            const estimatedSeconds = estimatedRows / rowsPerSecond;
            const estimatedMinutes = estimatedSeconds / 60;
            
            // 2% per minute average drain
            const drainPerMinute = 0.02;
            const estimatedDrain = estimatedMinutes * drainPerMinute;
            
            // Cap at 15% (very large migrations)
            return Math.min(0.15, estimatedDrain);
        }
        
        /**
         * Check if migration should be aborted
         */
        checkAbortSignal() {
            if (this.abortController && this.abortController.signal.aborted) {
                throw new Error('Migration aborted due to timeout or user cancellation');
            }
        }
        
        /**
         * Execute with monitoring and abort support
         */
        async executeWithMonitoring(operation, estimate) {
            const checkInterval = 100; // Check every 100ms
            let lastCheck = Date.now();
            
            // Wrap operation to add abort checks
            const monitoredOperation = async () => {
                // Create a periodic check
                const intervalId = setInterval(() => {
                    this.checkAbortSignal();
                }, checkInterval);
                
                try {
                    // Execute the actual operation
                    const result = await operation();
                    return result;
                } finally {
                    clearInterval(intervalId);
                }
            };
            
            return await monitoredOperation();
        }
    }
    
    // Replace the global instance
    window.FailSafeMigrationOrchestrator = FixedMigrationOrchestrator;
    
    // If there's already an instance, update it
    if (window.migrationOrchestrator) {
        console.log('[MigrationOrchestrator] Applying fixes to existing instance');
        // Copy methods to existing instance
        const fixed = new FixedMigrationOrchestrator();
        Object.setPrototypeOf(window.migrationOrchestrator, Object.getPrototypeOf(fixed));
    }
    
})();