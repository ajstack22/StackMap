/**
 * Photo Cache Bridge
 * Integrates PhotoOptimizer with Service Worker for intelligent caching
 * Handles cache warming, preloading, and coordination
 */

(function() {
    'use strict';
    
    const PhotoCacheBridge = {
        // State
        serviceWorkerReady: false,
        pendingCacheRequests: [],
        
        /**
         * Initialize the bridge
         */
        init: function() {
            const self = this;
            
            // Wait for service worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                self.serviceWorkerReady = true;
                self.processPendingRequests();
            }
            
            // Listen for service worker controller change
            navigator.serviceWorker.addEventListener('controllerchange', function() {
                self.serviceWorkerReady = true;
                self.processPendingRequests();
            });
            
            // Hook into PhotoOptimizer processing
            self.setupPhotoOptimizerHooks();
            
            // Hook into PhotoLazyLoader events
            self.setupLazyLoaderHooks();
        },
        
        /**
         * Setup hooks for PhotoOptimizer
         */
        setupPhotoOptimizerHooks: function() {
            const self = this;
            
            if (!window.PhotoOptimizer) return;
            
            // Store original processImage function
            const originalProcessImage = window.PhotoOptimizer.processImage;
            
            // Override with cache-aware version
            window.PhotoOptimizer.processImage = function(file, callback) {
                originalProcessImage.call(this, file, function(error, result) {
                    if (!error && result) {
                        // Cache the generated versions
                        self.cachePhotoVersions(result, file.name);
                    }
                    
                    // Call original callback
                    if (callback) callback(error, result);
                });
            };
        },
        
        /**
         * Setup hooks for PhotoLazyLoader
         */
        setupLazyLoaderHooks: function() {
            const self = this;
            
            if (!window.PhotoLazyLoader) return;
            
            // Listen for lazy load events
            document.addEventListener('lazyloaded', function(event) {
                // Pre-cache next likely images
                self.predictiveCache(event.target);
            });
        },
        
        /**
         * Cache photo versions in service worker
         */
        cachePhotoVersions: function(result, filename) {
            const self = this;
            
            if (!self.serviceWorkerReady) {
                self.pendingCacheRequests.push({ result: result, filename: filename });
                return;
            }
            
            const urls = {};
            
            // Convert blobs to object URLs for caching
            if (result.thumbnail && window.PhotoOptimizer) {
                urls.thumbnail = window.PhotoOptimizer.createObjectUrl(
                    result.thumbnail, 
                    `cache_thumb_${filename}`
                );
            }
            
            if (result.medium && window.PhotoOptimizer) {
                urls.medium = window.PhotoOptimizer.createObjectUrl(
                    result.medium,
                    `cache_medium_${filename}`
                );
            }
            
            if (result.original && window.PhotoOptimizer) {
                urls.full = window.PhotoOptimizer.createObjectUrl(
                    result.original,
                    `cache_full_${filename}`
                );
            }
            
            // Send to service worker
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'cachePhoto',
                    urls: urls
                });
            }
        },
        
        /**
         * Process pending cache requests
         */
        processPendingRequests: function() {
            const self = this;
            
            if (!self.serviceWorkerReady) return;
            
            self.pendingCacheRequests.forEach(function(request) {
                self.cachePhotoVersions(request.result, request.filename);
            });
            
            self.pendingCacheRequests = [];
        },
        
        /**
         * Predictive caching based on viewport
         */
        predictiveCache: function(loadedImage) {
            const self = this;
            
            // Find nearby images that might be viewed next
            const container = loadedImage.closest('.photo-grid');
            if (!container) return;
            
            const allImages = container.querySelectorAll('[data-lazy-src]');
            const loadedIndex = Array.prototype.indexOf.call(allImages, loadedImage);
            
            // Pre-cache next 3 images
            for (let i = 1; i <= 3; i++) {
                const nextIndex = loadedIndex + i;
                if (nextIndex < allImages.length) {
                    const nextImage = allImages[nextIndex];
                    self.warmCache(nextImage);
                }
            }
        },
        
        /**
         * Warm cache for specific image
         */
        warmCache: function(image) {
            const self = this;
            
            if (!navigator.serviceWorker.controller) return;
            
            const urls = {
                thumbnail: image.getAttribute('data-lazy-thumbnail'),
                medium: image.getAttribute('data-lazy-medium'),
                full: image.getAttribute('data-lazy-src')
            };
            
            // Only cache if URLs exist
            if (urls.thumbnail || urls.medium || urls.full) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'cachePhoto',
                    urls: urls
                });
            }
        },
        
        /**
         * Get cache statistics
         */
        getCacheStats: function(callback) {
            if (!navigator.serviceWorker.controller) {
                callback(null);
                return;
            }
            
            const channel = new MessageChannel();
            channel.port1.onmessage = function(event) {
                callback(event.data);
            };
            
            navigator.serviceWorker.controller.postMessage({
                type: 'getCacheStats'
            }, [channel.port2]);
        },
        
        /**
         * Clear photo cache
         */
        clearPhotoCache: function() {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'clearCache',
                    cacheName: 'stackmap-photos-v1'
                });
            }
            
            // Also clear PhotoOptimizer memory cache
            if (window.PhotoOptimizer) {
                window.PhotoOptimizer.clearCache();
            }
        },
        
        /**
         * Preload critical photos
         */
        preloadCriticalPhotos: function(photoIds) {
            const self = this;
            
            // This would be called when viewing a task
            // to preload its photos for offline access
            photoIds.forEach(function(photoId) {
                // Construct URLs based on your photo storage pattern
                const urls = {
                    thumbnail: `/api/photos/${photoId}?size=thumbnail`,
                    medium: `/api/photos/${photoId}?size=medium`,
                    full: `/api/photos/${photoId}`
                };
                
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'cachePhoto',
                        urls: urls
                    });
                }
            });
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            PhotoCacheBridge.init();
        });
    } else {
        PhotoCacheBridge.init();
    }
    
    // Expose API
    window.PhotoCacheBridge = PhotoCacheBridge;
})();