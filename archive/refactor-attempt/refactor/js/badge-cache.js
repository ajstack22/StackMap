/**
 * Badge Cache - Story #101 Performance Optimization
 * Caches badge elements for improved rendering performance
 * Implements LRU eviction and cache invalidation strategies
 */

(function() {
    'use strict';
    
    const BadgeCache = {
        cache: new Map(),
        cacheOrder: [], // For LRU tracking
        maxCacheSize: 200, // Maximum cached badges
        stats: {
            hits: 0,
            misses: 0,
            evictions: 0,
            creations: 0
        },
        
        /**
         * Generate cache key for badge
         */
        generateKey: function(activityId, displayMode, timeEstimate, pinned, completed, safeMode) {
            return `${activityId}_${displayMode}_${timeEstimate || 0}_${pinned ? 1 : 0}_${completed ? 1 : 0}_${safeMode ? 1 : 0}`;
        },
        
        /**
         * Get badge from cache or return null
         */
        get: function(activityId, displayMode, timeEstimate, pinned, completed, safeMode) {
            const key = this.generateKey(activityId, displayMode, timeEstimate, pinned, completed, safeMode);
            
            if (this.cache.has(key)) {
                this.stats.hits++;
                
                // Update LRU order
                const index = this.cacheOrder.indexOf(key);
                if (index > -1) {
                    this.cacheOrder.splice(index, 1);
                }
                this.cacheOrder.push(key);
                
                // Clone the cached element
                const cached = this.cache.get(key);
                return cached.cloneNode(true);
            }
            
            this.stats.misses++;
            return null;
        },
        
        /**
         * Store badge in cache
         */
        set: function(activityId, displayMode, timeEstimate, pinned, completed, safeMode, badgeElement) {
            const key = this.generateKey(activityId, displayMode, timeEstimate, pinned, completed, safeMode);
            
            // Clone element for storage (to avoid DOM mutations affecting cache)
            const clonedElement = badgeElement.cloneNode(true);
            
            // Check if we need to evict
            if (this.cache.size >= this.maxCacheSize) {
                this.evictLRU();
            }
            
            // Store in cache
            this.cache.set(key, clonedElement);
            
            // Update LRU order
            const index = this.cacheOrder.indexOf(key);
            if (index > -1) {
                this.cacheOrder.splice(index, 1);
            }
            this.cacheOrder.push(key);
            
            this.stats.creations++;
        },
        
        /**
         * Evict least recently used item
         */
        evictLRU: function() {
            if (this.cacheOrder.length === 0) return;
            
            const oldestKey = this.cacheOrder.shift();
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        },
        
        /**
         * Invalidate cache entries for specific activity
         */
        invalidateActivity: function(activityId) {
            const keysToDelete = [];
            
            for (const key of this.cache.keys()) {
                if (key.startsWith(activityId + '_')) {
                    keysToDelete.push(key);
                }
            }
            
            keysToDelete.forEach(key => {
                this.cache.delete(key);
                const index = this.cacheOrder.indexOf(key);
                if (index > -1) {
                    this.cacheOrder.splice(index, 1);
                }
            });
            
            return keysToDelete.length;
        },
        
        /**
         * Invalidate cache entries for display mode
         */
        invalidateDisplayMode: function(displayMode) {
            const keysToDelete = [];
            
            for (const key of this.cache.keys()) {
                if (key.includes('_' + displayMode + '_')) {
                    keysToDelete.push(key);
                }
            }
            
            keysToDelete.forEach(key => {
                this.cache.delete(key);
                const index = this.cacheOrder.indexOf(key);
                if (index > -1) {
                    this.cacheOrder.splice(index, 1);
                }
            });
            
            return keysToDelete.length;
        },
        
        /**
         * Clear all cache entries
         */
        clear: function() {
            const count = this.cache.size;
            this.cache.clear();
            this.cacheOrder = [];
            return count;
        },
        
        /**
         * Get cache statistics
         */
        getStats: function() {
            const hitRate = this.stats.hits + this.stats.misses > 0 ? 
                (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
            
            return {
                size: this.cache.size,
                maxSize: this.maxCacheSize,
                hitRate: hitRate + '%',
                ...this.stats
            };
        },
        
        /**
         * Reset statistics
         */
        resetStats: function() {
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                creations: 0
            };
        },
        
        /**
         * Get memory usage estimate
         */
        getMemoryUsage: function() {
            // Rough estimate: each cached element is ~1KB
            return {
                estimated: this.cache.size * 1024,
                count: this.cache.size,
                unit: 'bytes'
            };
        },
        
        /**
         * Optimize cache by removing oldest entries
         */
        optimize: function(targetSize) {
            if (!targetSize) {
                targetSize = Math.floor(this.maxCacheSize * 0.8); // Remove 20%
            }
            
            let removed = 0;
            while (this.cache.size > targetSize && this.cacheOrder.length > 0) {
                this.evictLRU();
                removed++;
            }
            
            return removed;
        },
        
        /**
         * Debug information
         */
        getDebugInfo: function() {
            const keys = Array.from(this.cache.keys());
            const keyPatterns = {};
            
            // Analyze key patterns
            keys.forEach(key => {
                const parts = key.split('_');
                if (parts.length >= 2) {
                    const mode = parts[1];
                    keyPatterns[mode] = (keyPatterns[mode] || 0) + 1;
                }
            });
            
            return {
                stats: this.getStats(),
                memory: this.getMemoryUsage(),
                keyPatterns: keyPatterns,
                sampleKeys: keys.slice(0, 5), // First 5 keys as samples
                lruOrder: this.cacheOrder.slice(-5) // Last 5 in LRU order
            };
        }
    };
    
    // Export to global scope
    window.BadgeCache = BadgeCache;
    
    // Add global cache management
    window.addEventListener('beforeunload', function() {
        BadgeCache.clear();
    });
    
    // Listen for memory pressure events
    if ('memory' in performance) {
        setInterval(function() {
            try {
                const memInfo = performance.memory;
                const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
                const limitMB = memInfo.jsHeapSizeLimit / (1024 * 1024);
                
                // If memory usage is high, optimize cache
                if (usedMB > limitMB * 0.8) {
                    const removed = BadgeCache.optimize(Math.floor(BadgeCache.maxCacheSize * 0.5));
                    if (removed > 0) {
                        console.log('BadgeCache: Optimized due to memory pressure, removed:', removed);
                    }
                }
            } catch (error) {
                // Ignore memory API errors
            }
        }, 30000); // Check every 30 seconds
    }
    
})();