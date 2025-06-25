/**
 * Blob Lifecycle Manager
 * Manages attachment memory with automatic cleanup
 */

(function() {
    'use strict';
    
    var BLOB_CONFIG = {
        MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB max in memory
        MAX_OBJECT_URLS: 20, // Max concurrent object URLs
        CLEANUP_INTERVAL: 60000, // 1 minute
        ACCESS_TIMEOUT: 300000, // 5 minutes - cleanup unused blobs
        SAFARI_LIMIT: 50 * 1024 * 1024 // Safari 50MB total limit
    };
    
    var BlobManager = {
        // Track active object URLs
        objectUrls: {},
        
        // Track blob sizes
        blobSizes: {},
        
        // Track last access times
        lastAccess: {},
        
        // Reference counting
        refCounts: {},
        
        // Total memory usage
        totalMemoryUsage: 0,
        
        // Cleanup interval ID
        cleanupInterval: null,
        
        /**
         * Initialize blob manager
         */
        init: function() {
            var self = this;
            
            // Start cleanup interval
            this.cleanupInterval = setInterval(function() {
                self.cleanup();
            }, BLOB_CONFIG.CLEANUP_INTERVAL);
            
            // Clean up on page unload
            window.addEventListener('beforeunload', function() {
                self.revokeAll();
            });
            
            // Monitor memory pressure on Safari
            if (this.isSafari()) {
                this.monitorSafariQuota();
            }
        },
        
        /**
         * Create object URL with lifecycle management
         */
        createObjectURL: function(blob, attachmentId) {
            if (!blob || !attachmentId) {
                throw new Error('Blob and attachmentId required');
            }
            
            // Check memory limits
            var blobSize = blob.size || 0;
            if (this.totalMemoryUsage + blobSize > BLOB_CONFIG.MAX_MEMORY_USAGE) {
                // Trigger cleanup before creating new URL
                this.cleanup(true); // Force cleanup
                
                // Still over limit? Reject
                if (this.totalMemoryUsage + blobSize > BLOB_CONFIG.MAX_MEMORY_USAGE) {
                    throw new Error('Memory limit exceeded. Please close some attachments.');
                }
            }
            
            // Check object URL limit
            var urlCount = Object.keys(this.objectUrls).length;
            if (urlCount >= BLOB_CONFIG.MAX_OBJECT_URLS) {
                // Revoke least recently used
                this.revokeLeastRecentlyUsed();
            }
            
            // Revoke existing URL if any
            if (this.objectUrls[attachmentId]) {
                this.revokeObjectURL(attachmentId);
            }
            
            try {
                // Create new object URL
                var url = URL.createObjectURL(blob);
                
                // Track it
                this.objectUrls[attachmentId] = url;
                this.blobSizes[attachmentId] = blobSize;
                this.lastAccess[attachmentId] = Date.now();
                this.refCounts[attachmentId] = 1;
                this.totalMemoryUsage += blobSize;
                
                return url;
            } catch (e) {
                console.error('Failed to create object URL:', e);
                throw new Error('Could not create attachment preview');
            }
        },
        
        /**
         * Get existing object URL or create new one
         */
        getObjectURL: function(attachmentId, blobProvider) {
            if (this.objectUrls[attachmentId]) {
                // Update last access
                this.lastAccess[attachmentId] = Date.now();
                this.refCounts[attachmentId]++;
                return Promise.resolve(this.objectUrls[attachmentId]);
            }
            
            // Need to load blob
            var self = this;
            return blobProvider().then(function(blob) {
                return self.createObjectURL(blob, attachmentId);
            });
        },
        
        /**
         * Release reference to object URL
         */
        releaseObjectURL: function(attachmentId) {
            if (!this.refCounts[attachmentId]) return;
            
            this.refCounts[attachmentId]--;
            
            // If no more references, mark for cleanup
            if (this.refCounts[attachmentId] <= 0) {
                this.refCounts[attachmentId] = 0;
                // Don't revoke immediately - wait for cleanup cycle
            }
        },
        
        /**
         * Revoke object URL and clean up
         */
        revokeObjectURL: function(attachmentId) {
            var url = this.objectUrls[attachmentId];
            if (!url) return;
            
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('Failed to revoke object URL:', e);
            }
            
            // Update memory usage
            var size = this.blobSizes[attachmentId] || 0;
            this.totalMemoryUsage = Math.max(0, this.totalMemoryUsage - size);
            
            // Clean up tracking
            delete this.objectUrls[attachmentId];
            delete this.blobSizes[attachmentId];
            delete this.lastAccess[attachmentId];
            delete this.refCounts[attachmentId];
        },
        
        /**
         * Revoke all object URLs
         */
        revokeAll: function() {
            for (var attachmentId in this.objectUrls) {
                this.revokeObjectURL(attachmentId);
            }
            
            // Clear cleanup interval
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
        },
        
        /**
         * Cleanup unused object URLs
         */
        cleanup: function(force) {
            var now = Date.now();
            var revokeList = [];
            
            for (var attachmentId in this.objectUrls) {
                var shouldRevoke = false;
                
                // No references and timeout exceeded
                if (this.refCounts[attachmentId] === 0) {
                    var lastAccess = this.lastAccess[attachmentId] || 0;
                    if (force || (now - lastAccess > BLOB_CONFIG.ACCESS_TIMEOUT)) {
                        shouldRevoke = true;
                    }
                }
                
                if (shouldRevoke) {
                    revokeList.push(attachmentId);
                }
            }
            
            // Revoke collected URLs
            for (var i = 0; i < revokeList.length; i++) {
                this.revokeObjectURL(revokeList[i]);
            }
            
            // Log cleanup stats
            if (revokeList.length > 0) {
                console.log('Blob cleanup: Revoked ' + revokeList.length + ' URLs, ' +
                    'memory usage: ' + this.formatBytes(this.totalMemoryUsage));
            }
        },
        
        /**
         * Revoke least recently used URL
         */
        revokeLeastRecentlyUsed: function() {
            var oldestId = null;
            var oldestTime = Date.now();
            
            for (var attachmentId in this.objectUrls) {
                // Only consider URLs with no references
                if (this.refCounts[attachmentId] === 0) {
                    var lastAccess = this.lastAccess[attachmentId] || 0;
                    if (lastAccess < oldestTime) {
                        oldestTime = lastAccess;
                        oldestId = attachmentId;
                    }
                }
            }
            
            if (oldestId) {
                this.revokeObjectURL(oldestId);
            }
        },
        
        /**
         * Check if Safari
         */
        isSafari: function() {
            var ua = navigator.userAgent.toLowerCase();
            return ua.indexOf('safari') > -1 && ua.indexOf('chrome') === -1;
        },
        
        /**
         * Monitor Safari quota
         */
        monitorSafariQuota: function() {
            var self = this;
            
            // Safari-specific quota monitoring
            if (navigator.storage && navigator.storage.estimate) {
                navigator.storage.estimate().then(function(estimate) {
                    var usage = estimate.usage || 0;
                    var quota = estimate.quota || BLOB_CONFIG.SAFARI_LIMIT;
                    
                    if (usage > quota * 0.8) {
                        // Aggressive cleanup on Safari
                        self.cleanup(true);
                        
                        // Warn user
                        if (window.StackMapMessaging) {
                            var msg = window.StackMapMessaging.safariQuotaWarning();
                            self.showMemoryWarning(msg);
                        }
                    }
                });
            }
        },
        
        /**
         * Show memory warning
         */
        showMemoryWarning: function(message) {
            try {
                var warning = document.getElementById('memory-warning');
                if (!warning) {
                    warning = document.createElement('div');
                    warning.id = 'memory-warning';
                    warning.style.cssText = 'position:fixed;bottom:20px;left:20px;' +
                        'background:#dc2626;color:white;padding:12px 20px;' +
                        'border-radius:4px;font-size:14px;z-index:9999;' +
                        'box-shadow:0 2px 8px rgba(0,0,0,0.2);';
                    document.body.appendChild(warning);
                }
                
                warning.textContent = message || 'Attachment memory limit approaching';
                warning.style.display = 'block';
                
                setTimeout(function() {
                    if (warning) warning.style.display = 'none';
                }, 5000);
            } catch (e) {
                console.warn('Could not show memory warning:', e);
            }
        },
        
        /**
         * Format bytes for display
         */
        formatBytes: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            var k = 1024;
            var sizes = ['Bytes', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        /**
         * Get memory status
         */
        getStatus: function() {
            return {
                totalMemoryUsage: this.totalMemoryUsage,
                totalMemoryUsageFormatted: this.formatBytes(this.totalMemoryUsage),
                objectUrlCount: Object.keys(this.objectUrls).length,
                maxMemory: BLOB_CONFIG.MAX_MEMORY_USAGE,
                maxMemoryFormatted: this.formatBytes(BLOB_CONFIG.MAX_MEMORY_USAGE),
                usagePercentage: Math.round((this.totalMemoryUsage / BLOB_CONFIG.MAX_MEMORY_USAGE) * 100)
            };
        }
    };
    
    // Expose API
    window.StackMapBlobManager = BlobManager;
})();