/**
 * Attachment Storage Module
 * Handles photo attachments with IndexedDB storage
 * Max 3 photos per task, 2MB per photo, 10MB total per task
 */

(function() {
    'use strict';
    
    const ATTACHMENT_CONFIG = {
        MAX_PHOTOS_PER_TASK: 3,
        MAX_SIZE_PER_PHOTO: 2 * 1024 * 1024, // 2MB
        MAX_TOTAL_SIZE_PER_TASK: 10 * 1024 * 1024, // 10MB
        THUMBNAIL_SIZE: 200, // 200x200 for retina
        JPEG_QUALITY: 0.8,
        DB_NAME: 'StackMapAttachments',
        DB_VERSION: 1,
        STORE_NAME: 'attachments'
    };
    
    const AttachmentStorage = {
        db: null,
        isInitialized: false,
        
        /**
         * Initialize IndexedDB for attachment storage
         */
        init: function(callback) {
            if (this.isInitialized) {
                if (callback) callback(null);
                return;
            }
            
            const self = this;
            
            // Check IndexedDB support
            if (!window.indexedDB) {
                const error = new Error('IndexedDB not supported');
                console.error('AttachmentStorage:', error);
                if (callback) callback(error);
                return;
            }
            
            const request = indexedDB.open(ATTACHMENT_CONFIG.DB_NAME, ATTACHMENT_CONFIG.DB_VERSION);
            
            request.onerror = function() {
                const error = new Error('Failed to open IndexedDB');
                console.error('AttachmentStorage:', error);
                if (callback) callback(error);
            };
            
            request.onsuccess = function(event) {
                self.db = event.target.result;
                self.isInitialized = true;
                console.log('AttachmentStorage: Initialized successfully');
                if (callback) callback(null);
            };
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                
                // Create attachment store
                if (!db.objectStoreNames.contains(ATTACHMENT_CONFIG.STORE_NAME)) {
                    const store = db.createObjectStore(ATTACHMENT_CONFIG.STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    
                    // Create indexes
                    store.createIndex('taskId', 'taskId', { unique: false });
                    store.createIndex('created', 'created', { unique: false });
                }
            };
        },
        
        /**
         * Add photo to task with validation and compression
         */
        addPhoto: function(taskId, blob, callback) {
            const self = this;
            
            if (!this.isInitialized) {
                this.init(function(error) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    self.addPhoto(taskId, blob, callback);
                });
                return;
            }
            
            // Validate inputs
            if (!taskId || !blob) {
                callback(new Error('Task ID and blob required'));
                return;
            }
            
            // Check blob type
            if (!blob.type || blob.type.indexOf('image/') !== 0) {
                callback(new Error('Only image files allowed'));
                return;
            }
            
            // Get existing photos to check limits
            this.getPhotos(taskId, function(error, photos) {
                if (error) {
                    callback(error);
                    return;
                }
                
                // Check count limit
                if (photos.length >= ATTACHMENT_CONFIG.MAX_PHOTOS_PER_TASK) {
                    callback(new Error('Maximum 3 photos per task'));
                    return;
                }
                
                // Check total size limit
                let totalSize = 0;
                for (let i = 0; i < photos.length; i++) {
                    totalSize += photos[i].size || 0;
                }
                
                if (totalSize + blob.size > ATTACHMENT_CONFIG.MAX_TOTAL_SIZE_PER_TASK) {
                    callback(new Error('Total attachment size exceeds 10MB limit'));
                    return;
                }
                
                // Process the image (compress if needed)
                self.processImage(blob, function(error, processedBlob, thumbnail) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    
                    // Generate attachment ID
                    const attachmentId = `attach_${taskId}_${Date.now()}`;
                    
                    // Create attachment record
                    const attachment = {
                        id: attachmentId,
                        taskId: taskId,
                        blob: processedBlob,
                        thumbnail: thumbnail,
                        size: processedBlob.size,
                        type: processedBlob.type,
                        created: new Date().toISOString()
                    };
                    
                    // Store in IndexedDB
                    const transaction = self.db.transaction([ATTACHMENT_CONFIG.STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(ATTACHMENT_CONFIG.STORE_NAME);
                    const request = store.add(attachment);
                    
                    request.onsuccess = function() {
                        console.log('AttachmentStorage: Photo added', attachmentId);
                        callback(null, attachmentId);
                    };
                    
                    request.onerror = function() {
                        callback(new Error('Failed to store attachment'));
                    };
                });
            });
        },
        
        /**
         * Process image: compress if needed and generate thumbnail
         */
        processImage: function(blob, callback) {
            const self = this;
            
            // Check if compression needed
            if (blob.size <= ATTACHMENT_CONFIG.MAX_SIZE_PER_PHOTO) {
                // Just generate thumbnail
                this.generateThumbnail(blob, function(error, thumbnail) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    callback(null, blob, thumbnail);
                });
                return;
            }
            
            // Need to compress
            console.log('AttachmentStorage: Compressing image from', this.formatBytes(blob.size));
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Calculate new dimensions
                    const maxDimension = 1024;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height && width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                    
                    // Create canvas for compression
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Use requestAnimationFrame to prevent UI blocking
                    requestAnimationFrame(function() {
                        canvas.toBlob(function(compressedBlob) {
                            if (!compressedBlob) {
                                callback(new Error('Failed to compress image'));
                                return;
                            }
                            
                            console.log('AttachmentStorage: Compressed to', self.formatBytes(compressedBlob.size));
                            
                            // Generate thumbnail from compressed image
                            self.generateThumbnail(compressedBlob, function(error, thumbnail) {
                                if (error) {
                                    callback(error);
                                    return;
                                }
                                callback(null, compressedBlob, thumbnail);
                            });
                        }, 'image/jpeg', ATTACHMENT_CONFIG.JPEG_QUALITY);
                    });
                };
                
                img.onerror = function() {
                    callback(new Error('Failed to load image for compression'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                callback(new Error('Failed to read image file'));
            };
            
            reader.readAsDataURL(blob);
        },
        
        /**
         * Generate 200x200 thumbnail
         */
        generateThumbnail: function(blob, callback) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const size = ATTACHMENT_CONFIG.THUMBNAIL_SIZE;
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate crop dimensions for square thumbnail
                    const sourceSize = Math.min(img.width, img.height);
                    const sourceX = (img.width - sourceSize) / 2;
                    const sourceY = (img.height - sourceSize) / 2;
                    
                    // Draw cropped and scaled image
                    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
                    
                    // Convert to blob
                    requestAnimationFrame(function() {
                        canvas.toBlob(function(thumbnailBlob) {
                            if (!thumbnailBlob) {
                                callback(new Error('Failed to generate thumbnail'));
                                return;
                            }
                            callback(null, thumbnailBlob);
                        }, 'image/jpeg', 0.7);
                    });
                };
                
                img.onerror = function() {
                    callback(new Error('Failed to load image for thumbnail'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                callback(new Error('Failed to read image for thumbnail'));
            };
            
            reader.readAsDataURL(blob);
        },
        
        /**
         * Get all photos for a task
         */
        getPhotos: function(taskId, callback) {
            const self = this;
            
            if (!this.isInitialized) {
                this.init(function(error) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    self.getPhotos(taskId, callback);
                });
                return;
            }
            
            const transaction = this.db.transaction([ATTACHMENT_CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(ATTACHMENT_CONFIG.STORE_NAME);
            const index = store.index('taskId');
            const request = index.getAll(taskId);
            
            request.onsuccess = function(event) {
                const photos = event.target.result || [];
                callback(null, photos);
            };
            
            request.onerror = function() {
                callback(new Error('Failed to retrieve photos'));
            };
        },
        
        /**
         * Delete a photo
         */
        deletePhoto: function(attachmentId, callback) {
            const self = this;
            
            if (!this.isInitialized) {
                this.init(function(error) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    self.deletePhoto(attachmentId, callback);
                });
                return;
            }
            
            // First get the attachment to clean up blob URLs
            const getTransaction = this.db.transaction([ATTACHMENT_CONFIG.STORE_NAME], 'readonly');
            const getStore = getTransaction.objectStore(ATTACHMENT_CONFIG.STORE_NAME);
            const getRequest = getStore.get(attachmentId);
            
            getRequest.onsuccess = function(event) {
                const attachment = event.target.result;
                if (!attachment) {
                    callback(new Error('Attachment not found'));
                    return;
                }
                
                // Clean up any blob URLs in BlobManager
                if (window.StackMapBlobManager) {
                    window.StackMapBlobManager.revokeObjectURL(attachmentId);
                    // Also revoke thumbnail URL if exists
                    window.StackMapBlobManager.revokeObjectURL(`${attachmentId}_thumb`);
                }
                
                // Delete from IndexedDB
                const deleteTransaction = self.db.transaction([ATTACHMENT_CONFIG.STORE_NAME], 'readwrite');
                const deleteStore = deleteTransaction.objectStore(ATTACHMENT_CONFIG.STORE_NAME);
                const deleteRequest = deleteStore.delete(attachmentId);
                
                deleteRequest.onsuccess = function() {
                    console.log('AttachmentStorage: Photo deleted', attachmentId);
                    callback(null);
                };
                
                deleteRequest.onerror = function() {
                    callback(new Error('Failed to delete attachment'));
                };
            };
            
            getRequest.onerror = function() {
                callback(new Error('Failed to retrieve attachment for deletion'));
            };
        },
        
        /**
         * Delete all photos for a task
         */
        deleteTaskPhotos: function(taskId, callback) {
            const self = this;
            
            this.getPhotos(taskId, function(error, photos) {
                if (error) {
                    callback(error);
                    return;
                }
                
                let deleteCount = 0;
                const errors = [];
                
                // Delete each photo
                function deleteNext() {
                    if (deleteCount >= photos.length) {
                        // All done
                        if (errors.length > 0) {
                            callback(new Error('Some photos failed to delete'));
                        } else {
                            callback(null);
                        }
                        return;
                    }
                    
                    const photo = photos[deleteCount];
                    self.deletePhoto(photo.id, function(error) {
                        if (error) {
                            errors.push(error);
                        }
                        deleteCount++;
                        deleteNext();
                    });
                }
                
                if (photos.length > 0) {
                    deleteNext();
                } else {
                    callback(null);
                }
            });
        },
        
        /**
         * Get attachment URL using BlobManager
         */
        getPhotoURL: function(attachmentId, isThumbnail, callback) {
            const self = this;
            
            if (!window.StackMapBlobManager) {
                callback(new Error('BlobManager not available'));
                return;
            }
            
            const urlId = isThumbnail ? `${attachmentId}_thumb` : attachmentId;
            
            // Use BlobManager to get or create URL
            window.StackMapBlobManager.getObjectURL(urlId, function() {
                return new Promise(function(resolve, reject) {
                    // Get attachment from storage
                    const transaction = self.db.transaction([ATTACHMENT_CONFIG.STORE_NAME], 'readonly');
                    const store = transaction.objectStore(ATTACHMENT_CONFIG.STORE_NAME);
                    const request = store.get(attachmentId);
                    
                    request.onsuccess = function(event) {
                        const attachment = event.target.result;
                        if (!attachment) {
                            reject(new Error('Attachment not found'));
                            return;
                        }
                        
                        const blob = isThumbnail ? attachment.thumbnail : attachment.blob;
                        if (!blob) {
                            reject(new Error('Blob data not found'));
                            return;
                        }
                        
                        resolve(blob);
                    };
                    
                    request.onerror = function() {
                        reject(new Error('Failed to retrieve attachment'));
                    };
                });
            }).then(function(url) {
                callback(null, url);
            }).catch(function(error) {
                callback(error);
            });
        },
        
        /**
         * Get storage statistics
         */
        getStorageStats: function(callback) {
            const self = this;
            
            if (!this.isInitialized) {
                this.init(function(error) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    self.getStorageStats(callback);
                });
                return;
            }
            
            const transaction = this.db.transaction([ATTACHMENT_CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(ATTACHMENT_CONFIG.STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = function(event) {
                const attachments = event.target.result || [];
                let totalSize = 0;
                const taskStats = {};
                
                for (let i = 0; i < attachments.length; i++) {
                    const attachment = attachments[i];
                    totalSize += attachment.size || 0;
                    
                    if (!taskStats[attachment.taskId]) {
                        taskStats[attachment.taskId] = {
                            count: 0,
                            size: 0
                        };
                    }
                    
                    taskStats[attachment.taskId].count++;
                    taskStats[attachment.taskId].size += attachment.size || 0;
                }
                
                callback(null, {
                    totalAttachments: attachments.length,
                    totalSize: totalSize,
                    totalSizeFormatted: self.formatBytes(totalSize),
                    taskStats: taskStats
                });
            };
            
            request.onerror = function() {
                callback(new Error('Failed to get storage statistics'));
            };
        },
        
        /**
         * Format bytes for display
         */
        formatBytes: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        }
    };
    
    // Expose API
    window.StackMapAttachmentStorage = AttachmentStorage;
    
    // Initialize BlobManager if not already done
    if (window.StackMapBlobManager && !window.StackMapBlobManager.cleanupInterval) {
        window.StackMapBlobManager.init();
    }
})();