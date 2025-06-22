/**
 * Storage Adapter - Safe abstraction layer for localStorage and IndexedDB
 * Provides seamless switching with corruption protection
 */

(function() {
    'use strict';
    
    // Storage health constants
    var STORAGE_HEALTH = {
        QUOTA_WARNING_THRESHOLD: 0.8,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 100,
        HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
        CORRUPTION_CHECK_INTERVAL: 5000 // 5 seconds
    };
    
    // Storage state
    var storageState = {
        backend: 'localStorage', // 'localStorage' or 'indexedDB'
        isHealthy: true,
        lastHealthCheck: 0,
        quotaUsed: 0,
        quotaAvailable: 0,
        corruptionDetected: false,
        migrationInProgress: false
    };
    
    /**
     * Storage Adapter Factory
     */
    var StorageAdapter = {
        /**
         * Initialize storage with capability detection
         */
        init: function(callback) {
            var self = this;
            
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
            var capabilities = {
                hasIndexedDB: false,
                indexedDBReliable: false,
                localStorageAvailable: false,
                estimatedQuota: 0
            };
            
            // Check localStorage
            try {
                var testKey = 'stackmap_capability_test';
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
                var testDB = indexedDB.open('stackmap_capability_test', 1);
                var timeout = setTimeout(function() {
                    capabilities.indexedDBReliable = false;
                    callback(capabilities);
                }, 1000); // 1 second timeout
                
                testDB.onsuccess = function(event) {
                    clearTimeout(timeout);
                    var db = event.target.result;
                    
                    // Additional reliability checks for known issues
                    var ua = navigator.userAgent.toLowerCase();
                    var isAndroid5 = ua.indexOf('android 5') > -1;
                    var isOldSafari = ua.indexOf('safari') > -1 && ua.indexOf('version/') > -1 && 
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
            var self = this;
            var attempts = 0;
            
            function tryGet() {
                attempts++;
                
                try {
                    if (storageState.backend === 'localStorage') {
                        var data = localStorage.getItem('stackmap-' + key);
                        if (data) {
                            try {
                                var parsed = JSON.parse(data);
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
                    if (attempts < STORAGE_HEALTH.RETRY_ATTEMPTS) {
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
            var self = this;
            var attempts = 0;
            
            function trySave() {
                attempts++;
                
                try {
                    // Add integrity checksum
                    var dataWithChecksum = self.addDataChecksum(data);
                    
                    if (storageState.backend === 'localStorage') {
                        localStorage.setItem('stackmap-' + key, JSON.stringify(dataWithChecksum));
                        
                        // Verify write
                        var verification = localStorage.getItem('stackmap-' + key);
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
                    if (e.name === 'QuotaExceededError') {
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
            var str = JSON.stringify(data);
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
                var char = str.charCodeAt(i);
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
            
            var calculatedChecksum = this.calculateChecksum(dataWithChecksum.data);
            return calculatedChecksum === dataWithChecksum.checksum;
        },
        
        /**
         * Monitor storage health
         */
        startHealthMonitoring: function() {
            var self = this;
            
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
            var self = this;
            
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(function(estimate) {
                    storageState.quotaUsed = estimate.usage || 0;
                    storageState.quotaAvailable = estimate.quota || 0;
                    
                    var usageRatio = storageState.quotaUsed / storageState.quotaAvailable;
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
            var self = this;
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
                var msg = window.StackMapMessaging.quotaExceeded();
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
                window.location.href = window.location.pathname + '?safe=true&persist=true';
            }
        },
        
        /**
         * Show quota warning to user
         */
        showQuotaWarning: function(usageRatio) {
            var percentage = Math.round(usageRatio * 100);
            var message = 'Storage ' + percentage + '% full. Consider archiving old tasks.';
            this.showStorageAlert(message);
        },
        
        /**
         * Show storage alert
         */
        showStorageAlert: function(message) {
            try {
                var alert = document.getElementById('storage-alert');
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
    window.StackMapStorageAdapter = StorageAdapter;
})();