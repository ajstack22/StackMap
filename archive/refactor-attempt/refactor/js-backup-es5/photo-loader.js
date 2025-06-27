/**
 * Photo Loader - Progressive Loading & Memory Management
 * Optimizes image loading for low-RAM devices (512MB target)
 */

(function(exports) {
    'use strict';
    
    var PhotoLoader = {
        // Configuration
        config: {
            MAX_CONCURRENT_LOADS: 2,
            MEMORY_CHECK_INTERVAL: 5000,
            LOW_MEMORY_THRESHOLD: 40, // MB
            CACHE_SIZE_NORMAL: 10,
            CACHE_SIZE_LOW_MEMORY: 3,
            UNLOAD_DELAY: 30000 // 30 seconds
        },
        
        // State
        loadQueue: [],
        activeLoads: 0,
        loadedImages: new Map(),
        memoryPressure: false,
        lastMemoryCheck: 0,
        
        // Initialize
        init: function() {
            var self = this;
            
            // Start memory monitoring
            this.startMemoryMonitoring();
            
            // Listen for visibility changes
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    self.pauseLoading();
                } else {
                    self.resumeLoading();
                }
            });
        },
        
        // Load image with progressive enhancement
        loadImage: function(element, photo, options) {
            var self = this;
            options = options || {};
            
            // Create load task
            var task = {
                element: element,
                photo: photo,
                priority: options.priority || 'normal',
                onLoad: options.onLoad || function() {},
                onError: options.onError || function() {},
                retryCount: 0
            };
            
            // Add to queue
            if (options.priority === 'high') {
                this.loadQueue.unshift(task);
            } else {
                this.loadQueue.push(task);
            }
            
            // Process queue
            this.processQueue();
        },
        
        // Process load queue
        processQueue: function() {
            var self = this;
            
            // Check if we can load more
            if (this.activeLoads >= this.config.MAX_CONCURRENT_LOADS) {
                return;
            }
            
            // Check memory pressure
            if (this.memoryPressure && this.activeLoads > 0) {
                return;
            }
            
            // Get next task
            var task = this.loadQueue.shift();
            if (!task) return;
            
            this.activeLoads++;
            
            // Start loading
            this.performLoad(task);
        },
        
        // Perform actual image load
        performLoad: function(task) {
            var self = this;
            var startTime = performance.now();
            
            // Check if already loaded
            var cached = this.loadedImages.get(task.photo.id);
            if (cached && cached.blob) {
                task.element.src = cached.url;
                this.activeLoads--;
                task.onLoad();
                this.processQueue();
                return;
            }
            
            // Determine best source
            var sources = this.getImageSources(task.photo);
            var currentIndex = 0;
            
            function tryNextSource() {
                if (currentIndex >= sources.length) {
                    // All sources failed
                    self.activeLoads--;
                    task.onError(new Error('All sources failed'));
                    self.processQueue();
                    return;
                }
                
                var source = sources[currentIndex];
                currentIndex++;
                
                // Create new image
                var img = new Image();
                
                img.onload = function() {
                    var loadTime = performance.now() - startTime;
                    
                    // Apply to element
                    task.element.src = source.url;
                    
                    // Cache the result
                    self.cacheImage(task.photo.id, {
                        url: source.url,
                        size: source.size,
                        width: img.width,
                        height: img.height,
                        loadTime: loadTime
                    });
                    
                    // Clean up
                    self.activeLoads--;
                    task.onLoad({
                        loadTime: loadTime,
                        size: source.size
                    });
                    
                    // Continue processing
                    self.processQueue();
                };
                
                img.onerror = function() {
                    // Try next source
                    tryNextSource();
                };
                
                // Set source
                img.src = source.url;
            }
            
            // Start loading
            tryNextSource();
        },
        
        // Get image sources in priority order
        getImageSources: function(photo) {
            var sources = [];
            
            // In low memory mode, prefer smaller images
            if (this.memoryPressure) {
                if (photo.thumbnailUrl) {
                    sources.push({ url: photo.thumbnailUrl, size: 'thumbnail' });
                }
                if (photo.mediumUrl) {
                    sources.push({ url: photo.mediumUrl, size: 'medium' });
                }
            } else {
                // Normal mode - start with medium for better quality
                if (photo.mediumUrl) {
                    sources.push({ url: photo.mediumUrl, size: 'medium' });
                }
                if (photo.fullUrl) {
                    sources.push({ url: photo.fullUrl, size: 'full' });
                }
                if (photo.thumbnailUrl) {
                    sources.push({ url: photo.thumbnailUrl, size: 'thumbnail' });
                }
            }
            
            // Fallback to any available source
            if (photo.localUri) {
                sources.push({ url: photo.localUri, size: 'original' });
            }
            
            return sources;
        },
        
        // Cache loaded image
        cacheImage: function(photoId, data) {
            // Add to cache
            this.loadedImages.set(photoId, {
                data: data,
                timestamp: Date.now(),
                lastAccess: Date.now()
            });
            
            // Cleanup old entries if needed
            this.cleanupCache();
        },
        
        // Cleanup cache based on memory pressure
        cleanupCache: function() {
            var maxSize = this.memoryPressure ? 
                this.config.CACHE_SIZE_LOW_MEMORY : 
                this.config.CACHE_SIZE_NORMAL;
            
            if (this.loadedImages.size <= maxSize) {
                return;
            }
            
            // Sort by last access time
            var entries = Array.from(this.loadedImages.entries());
            entries.sort(function(a, b) {
                return a[1].lastAccess - b[1].lastAccess;
            });
            
            // Remove oldest entries
            var toRemove = entries.slice(0, entries.length - maxSize);
            toRemove.forEach(function(entry) {
                this.loadedImages.delete(entry[0]);
            }, this);
        },
        
        // Start memory monitoring
        startMemoryMonitoring: function() {
            var self = this;
            
            function checkMemory() {
                var now = Date.now();
                if (now - self.lastMemoryCheck < self.config.MEMORY_CHECK_INTERVAL) {
                    return;
                }
                
                self.lastMemoryCheck = now;
                var usage = self.estimateMemoryUsage();
                
                // Update memory pressure state
                var wasUnderPressure = self.memoryPressure;
                self.memoryPressure = usage.totalMB > self.config.LOW_MEMORY_THRESHOLD;
                
                // If memory pressure changed, adjust behavior
                if (self.memoryPressure && !wasUnderPressure) {
                    console.log('PhotoLoader: Entering low memory mode');
                    self.reduceConcurrency();
                    self.cleanupCache();
                } else if (!self.memoryPressure && wasUnderPressure) {
                    console.log('PhotoLoader: Exiting low memory mode');
                    self.restoreConcurrency();
                }
            }
            
            // Check periodically
            setInterval(checkMemory, this.config.MEMORY_CHECK_INTERVAL);
            
            // Also check on critical events
            window.addEventListener('resize', checkMemory);
            document.addEventListener('visibilitychange', checkMemory);
        },
        
        // Estimate memory usage
        estimateMemoryUsage: function() {
            var images = document.querySelectorAll('img');
            var loadedImages = 0;
            var estimatedBytes = 0;
            
            for (var i = 0; i < images.length; i++) {
                if (images[i].complete && images[i].naturalHeight !== 0) {
                    loadedImages++;
                    // Rough estimate: width * height * 4 bytes per pixel
                    estimatedBytes += images[i].naturalWidth * images[i].naturalHeight * 4;
                }
            }
            
            // Add cache size estimate
            this.loadedImages.forEach(function(cached) {
                if (cached.data.width && cached.data.height) {
                    estimatedBytes += cached.data.width * cached.data.height * 4;
                }
            });
            
            return {
                imageCount: loadedImages,
                cacheCount: this.loadedImages.size,
                totalMB: Math.round(estimatedBytes / 1024 / 1024)
            };
        },
        
        // Reduce concurrency under memory pressure
        reduceConcurrency: function() {
            this.config.MAX_CONCURRENT_LOADS = 1;
            
            // Cancel low priority loads
            this.loadQueue = this.loadQueue.filter(function(task) {
                return task.priority === 'high';
            });
        },
        
        // Restore normal concurrency
        restoreConcurrency: function() {
            this.config.MAX_CONCURRENT_LOADS = 2;
        },
        
        // Pause loading (e.g., when app is hidden)
        pauseLoading: function() {
            // Don't start new loads
            this._pauseFlag = true;
        },
        
        // Resume loading
        resumeLoading: function() {
            this._pauseFlag = false;
            this.processQueue();
        },
        
        // Preload images with low priority
        preloadImages: function(photos) {
            var self = this;
            
            photos.forEach(function(photo) {
                // Create dummy element for preloading
                var img = new Image();
                
                self.loadImage(img, photo, {
                    priority: 'low',
                    onLoad: function() {
                        // Preloaded successfully
                    },
                    onError: function() {
                        // Preload failed, ignore
                    }
                });
            });
        },
        
        // Get cache statistics
        getCacheStats: function() {
            var usage = this.estimateMemoryUsage();
            
            return {
                cacheSize: this.loadedImages.size,
                memoryUsageMB: usage.totalMB,
                memoryPressure: this.memoryPressure,
                activeLoads: this.activeLoads,
                queueLength: this.loadQueue.length
            };
        },
        
        // Clear all cached images
        clearCache: function() {
            this.loadedImages.clear();
            this.loadQueue = [];
            this.activeLoads = 0;
        }
    };
    
    // Auto-initialize
    PhotoLoader.init();
    
    // Export
    exports.PhotoLoader = PhotoLoader;
    
})(window);