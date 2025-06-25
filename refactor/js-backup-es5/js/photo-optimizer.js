/**
 * Photo Optimizer
 * Handles image compression, thumbnail generation, and memory management
 * Optimized for ADHD/autism users with performance constraints
 */

(function() {
    'use strict';
    
    const PhotoOptimizer = {
        // Configuration
        sizes: {
            thumbnail: { width: 150, height: 150, quality: 0.7, maxSize: 100 * 1024 }, // 100KB
            medium: { width: 800, height: 800, quality: 0.8, maxSize: 500 * 1024 }, // 500KB
            original: { quality: 0.9, maxSize: 2 * 1024 * 1024 } // 2MB
        },
        
        // Memory pool management
        memoryPool: {
            maxLoaded: 5,
            loaded: [],
            objectUrls: {},
            lastCleanup: 0
        },
        
        // Processing queue
        processingQueue: [],
        isProcessing: false,
        
        /**
         * Process image file and generate all sizes
         */
        processImage: function(file, callback) {
            const self = this;
            
            if (!file || !file.type.startsWith('image/')) {
                if (callback) callback(new Error('Invalid image file'), null);
                return;
            }
            
            const startTime = Date.now();
            const results = {
                original: null,
                medium: null,
                thumbnail: null,
                metadata: {
                    originalSize: file.size,
                    type: file.type,
                    name: file.name,
                    processTime: 0
                }
            };
            
            // Add to processing queue
            self.processingQueue.push({
                file: file,
                results: results,
                callback: callback,
                startTime: startTime
            });
            
            // Process queue
            self.processNextInQueue();
        },
        
        /**
         * Process next item in queue
         */
        processNextInQueue: function() {
            const self = this;
            
            if (self.isProcessing || self.processingQueue.length === 0) {
                return;
            }
            
            self.isProcessing = true;
            const item = self.processingQueue.shift();
            
            // Load image
            self.loadImage(item.file, function(img, error) {
                if (error) {
                    self.isProcessing = false;
                    if (item.callback) item.callback(error, null);
                    self.processNextInQueue();
                    return;
                }
                
                // Generate all sizes
                self.generateSizes(img, item.file, item.results, function(error, results) {
                    self.isProcessing = false;
                    results.metadata.processTime = Date.now() - item.startTime;
                    
                    if (item.callback) item.callback(error, results);
                    self.processNextInQueue();
                });
            });
        },
        
        /**
         * Load image from file
         */
        loadImage: function(file, callback) {
            const reader = new FileReader();
            const img = new Image();
            
            reader.onload = function(e) {
                img.onload = function() {
                    callback(img, null);
                };
                
                img.onerror = function() {
                    callback(null, new Error('Failed to load image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                callback(null, new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        },
        
        /**
         * Generate all image sizes
         */
        generateSizes: function(img, originalFile, results, callback) {
            const self = this;
            let completed = 0;
            let hasError = false;
            
            // Process each size
            ['thumbnail', 'medium', 'original'].forEach(function(sizeName) {
                const config = self.sizes[sizeName];
                
                self.resizeImage(img, config, originalFile, function(error, blob) {
                    if (error) {
                        hasError = true;
                    } else {
                        results[sizeName] = blob;
                    }
                    
                    completed++;
                    if (completed === 3) {
                        callback(hasError ? new Error('Some sizes failed') : null, results);
                    }
                });
            });
        },
        
        /**
         * Resize image to specified dimensions
         */
        resizeImage: function(img, config, originalFile, callback) {
            const self = this;
            
            // Calculate dimensions
            let width = img.width;
            let height = img.height;
            
            if (config.width && config.height) {
                // Fit within bounds while maintaining aspect ratio
                const scale = Math.min(
                    config.width / width,
                    config.height / height,
                    1 // Don't upscale
                );
                
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            
            // Use better image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob with quality settings
            self.canvasToBlob(canvas, originalFile.type, config.quality, config.maxSize, callback);
        },
        
        /**
         * Convert canvas to blob with size constraints
         */
        canvasToBlob: function(canvas, mimeType, quality, maxSize, callback) {
            const self = this;
            
            // Ensure valid mime type
            if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
                mimeType = 'image/jpeg';
            }
            
            function tryCompress(q) {
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        callback(new Error('Failed to create blob'), null);
                        return;
                    }
                    
                    // Check size
                    if (blob.size > maxSize && q > 0.1) {
                        // Try again with lower quality
                        tryCompress(q - 0.1);
                    } else {
                        callback(null, blob);
                    }
                }, mimeType, q);
            }
            
            tryCompress(quality);
        },
        
        /**
         * Create object URL with memory management
         */
        createObjectUrl: function(blob, key) {
            const self = this;
            
            // Clean up old URLs if needed
            self.cleanupMemoryPool();
            
            // Revoke existing URL for this key
            if (self.memoryPool.objectUrls[key]) {
                URL.revokeObjectURL(self.memoryPool.objectUrls[key]);
            }
            
            // Create new URL
            const url = URL.createObjectURL(blob);
            self.memoryPool.objectUrls[key] = url;
            
            // Track loaded image
            self.memoryPool.loaded.push({
                key: key,
                size: blob.size,
                timestamp: Date.now()
            });
            
            return url;
        },
        
        /**
         * Clean up memory pool
         */
        cleanupMemoryPool: function() {
            const self = this;
            const now = Date.now();
            
            // Only cleanup every 30 seconds
            if (now - self.memoryPool.lastCleanup < 30000) {
                return;
            }
            
            self.memoryPool.lastCleanup = now;
            
            // Remove oldest entries if over limit
            if (self.memoryPool.loaded.length > self.memoryPool.maxLoaded) {
                const toRemove = self.memoryPool.loaded.splice(0, 
                    self.memoryPool.loaded.length - self.memoryPool.maxLoaded);
                
                toRemove.forEach(function(item) {
                    if (self.memoryPool.objectUrls[item.key]) {
                        URL.revokeObjectURL(self.memoryPool.objectUrls[item.key]);
                        delete self.memoryPool.objectUrls[item.key];
                    }
                });
            }
        },
        
        /**
         * Revoke object URL
         */
        revokeObjectUrl: function(key) {
            const self = this;
            
            if (self.memoryPool.objectUrls[key]) {
                URL.revokeObjectURL(self.memoryPool.objectUrls[key]);
                delete self.memoryPool.objectUrls[key];
                
                // Remove from loaded list
                self.memoryPool.loaded = self.memoryPool.loaded.filter(function(item) {
                    return item.key !== key;
                });
            }
        },
        
        /**
         * Get image dimensions without loading full image
         */
        getImageDimensions: function(file, callback) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    callback(null, {
                        width: img.width,
                        height: img.height
                    });
                };
                
                img.onerror = function() {
                    callback(new Error('Failed to load image dimensions'), null);
                };
                
                // Load just enough to get dimensions
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                callback(new Error('Failed to read file'), null);
            };
            
            // Read as data URL (could optimize with ArrayBuffer for large files)
            reader.readAsDataURL(file);
        },
        
        /**
         * Validate image file
         */
        validateImage: function(file) {
            const errors = [];
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                errors.push('Not an image file');
            }
            
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                errors.push('Image too large (max 10MB)');
            }
            
            // Check supported formats
            const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!supportedTypes.includes(file.type)) {
                errors.push('Unsupported image format');
            }
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
        },
        
        /**
         * Create data URL for small images (thumbnails)
         */
        blobToDataUrl: function(blob, callback) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                callback(null, e.target.result);
            };
            
            reader.onerror = function() {
                callback(new Error('Failed to convert blob to data URL'), null);
            };
            
            reader.readAsDataURL(blob);
        },
        
        /**
         * Get memory usage stats
         */
        getMemoryStats: function() {
            const self = this;
            
            let totalSize = 0;
            self.memoryPool.loaded.forEach(function(item) {
                totalSize += item.size;
            });
            
            return {
                loadedCount: self.memoryPool.loaded.length,
                totalSize: totalSize,
                objectUrlCount: Object.keys(self.memoryPool.objectUrls).length,
                queueLength: self.processingQueue.length
            };
        },
        
        /**
         * Clear all cached URLs
         */
        clearCache: function() {
            const self = this;
            
            // Revoke all object URLs
            for (const key in self.memoryPool.objectUrls) {
                URL.revokeObjectURL(self.memoryPool.objectUrls[key]);
            }
            
            // Reset memory pool
            self.memoryPool.objectUrls = {};
            self.memoryPool.loaded = [];
            self.memoryPool.lastCleanup = 0;
        }
    };
    
    // Expose API
    window.PhotoOptimizer = PhotoOptimizer;
})();