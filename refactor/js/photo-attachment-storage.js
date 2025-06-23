// Photo Attachment Storage Module - Offline-first architecture
// Based on research findings for ADHD-optimized photo management

(function(exports) {
    'use strict';

    // Configuration based on research findings
    var CONFIG = {
        MAX_PHOTOS_PER_TASK: 3,  // Working memory limit
        MAX_VISIBLE_PHOTOS: 6,   // 3x2 grid
        THUMBNAIL_SIZE: 64,      // Standard thumbnail
        PRIMARY_THUMBNAIL_SIZE: 96, // Primary thumbnail
        MAX_CAPTION_LENGTH: 50,  // ~10 words
        CACHE_PERCENT: 0.15,     // 15% RAM for cache
        MIN_CACHE_MB: 8,
        MAX_CACHE_MB: 24,
        BATCH_SIZE: 5,           // Photos per sync batch
        MAX_RETRIES: 3,
        SYNC_INTERVAL: 30 * 60 * 1000 // 30 minutes
    };

    // Photo categories with color coding
    var PHOTO_CATEGORIES = {
        memory_aid: { color: '#4A90E2', label: 'Reference' },
        before: { color: '#7ED321', label: 'Before' },
        after: { color: '#9013FE', label: 'After' },
        progress: { color: '#F5A623', label: 'Progress' }
    };

    // Database schema for offline storage
    var PHOTO_SCHEMA = {
        name: 'stackmap_photos',
        version: 1,
        stores: {
            photos: {
                keyPath: 'id',
                indexes: [
                    { name: 'taskId', keyPath: 'taskId', unique: false },
                    { name: 'uploadStatus', keyPath: 'uploadStatus', unique: false },
                    { name: 'timestamp', keyPath: 'timestamp', unique: false }
                ]
            },
            thumbnails: {
                keyPath: 'photoId'
            }
        }
    };

    // Photo attachment storage manager - Singleton pattern
    var PhotoAttachmentStorage = function() {
        this.db = null;
        this.syncQueue = [];
        this.syncInProgress = false;
        this.cacheSize = this._calculateCacheSize();
        this.isReady = false;
        this.readyPromise = null;
        this.readyCallbacks = [];
        this.initError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    };
    
    // Singleton instance
    PhotoAttachmentStorage.instance = null;
    
    // Get singleton instance
    PhotoAttachmentStorage.getInstance = function() {
        if (!PhotoAttachmentStorage.instance) {
            PhotoAttachmentStorage.instance = new PhotoAttachmentStorage();
        }
        return PhotoAttachmentStorage.instance;
    };

    PhotoAttachmentStorage.prototype = {
        // Initialize the storage system
        init: function() {
            var self = this;
            
            // Create ready promise for modern browsers
            if (typeof Promise !== 'undefined') {
                this.readyPromise = new Promise(function(resolve, reject) {
                    self._initDatabase(resolve, reject);
                });
            } else {
                // Fallback for older browsers
                this._initDatabase();
            }
        },
        
        // Initialize the database
        _initDatabase: function(resolve, reject, retryCount) {
            var self = this;
            retryCount = retryCount || 0;
            
            // Check for private browsing or unsupported
            if (!window.indexedDB) {
                var error = new Error('IndexedDB not supported');
                self.initError = error;
                self.isReady = false;
                if (reject) reject(error);
                self._executeReadyCallbacks(null, error);
                return;
            }
            
            // Open IndexedDB
            var request;
            try {
                request = indexedDB.open(PHOTO_SCHEMA.name, PHOTO_SCHEMA.version);
            } catch (e) {
                // Handle private browsing mode
                var error = new Error('Failed to open database: ' + e.message);
                self.initError = error;
                self.isReady = false;
                if (reject) reject(error);
                self._executeReadyCallbacks(null, error);
                return;
            }
            
            request.onerror = function(event) {
                var error = new Error('Failed to open photo database: ' + (event.target.error || 'Unknown error'));
                console.error('Database error:', error);
                
                // Retry with exponential backoff
                if (retryCount < self.maxRetries) {
                    var delay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s
                    console.log('Retrying database connection in ' + delay + 'ms...');
                    setTimeout(function() {
                        self._initDatabase(resolve, reject, retryCount + 1);
                    }, delay);
                } else {
                    self.initError = error;
                    self.isReady = false;
                    if (reject) reject(error);
                    self._executeReadyCallbacks(null, error);
                }
            };
            
            request.onsuccess = function(event) {
                self.db = event.target.result;
                self.isReady = true;
                self.initError = null;
                self.retryCount = 0; // Reset retry count on success
                
                // Handle database close events
                self.db.onclose = function() {
                    console.warn('Database connection closed unexpectedly');
                    self.isReady = false;
                    self.db = null;
                    // Attempt to reconnect
                    self._reconnectDatabase();
                };
                
                self._scheduleSyncTask();
                if (resolve) resolve();
                self._executeReadyCallbacks(true, null);
            };
            
            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                
                // Create photo store
                if (!db.objectStoreNames.contains('photos')) {
                    var photoStore = db.createObjectStore('photos', { 
                        keyPath: 'id' 
                    });
                    
                    // Add indexes
                    PHOTO_SCHEMA.stores.photos.indexes.forEach(function(index) {
                        photoStore.createIndex(index.name, index.keyPath, { 
                            unique: index.unique 
                        });
                    });
                }
                
                // Create thumbnail cache store
                if (!db.objectStoreNames.contains('thumbnails')) {
                    db.createObjectStore('thumbnails', { 
                        keyPath: 'photoId' 
                    });
                }
            };
        },

        // Execute ready callbacks
        _executeReadyCallbacks: function(success, error) {
            var callbacks = this.readyCallbacks;
            this.readyCallbacks = []; // Clear to prevent memory leak
            callbacks.forEach(function(callback) {
                try {
                    callback(error, success);
                } catch (e) {
                    console.error('Error in ready callback:', e);
                }
            });
        },
        
        // Reconnect to database after unexpected close
        _reconnectDatabase: function() {
            var self = this;
            console.log('Attempting to reconnect to database...');
            
            // Reset state
            this.isReady = false;
            this.readyPromise = null;
            
            // Reinitialize
            if (typeof Promise !== 'undefined') {
                this.readyPromise = new Promise(function(resolve, reject) {
                    self._initDatabase(resolve, reject, 0);
                });
            } else {
                this._initDatabase(null, null, 0);
            }
        },
        
        // Wait for database to be ready
        whenReady: function(callback) {
            if (this.isReady) {
                callback(null, true);
            } else if (this.initError) {
                callback(this.initError, false);
            } else if (this.readyPromise && typeof this.readyPromise.then === 'function') {
                this.readyPromise.then(function() {
                    callback(null, true);
                }).catch(function(error) {
                    callback(error, false);
                });
            } else {
                // Prevent unlimited callback accumulation
                if (this.readyCallbacks.length < 100) {
                    this.readyCallbacks.push(callback);
                } else {
                    console.error('Too many pending callbacks, rejecting');
                    callback(new Error('Database initialization timeout'), false);
                }
            }
        },
        
        // Calculate cache size based on device memory
        _calculateCacheSize: function() {
            // Estimate available memory (fallback for older browsers)
            var totalMemory = 512; // Default 512MB
            
            if ('deviceMemory' in navigator) {
                totalMemory = navigator.deviceMemory * 1024; // Convert GB to MB
            }
            
            var cacheSize = Math.floor(totalMemory * CONFIG.CACHE_PERCENT);
            return Math.max(CONFIG.MIN_CACHE_MB, Math.min(CONFIG.MAX_CACHE_MB, cacheSize));
        },

        // Add photo to task
        addPhoto: function(taskId, photoData, callback) {
            var self = this;
            
            // Wait for database to be ready
            this.whenReady(function(error, ready) {
                if (!ready || !self.db) {
                    callback({
                        success: false,
                        error: error ? error.message : 'Database not ready'
                    });
                    return;
                }
                
                // Validate photo count
                self.getPhotosForTask(taskId, function(existingPhotos) {
                if (existingPhotos.length >= CONFIG.MAX_PHOTOS_PER_TASK) {
                    callback({
                        success: false,
                        error: 'Photo limit reached. Maximum ' + CONFIG.MAX_PHOTOS_PER_TASK + ' photos per task.'
                    });
                    return;
                }
                
                // Create photo record
                var photo = {
                    id: self._generateId(),
                    taskId: taskId,
                    localUri: photoData.uri,
                    uploadStatus: 'pending',
                    timestamp: Date.now(),
                    caption: photoData.caption || '',
                    category: photoData.category || self._detectCategory(photoData),
                    thumbnailUri: null,
                    size: photoData.size || 0,
                    mimeType: photoData.mimeType || 'image/jpeg'
                };
                
                // Store photo
                var transaction = self.db.transaction(['photos'], 'readwrite');
                var store = transaction.objectStore('photos');
                var request = store.add(photo);
                
                request.onsuccess = function() {
                    // Generate thumbnail asynchronously
                    self._generateThumbnail(photo.id, photo.localUri);
                    
                    // Add to sync queue
                    self.syncQueue.push(photo.id);
                    
                    callback({
                        success: true,
                        photo: photo,
                        remainingSlots: CONFIG.MAX_PHOTOS_PER_TASK - existingPhotos.length - 1
                    });
                };
                
                request.onerror = function(event) {
                    var error = event.target.error;
                    var errorMessage = 'Failed to store photo';
                    
                    // Handle specific errors
                    if (error && error.name === 'QuotaExceededError') {
                        errorMessage = 'Storage quota exceeded. Please free up space.';
                        console.error('Photo storage quota exceeded');
                    } else if (error) {
                        errorMessage = 'Storage error: ' + error.name;
                    }
                    
                    callback({
                        success: false,
                        error: errorMessage
                    });
                };
                });
            });
        },

        // Get photos for a specific task
        getPhotosForTask: function(taskId, callback) {
            var self = this;
            
            // Wait for database to be ready
            this.whenReady(function(error, ready) {
                if (!ready || !self.db) {
                    console.error('PhotoAttachmentStorage: Cannot get photos -', error ? error.message : 'Database not ready');
                    // Still return empty array but log the error
                    callback([]);
                    return;
                }
                
                var transaction = self.db.transaction(['photos'], 'readonly');
                var store = transaction.objectStore('photos');
                var index = store.index('taskId');
                var request = index.getAll(taskId);
                
                request.onsuccess = function() {
                    var photos = request.result || [];
                    
                    // Sort by timestamp
                    photos.sort(function(a, b) {
                        return a.timestamp - b.timestamp;
                    });
                    
                    callback(photos);
                };
                
                request.onerror = function() {
                    callback([]);
                };
            });
        },

        // Delete photo
        deletePhoto: function(photoId, callback) {
            var self = this;
            
            // Wait for database to be ready
            this.whenReady(function(error, ready) {
                if (!ready || !self.db) {
                    if (callback) callback({
                        success: false,
                        error: error ? error.message : 'Database not ready'
                    });
                    return;
                }
                
                var transaction = self.db.transaction(['photos', 'thumbnails'], 'readwrite');
            
            // Delete photo record
            var photoStore = transaction.objectStore('photos');
            photoStore.delete(photoId);
            
            // Delete thumbnail
            var thumbnailStore = transaction.objectStore('thumbnails');
            thumbnailStore.delete(photoId);
            
            transaction.oncomplete = function() {
                // Remove from sync queue if present
                var index = self.syncQueue.indexOf(photoId);
                if (index > -1) {
                    self.syncQueue.splice(index, 1);
                }
                
                callback({ success: true });
            };
            
            transaction.onerror = function() {
                callback({ success: false, error: 'Failed to delete photo' });
            };
            });
        },

        // Update photo caption
        updateCaption: function(photoId, caption, callback) {
            var self = this;
            
            // Validate caption length
            if (caption.length > CONFIG.MAX_CAPTION_LENGTH) {
                caption = caption.substring(0, CONFIG.MAX_CAPTION_LENGTH);
            }
            
            // Wait for database to be ready
            this.whenReady(function(error, ready) {
                if (!ready || !self.db) {
                    if (callback) callback({ 
                        success: false, 
                        error: error ? error.message : 'Database not ready' 
                    });
                    return;
                }
                
                var transaction = self.db.transaction(['photos'], 'readwrite');
            var store = transaction.objectStore('photos');
            var request = store.get(photoId);
            
            request.onsuccess = function() {
                var photo = request.result;
                if (photo) {
                    photo.caption = caption;
                    photo.uploadStatus = 'pending'; // Mark for re-sync
                    store.put(photo);
                    
                    callback({ success: true });
                } else {
                    callback({ success: false, error: 'Photo not found' });
                }
            };
            });
        },

        // Generate thumbnail for photo
        _generateThumbnail: function(photoId, imageUri) {
            var self = this;
            var startTime = performance.now();
            
            // Create image element
            var img = new Image();
            img.onload = function() {
                // Create canvas for thumbnail
                var canvas = document.createElement('canvas');
                canvas.width = CONFIG.THUMBNAIL_SIZE;
                canvas.height = CONFIG.THUMBNAIL_SIZE;
                
                // Get context with memory optimization hints
                var ctx = canvas.getContext('2d', {
                    // Hint for memory optimization
                    alpha: false,
                    desynchronized: true
                });
                
                // Disable smoothing for memory savings
                ctx.imageSmoothingEnabled = false;
                
                // Calculate crop dimensions to maintain aspect ratio
                var sourceSize = Math.min(img.width, img.height);
                var sourceX = (img.width - sourceSize) / 2;
                var sourceY = (img.height - sourceSize) / 2;
                
                // Draw thumbnail
                ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize,
                             0, 0, CONFIG.THUMBNAIL_SIZE, CONFIG.THUMBNAIL_SIZE);
                
                // Convert to blob with aggressive compression
                canvas.toBlob(function(blob) {
                    // Create blob URL for immediate use
                    var blobUrl = URL.createObjectURL(blob);
                    
                    // Store thumbnail
                    var reader = new FileReader();
                    reader.onloadend = function() {
                        // Ensure database is still ready before accessing
                        self.whenReady(function(error, ready) {
                            if (!ready || !self.db) {
                                console.error('Cannot save thumbnail, database not ready:', error);
                                URL.revokeObjectURL(blobUrl);
                                return;
                            }
                            
                            try {
                                var transaction = self.db.transaction(['thumbnails'], 'readwrite');
                                var store = transaction.objectStore('thumbnails');
                                
                                store.put({
                                    photoId: photoId,
                                    data: reader.result,
                                    blobUrl: blobUrl,
                                    size: CONFIG.THUMBNAIL_SIZE
                                });
                                
                                // Schedule cleanup of blob URL after use
                                setTimeout(function() {
                                    URL.revokeObjectURL(blobUrl);
                                }, 1000);
                                
                                // Log performance
                                var loadTime = performance.now() - startTime;
                                if (loadTime > 100) {
                                    console.warn('Slow thumbnail generation:', loadTime + 'ms');
                                }
                            } catch (e) {
                                console.error('Error saving thumbnail:', e);
                                URL.revokeObjectURL(blobUrl);
                            }
                        });
                    };
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', 0.7); // 70% quality for size optimization
            };
            
            img.src = imageUri;
        },

        // Detect photo category based on content/context
        _detectCategory: function(photoData) {
            // Simple heuristic - can be enhanced with ML later
            var filename = photoData.filename || '';
            var lowerName = filename.toLowerCase();
            
            if (lowerName.includes('before')) return 'before';
            if (lowerName.includes('after')) return 'after';
            if (lowerName.includes('progress')) return 'progress';
            
            return 'memory_aid'; // Default category
        },

        // Schedule background sync
        _scheduleSyncTask: function() {
            var self = this;
            
            // Use periodic sync if available
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(function(registration) {
                    if ('periodicSync' in registration) {
                        registration.periodicSync.register('photo-sync', {
                            minInterval: CONFIG.SYNC_INTERVAL
                        }).catch(function(error) {
                            console.log('Periodic sync registration failed:', error);
                            // Fallback to interval
                            setInterval(function() {
                                self._syncPhotos();
                            }, CONFIG.SYNC_INTERVAL);
                        });
                    } else {
                        // Fallback to interval
                        setInterval(function() {
                            self._syncPhotos();
                        }, CONFIG.SYNC_INTERVAL);
                    }
                }).catch(function(error) {
                    console.log('Service worker not ready:', error);
                    // Fallback to interval
                    setInterval(function() {
                        self._syncPhotos();
                    }, CONFIG.SYNC_INTERVAL);
                });
            } else {
                // Fallback to interval
                setInterval(function() {
                    self._syncPhotos();
                }, CONFIG.SYNC_INTERVAL);
            }
        },

        // Sync photos to server
        _syncPhotos: function() {
            var self = this;
            
            if (self.syncInProgress || !navigator.onLine) {
                return;
            }
            
            // Ensure database is ready
            self.whenReady(function(error, ready) {
                if (!ready || !self.db) {
                    console.error('Cannot sync photos, database not ready:', error);
                    return;
                }
                
                self.syncInProgress = true;
                
                try {
                    // Get pending photos
                    var transaction = self.db.transaction(['photos'], 'readonly');
                    var store = transaction.objectStore('photos');
                    var index = store.index('uploadStatus');
                    var request = index.getAll('pending');
                    
                    request.onsuccess = function() {
                        var pendingPhotos = request.result || [];
                        
                        if (pendingPhotos.length === 0) {
                            self.syncInProgress = false;
                            return;
                        }
                        
                        // Process in batches
                        var batches = [];
                        for (var i = 0; i < pendingPhotos.length; i += CONFIG.BATCH_SIZE) {
                            batches.push(pendingPhotos.slice(i, i + CONFIG.BATCH_SIZE));
                        }
                        
                        self._processSyncBatches(batches, 0);
                    };
                    
                    request.onerror = function() {
                        console.error('Failed to get pending photos for sync');
                        self.syncInProgress = false;
                    };
                } catch (e) {
                    console.error('Error starting sync:', e);
                    self.syncInProgress = false;
                }
            });
        },

        // Process sync batches
        _processSyncBatches: function(batches, index) {
            var self = this;
            
            if (index >= batches.length) {
                self.syncInProgress = false;
                return;
            }
            
            var batch = batches[index];
            var completed = 0;
            
            batch.forEach(function(photo) {
                self._uploadPhoto(photo, function(success) {
                    completed++;
                    
                    if (completed === batch.length) {
                        // Process next batch
                        setTimeout(function() {
                            self._processSyncBatches(batches, index + 1);
                        }, 1000); // 1 second delay between batches
                    }
                });
            });
        },

        // Upload individual photo
        _uploadPhoto: function(photo, callback) {
            var self = this;
            
            // Placeholder for actual upload logic
            // In production, this would upload to your server
            console.log('Uploading photo:', photo.id);
            
            // Simulate upload
            setTimeout(function() {
                // Ensure database is still ready
                self.whenReady(function(error, ready) {
                    if (!ready || !self.db) {
                        console.error('Cannot update photo status, database not ready:', error);
                        callback(false);
                        return;
                    }
                    
                    try {
                        // Update status
                        var transaction = self.db.transaction(['photos'], 'readwrite');
                        var store = transaction.objectStore('photos');
                        
                        photo.uploadStatus = 'uploaded';
                        store.put(photo);
                        
                        callback(true);
                    } catch (e) {
                        console.error('Error updating photo status:', e);
                        callback(false);
                    }
                });
            }, 1000);
        },

        // Generate unique ID
        _generateId: function() {
            return 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        // Get upload hint based on current photo count
        getUploadHint: function(currentCount) {
            if (currentCount === 0) {
                return 'Add up to ' + CONFIG.MAX_PHOTOS_PER_TASK + ' photos';
            }
            if (currentCount < CONFIG.MAX_PHOTOS_PER_TASK) {
                return 'Add ' + (CONFIG.MAX_PHOTOS_PER_TASK - currentCount) + ' more';
            }
            return 'Photo limit reached';
        }
    };

    // Export
    exports.PhotoAttachmentStorage = PhotoAttachmentStorage;
    exports.PHOTO_CATEGORIES = PHOTO_CATEGORIES;
    exports.PHOTO_CONFIG = CONFIG;

})(window);