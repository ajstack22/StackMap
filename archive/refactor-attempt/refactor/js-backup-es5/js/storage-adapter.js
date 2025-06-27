/**
 * Storage Adapter - Safe abstraction layer for localStorage and IndexedDB
 * Provides seamless switching with corruption protection
 */

(function() {
    'use strict';
    
    // Storage health constants
    const STORAGE_HEALTH = {
        QUOTA_WARNING_THRESHOLD: 0.8,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 100,
        HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
        CORRUPTION_CHECK_INTERVAL: 5000 // 5 seconds
    };
    
    // Storage state
    const storageState = {
        backend: 'localStorage', // 'localStorage', 'indexedDB', or 'sqlite'
        isHealthy: true,
        lastHealthCheck: 0,
        quotaUsed: 0,
        quotaAvailable: 0,
        corruptionDetected: false,
        migrationInProgress: false,
        sqliteReady: false
    };
    
    /**
     * Storage Adapter Factory
     */
    const StorageAdapter = {
        /**
         * Initialize storage with capability detection
         */
        init: function(callback) {
            const self = this;
            
            // First check if we're in a native Capacitor environment
            if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                // Try to initialize SQLite for native apps
                self.initSQLite(function(success) {
                    if (success) {
                        storageState.backend = 'sqlite';
                        storageState.sqliteReady = true;
                        console.log('Storage: Using SQLite (native)');
                        
                        // Check if we need to migrate from localStorage
                        if (window.MigrationManager && !window.MigrationManager.hasMigrated()) {
                            console.log('Storage: Starting migration from localStorage...');
                            window.MigrationManager.migrateFromLocalStorage(self.sqliteAdapter, function(migrated, error) {
                                if (migrated) {
                                    console.log('Storage: Migration completed successfully');
                                } else {
                                    console.error('Storage: Migration failed:', error);
                                    // Continue anyway, new data will be in SQLite
                                }
                                self.startHealthMonitoring();
                                if (callback) callback('sqlite');
                            });
                        } else {
                            self.startHealthMonitoring();
                            if (callback) callback('sqlite');
                        }
                    } else {
                        // SQLite failed, fall back to standard web storage
                        console.warn('Storage: SQLite init failed, falling back');
                        self.initWebStorage(callback);
                    }
                });
            } else {
                // Web/PWA environment - use standard storage
                self.initWebStorage(callback);
            }
        },
        
        /**
         * Initialize web storage (localStorage or IndexedDB)
         */
        initWebStorage: function(callback) {
            const self = this;
            
            // Detect IndexedDB capability and reliability
            this.detectCapabilities(function(capabilities) {
                if (capabilities.indexedDBReliable && !window.StackMapSafeMode) {
                    // Initialize IndexedDB if reliable
                    self.initIndexedDB(function(success) {
                        if (success) {
                            storageState.backend = 'indexedDB';
                            console.log('Storage: Using IndexedDB');
                        } else {
                            console.log('Storage: Falling back to localStorage');
                        }
                        self.startHealthMonitoring();
                        if (callback) callback(storageState.backend);
                    });
                } else {
                    // Use localStorage for safe mode or unreliable IndexedDB
                    console.log('Storage: Using localStorage (safe mode or capability issue)');
                    self.startHealthMonitoring();
                    if (callback) callback('localStorage');
                }
            });
        },
        
        /**
         * Detect storage capabilities and reliability
         */
        detectCapabilities: function(callback) {
            const capabilities = {
                hasIndexedDB: false,
                indexedDBReliable: false,
                localStorageAvailable: false,
                estimatedQuota: 0
            };
            
            // Check localStorage
            try {
                const testKey = 'stackmap_capability_test';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                capabilities.localStorageAvailable = true;
            } catch (e) {
                console.warn('localStorage not available:', e);
            }
            
            // Check IndexedDB
            if (window.indexedDB) {
                capabilities.hasIndexedDB = true;
                
                // Test IndexedDB reliability
                const testDB = indexedDB.open('stackmap_capability_test', 1);
                const timeout = setTimeout(function() {
                    capabilities.indexedDBReliable = false;
                    callback(capabilities);
                }, 1000); // 1 second timeout
                
                testDB.onsuccess = function(event) {
                    clearTimeout(timeout);
                    const db = event.target.result;
                    
                    // Additional reliability checks for known issues
                    const ua = navigator.userAgent.toLowerCase();
                    const isAndroid5 = ua.includes('android 5');
                    const isOldSafari = ua.includes('safari') && ua.includes('version/') && 
                                      parseInt(ua.split('version/')[1]) < 14;
                    
                    capabilities.indexedDBReliable = !isAndroid5 && !isOldSafari;
                    
                    // Clean up test database
                    db.close();
                    indexedDB.deleteDatabase('stackmap_capability_test');
                    
                    // Estimate available quota
                    if (navigator.storage && navigator.storage.estimate) {
                        navigator.storage.estimate().then(function(estimate) {
                            capabilities.estimatedQuota = estimate.quota || 0;
                            callback(capabilities);
                        }).catch(function() {
                            callback(capabilities);
                        });
                    } else {
                        callback(capabilities);
                    }
                };
                
                testDB.onerror = function() {
                    clearTimeout(timeout);
                    capabilities.indexedDBReliable = false;
                    callback(capabilities);
                };
            } else {
                callback(capabilities);
            }
        },
        
        /**
         * Initialize SQLite for native apps
         */
        initSQLite: function(callback) {
            const self = this;
            
            // Check if TaskSQLite is available
            if (!window.TaskSQLite) {
                console.error('Storage: TaskSQLite module not loaded');
                callback(false);
                return;
            }
            
            // Initialize TaskSQLite
            window.TaskSQLite.init(function(success, error) {
                if (success) {
                    // SQLite initialized successfully
                    self.sqliteAdapter = window.TaskSQLite;
                    callback(true);
                } else {
                    console.error('Storage: SQLite init error:', error);
                    callback(false);
                }
            });
        },
        
        /**
         * Initialize IndexedDB with Dexie
         */
        initIndexedDB: function(callback) {
            // This will be implemented when we add Dexie
            // For now, return false to use localStorage
            callback(false);
        },
        
        /**
         * Get data with corruption check and retry logic
         */
        get: function(key, callback) {
            const self = this;
            let attempts = 0;
            
            function tryGet() {
                attempts++;
                
                try {
                    if (storageState.backend === 'sqlite') {
                        // Use SQLite adapter
                        self.sqliteAdapter.getItem(key, function(error, data) {
                            if (error) {
                                callback(error, null);
                            } else if (data) {
                                // SQLite returns parsed data directly
                                if (self.verifyDataIntegrity(data)) {
                                    callback(null, data);
                                } else {
                                    callback(new Error('Data corruption detected'), null);
                                }
                            } else {
                                callback(null, null);
                            }
                        });
                    } else if (storageState.backend === 'localStorage') {
                        const data = localStorage.getItem(`stackmap-${key}`);
                        if (data) {
                            try {
                                const parsed = JSON.parse(data);
                                // Verify data integrity
                                if (self.verifyDataIntegrity(parsed)) {
                                    callback(null, parsed);
                                } else {
                                    throw new Error('Data corruption detected');
                                }
                            } catch (e) {
                                callback(e, null);
                            }
                        } else {
                            callback(null, null);
                        }
                    } else {
                        // IndexedDB implementation will go here
                        callback(new Error('IndexedDB not yet implemented'), null);
                    }
                } catch (e) {
                    if (window.StorageErrorHandler) {
                        const errorResponse = window.StorageErrorHandler.handle(e, `Get data: ${key}`);
                        if (errorResponse.retryable && attempts < STORAGE_HEALTH.RETRY_ATTEMPTS) {
                            setTimeout(tryGet, STORAGE_HEALTH.RETRY_DELAY * attempts);
                        } else {
                            callback(e, null);
                        }
                    } else if (attempts < STORAGE_HEALTH.RETRY_ATTEMPTS) {
                        setTimeout(tryGet, STORAGE_HEALTH.RETRY_DELAY * attempts);
                    } else {
                        self.handleStorageError(e);
                        callback(e, null);
                    }
                }
            }
            
            tryGet();
        },
        
        /**
         * Save data with write verification
         */
        save: function(key, data, callback) {
            const self = this;
            let attempts = 0;
            
            function trySave() {
                attempts++;
                
                try {
                    // Add integrity checksum
                    const dataWithChecksum = self.addDataChecksum(data);
                    
                    if (storageState.backend === 'sqlite') {
                        // Use SQLite adapter
                        self.sqliteAdapter.setItem(key, dataWithChecksum, function(error) {
                            if (error) {
                                if (callback) callback(error);
                            } else {
                                // Verify write by reading back
                                self.sqliteAdapter.getItem(key, function(readError, readData) {
                                    if (readError || !self.verifyDataIntegrity(readData)) {
                                        if (callback) callback(new Error('Write verification failed'));
                                    } else {
                                        if (callback) callback(null);
                                    }
                                });
                            }
                        });
                    } else if (storageState.backend === 'localStorage') {
                        localStorage.setItem(`stackmap-${key}`, JSON.stringify(dataWithChecksum));
                        
                        // Verify write
                        const verification = localStorage.getItem(`stackmap-${key}`);
                        if (verification === JSON.stringify(dataWithChecksum)) {
                            if (callback) callback(null);
                        } else {
                            throw new Error('Write verification failed');
                        }
                    } else {
                        // IndexedDB implementation will go here
                        if (callback) callback(new Error('IndexedDB not yet implemented'));
                    }
                } catch (e) {
                    if (window.StorageErrorHandler) {
                        const errorResponse = window.StorageErrorHandler.handle(e, `Save data: ${key}`);
                        if (e.name === 'QuotaExceededError') {
                            self.handleQuotaExceeded();
                            if (callback) callback(e);
                        } else if (errorResponse.retryable && attempts < STORAGE_HEALTH.RETRY_ATTEMPTS) {
                            setTimeout(trySave, STORAGE_HEALTH.RETRY_DELAY * attempts);
                        } else {
                            if (callback) callback(e);
                        }
                    } else if (e.name === 'QuotaExceededError') {
                        self.handleQuotaExceeded();
                        if (callback) callback(e);
                    } else if (attempts < STORAGE_HEALTH.RETRY_ATTEMPTS) {
                        setTimeout(trySave, STORAGE_HEALTH.RETRY_DELAY * attempts);
                    } else {
                        self.handleStorageError(e);
                        if (callback) callback(e);
                    }
                }
            }
            
            trySave();
        },
        
        /**
         * Add checksum for data integrity
         */
        addDataChecksum: function(data) {
            return {
                data: data,
                checksum: this.calculateChecksum(data),
                timestamp: Date.now(),
                version: 1
            };
        },
        
        /**
         * Calculate simple checksum
         */
        calculateChecksum: function(data) {
            const str = JSON.stringify(data);
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16);
        },
        
        /**
         * Verify data integrity
         */
        verifyDataIntegrity: function(dataWithChecksum) {
            if (!dataWithChecksum || !dataWithChecksum.data || !dataWithChecksum.checksum) {
                return false;
            }
            
            const calculatedChecksum = this.calculateChecksum(dataWithChecksum.data);
            return calculatedChecksum === dataWithChecksum.checksum;
        },
        
        /**
         * Monitor storage health
         */
        startHealthMonitoring: function() {
            const self = this;
            
            // Initial health check
            this.checkStorageHealth();
            
            // Periodic health checks
            setInterval(function() {
                self.checkStorageHealth();
            }, STORAGE_HEALTH.HEALTH_CHECK_INTERVAL);
            
            // Corruption detection
            setInterval(function() {
                self.detectCorruption();
            }, STORAGE_HEALTH.CORRUPTION_CHECK_INTERVAL);
        },
        
        /**
         * Check storage health and quota
         */
        checkStorageHealth: function() {
            const self = this;
            
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(function(estimate) {
                    storageState.quotaUsed = estimate.usage || 0;
                    storageState.quotaAvailable = estimate.quota || 0;
                    
                    const usageRatio = storageState.quotaUsed / storageState.quotaAvailable;
                    if (usageRatio > STORAGE_HEALTH.QUOTA_WARNING_THRESHOLD) {
                        self.showQuotaWarning(usageRatio);
                    }
                    
                    storageState.lastHealthCheck = Date.now();
                }).catch(function(e) {
                    console.warn('Storage health check failed:', e);
                });
            }
        },
        
        /**
         * Detect data corruption
         */
        detectCorruption: function() {
            // Sample check - verify a known good key
            const self = this;
            this.get('health-check', function(err, data) {
                if (!err && data === null) {
                    // First time - create health check entry
                    self.save('health-check', { healthy: true, timestamp: Date.now() });
                } else if (err) {
                    storageState.corruptionDetected = true;
                    self.handleCorruption();
                }
            });
        },
        
        /**
         * Handle quota exceeded
         */
        handleQuotaExceeded: function() {
            // Show user-friendly message
            if (window.StackMapMessaging) {
                const msg = window.StackMapMessaging.quotaExceeded();
                this.showStorageAlert(msg);
            }
            
            // Attempt cleanup of old data
            this.cleanupOldData();
        },
        
        /**
         * Handle storage errors
         */
        handleStorageError: function(error) {
            console.error('Storage error:', error);
            storageState.isHealthy = false;
            
            // Data preservation
            if (window.StackMapDataPreservation) {
                window.StackMapDataPreservation.saveNow('storage-error', {
                    error: error.message,
                    timestamp: Date.now(),
                    backend: storageState.backend
                });
            }
        },
        
        /**
         * Handle corruption detection
         */
        handleCorruption: function() {
            console.error('Storage corruption detected');
            
            // Switch to safe mode immediately
            if (!window.StackMapSafeMode) {
                window.location.href = `${window.location.pathname}?safe=true&persist=true`;
            }
        },
        
        /**
         * Show quota warning to user
         */
        showQuotaWarning: function(usageRatio) {
            const percentage = Math.round(usageRatio * 100);
            const message = `Storage ${percentage}% full. Consider archiving old tasks.`;
            this.showStorageAlert(message);
        },
        
        /**
         * Show storage alert
         */
        showStorageAlert: function(message) {
            try {
                let alert = document.getElementById('storage-alert');
                if (!alert) {
                    alert = document.createElement('div');
                    alert.id = 'storage-alert';
                    alert.style.cssText = 'position:fixed;top:60px;right:20px;background:#f59e0b;' +
                        'color:white;padding:12px 20px;border-radius:4px;font-size:14px;' +
                        'z-index:9998;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
                    document.body.appendChild(alert);
                }
                
                alert.textContent = message;
                alert.style.display = 'block';
                
                setTimeout(function() {
                    if (alert) alert.style.display = 'none';
                }, 5000);
            } catch (e) {
                console.warn('Could not show storage alert:', e);
            }
        },
        
        /**
         * Cleanup old data
         */
        cleanupOldData: function() {
            // This will be implemented based on business logic
            console.log('Cleanup old data - to be implemented');
        },
        
        /**
         * Get current storage backend
         */
        getBackend: function() {
            return storageState.backend;
        },
        
        /**
         * Check if storage is healthy
         */
        isHealthy: function() {
            return storageState.isHealthy && !storageState.corruptionDetected;
        },
        
        /**
         * Get storage status for UI
         */
        getStatus: function() {
            return {
                backend: storageState.backend,
                isHealthy: storageState.isHealthy,
                quotaUsed: storageState.quotaUsed,
                quotaAvailable: storageState.quotaAvailable,
                usagePercentage: Math.round((storageState.quotaUsed / storageState.quotaAvailable) * 100),
                lastHealthCheck: storageState.lastHealthCheck,
                corruptionDetected: storageState.corruptionDetected
            };
        }
    };
    
    // Expose API
    window.StorageAdapter = StorageAdapter;
    window.StackMapStorageAdapter = StorageAdapter; // Legacy alias
})();