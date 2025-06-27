/**
 * Offline Queue Management
 * Handles queueing and syncing of operations when offline
 * Integrates with Service Worker and SQLite storage
 */

(function() {
    'use strict';
    
    const OfflineQueue = {
        queue: [],
        isOnline: navigator.onLine,
        syncInProgress: false,
        maxRetries: 3,
        db: null,
        
        /**
         * Initialize offline queue
         */
        init: function() {
            const self = this;
            
            // Listen for online/offline events
            window.addEventListener('online', function() {
                self.isOnline = true;
                self.showStatus('Back online! Syncing...', 'info');
                self.processQueue();
            });
            
            window.addEventListener('offline', function() {
                self.isOnline = false;
                self.showStatus('You\'re offline - changes will sync later', 'info');
            });
            
            // Listen for service worker messages
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', function(event) {
                    self.handleServiceWorkerMessage(event.data);
                });
            }
            
            // Load persisted queue from storage
            self.loadQueue();
            
            // Process queue if online
            if (self.isOnline) {
                setTimeout(function() {
                    self.processQueue();
                }, 2000);
            }
        },
        
        /**
         * Add operation to queue
         */
        queueOperation: function(operation) {
            const self = this;
            
            const queueItem = {
                id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: operation.type,
                method: operation.method,
                endpoint: operation.endpoint,
                data: operation.data,
                timestamp: Date.now(),
                retries: 0,
                status: 'pending'
            };
            
            self.queue.push(queueItem);
            self.persistQueue();
            
            // Show user feedback
            self.showQueueIndicator();
            
            // Try to process immediately if online
            if (self.isOnline && !self.syncInProgress) {
                self.processQueue();
            }
            
            return queueItem.id;
        },
        
        /**
         * Process queued operations
         */
        processQueue: function() {
            const self = this;
            
            if (!self.isOnline || self.syncInProgress || self.queue.length === 0) {
                return;
            }
            
            self.syncInProgress = true;
            self.showSyncProgress(true);
            
            let processed = 0;
            let failed = 0;
            const total = self.queue.length;
            
            // Process each item
            self.queue.forEach(function(item) {
                if (item.status !== 'pending') return;
                
                self.processQueueItem(item).then(function() {
                    processed++;
                    item.status = 'completed';
                    self.updateProgress(processed, failed, total);
                }).catch(function(error) {
                    failed++;
                    item.retries++;
                    
                    if (item.retries >= self.maxRetries) {
                        item.status = 'failed';
                        item.error = error.message;
                    }
                    
                    self.updateProgress(processed, failed, total);
                }).finally(function() {
                    if (processed + failed === total) {
                        self.onQueueProcessed(processed, failed);
                    }
                });
            });
        },
        
        /**
         * Process individual queue item
         */
        processQueueItem: function(item) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                // Map operation type to actual function
                switch(item.type) {
                    case 'saveTask':
                        self.syncTask(item).then(resolve).catch(reject);
                        break;
                        
                    case 'deleteTask':
                        self.syncDeleteTask(item).then(resolve).catch(reject);
                        break;
                        
                    case 'saveSettings':
                        self.syncSettings(item).then(resolve).catch(reject);
                        break;
                        
                    case 'uploadPhoto':
                        self.syncPhoto(item).then(resolve).catch(reject);
                        break;
                        
                    default:
                        // Generic sync
                        self.syncGeneric(item).then(resolve).catch(reject);
                }
            });
        },
        
        /**
         * Sync task operation
         */
        syncTask: function(item) {
            // In real implementation, this would sync with backend
            // For now, just save to SQLite
            return new Promise(function(resolve, reject) {
                if (window.TaskSQLite && window.TaskSQLite.isReady) {
                    window.TaskSQLite.setItem(`task_${item.data.id}`, item.data, function(error) {
                        if (error) reject(error);
                        else resolve();
                    });
                } else {
                    // Fallback to localStorage
                    try {
                        localStorage.setItem(`stackmap-task_${item.data.id}`, JSON.stringify(item.data));
                        resolve();
                    } catch(e) {
                        reject(e);
                    }
                }
            });
        },
        
        /**
         * Sync task deletion
         */
        syncDeleteTask: function(item) {
            return new Promise(function(resolve, reject) {
                if (window.TaskSQLite && window.TaskSQLite.isReady) {
                    window.TaskSQLite.removeItem(`task_${item.data.id}`, function(error) {
                        if (error) reject(error);
                        else resolve();
                    });
                } else {
                    try {
                        localStorage.removeItem(`stackmap-task_${item.data.id}`);
                        resolve();
                    } catch(e) {
                        reject(e);
                    }
                }
            });
        },
        
        /**
         * Sync settings
         */
        syncSettings: function(item) {
            return new Promise(function(resolve, reject) {
                if (window.StorageAdapter) {
                    window.StorageAdapter.save('settings', item.data, function(error) {
                        if (error) reject(error);
                        else resolve();
                    });
                } else {
                    reject(new Error('StorageAdapter not available'));
                }
            });
        },
        
        /**
         * Sync photo upload
         */
        syncPhoto: function(item) {
            // Photos require special handling
            return new Promise(function(resolve, reject) {
                // In a real app, this would upload to server
                // For now, just mark as synced
                console.log('Photo sync placeholder for:', item.data.filename);
                resolve();
            });
        },
        
        /**
         * Generic sync operation
         */
        syncGeneric: function(item) {
            return fetch(item.endpoint, {
                method: item.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item.data)
            }).then(function(response) {
                if (!response.ok) {
                    throw new Error(`Sync failed: ${response.status}`);
                }
                return response.json();
            });
        },
        
        /**
         * Handle queue processing completion
         */
        onQueueProcessed: function(processed, failed) {
            const self = this;
            
            self.syncInProgress = false;
            self.showSyncProgress(false);
            
            // Remove completed items
            self.queue = self.queue.filter(function(item) {
                return item.status === 'pending';
            });
            
            self.persistQueue();
            
            // Show summary
            if (processed > 0 || failed > 0) {
                let message = `Sync complete: ${processed} synced`;
                if (failed > 0) {
                    message += `, ${failed} failed`;
                }
                self.showStatus(message, failed > 0 ? 'warning' : 'success');
            }
            
            self.updateQueueIndicator();
        },
        
        /**
         * Persist queue to storage
         */
        persistQueue: function() {
            const self = this;
            
            try {
                localStorage.setItem('stackmap-offline-queue', JSON.stringify(self.queue));
            } catch(e) {
                console.error('Failed to persist offline queue:', e);
            }
        },
        
        /**
         * Load queue from storage
         */
        loadQueue: function() {
            const self = this;
            
            try {
                const stored = localStorage.getItem('stackmap-offline-queue');
                if (stored) {
                    self.queue = JSON.parse(stored);
                    self.updateQueueIndicator();
                }
            } catch(e) {
                console.error('Failed to load offline queue:', e);
                self.queue = [];
            }
        },
        
        /**
         * Show queue indicator
         */
        showQueueIndicator: function() {
            const self = this;
            let indicator = document.getElementById('offline-queue-indicator');
            
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'offline-queue-indicator';
                indicator.className = 'offline-indicator';
                indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;' +
                    'background:#f59e0b;color:white;padding:8px 16px;' +
                    'border-radius:20px;font-size:14px;z-index:9999;' +
                    'display:flex;align-items:center;gap:8px;';
                document.body.appendChild(indicator);
            }
            
            self.updateQueueIndicator();
        },
        
        /**
         * Update queue indicator
         */
        updateQueueIndicator: function() {
            const self = this;
            const indicator = document.getElementById('offline-queue-indicator');
            
            if (!indicator) return;
            
            const pendingCount = self.queue.filter(function(item) {
                return item.status === 'pending';
            }).length;
            
            if (pendingCount === 0) {
                indicator.style.display = 'none';
            } else {
                indicator.style.display = 'flex';
                indicator.innerHTML = `<span class="spinner"></span>${pendingCount} waiting to sync`;
            }
        },
        
        /**
         * Show sync progress
         */
        showSyncProgress: function(show) {
            let progress = document.getElementById('sync-progress');
            
            if (!progress) {
                progress = document.createElement('div');
                progress.id = 'sync-progress';
                progress.className = 'sync-progress';
                progress.style.cssText = 'position:fixed;top:0;left:0;right:0;' +
                    'height:3px;background:#667eea;transform-origin:left;' +
                    'transition:transform 0.3s;z-index:10000;';
                document.body.appendChild(progress);
            }
            
            progress.style.display = show ? 'block' : 'none';
        },
        
        /**
         * Update sync progress
         */
        updateProgress: function(processed, failed, total) {
            const progress = document.getElementById('sync-progress');
            if (progress) {
                const percent = ((processed + failed) / total) * 100;
                progress.style.transform = `scaleX(${percent / 100})`;
            }
        },
        
        /**
         * Show status message
         */
        showStatus: function(message, type) {
            if (window.StackMapMessaging) {
                window.StackMapMessaging.show(message, type);
            } else {
                console.log('[OfflineQueue]', message);
            }
        },
        
        /**
         * Handle service worker messages
         */
        handleServiceWorkerMessage: function(data) {
            const self = this;
            
            switch(data.type) {
                case 'queued':
                    self.showStatus(data.message, 'info');
                    break;
                    
                case 'sync-complete':
                    self.loadQueue(); // Reload queue
                    self.updateQueueIndicator();
                    break;
            }
        },
        
        /**
         * Get queue status
         */
        getStatus: function() {
            const self = this;
            
            return {
                isOnline: self.isOnline,
                queueLength: self.queue.length,
                pending: self.queue.filter(function(i) { return i.status === 'pending'; }).length,
                failed: self.queue.filter(function(i) { return i.status === 'failed'; }).length,
                syncInProgress: self.syncInProgress
            };
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            OfflineQueue.init();
        });
    } else {
        OfflineQueue.init();
    }
    
    // Expose API
    window.OfflineQueue = OfflineQueue;
})();