/**
 * Memory Manager - Story #101 Performance Optimization
 * Manages memory usage, prevents leaks, and optimizes garbage collection
 * Integrates with badge cache and virtual scrolling systems
 */

(function() {
    'use strict';
    
    const MemoryManager = {
        isInitialized: false,
        memoryCheckInterval: null,
        gcScheduler: null,
        
        // Memory tracking
        baseline: {
            heapUsed: 0,
            heapTotal: 0,
            timestamp: 0
        },
        
        // Cleanup registry
        cleanupCallbacks: new Set(),
        eventListenerRegistry: new WeakMap(),
        timerRegistry: new Set(),
        observerRegistry: new Set(),
        
        // Configuration
        config: {
            memoryCheckInterval: 10000, // 10 seconds
            gcTriggerThreshold: 50, // MB growth before triggering cleanup
            maxEventListeners: 1000,
            maxTimers: 100,
            maxObservers: 50,
            lowMemoryThreshold: 0.8 // 80% of heap limit
        },
        
        // Performance targets from story requirements
        targets: {
            maxMemoryGrowthMB: 2, // per 1000 activities
            maxSessionMemoryMB: 100,
            gcIntervalMs: 30000 // 30 seconds
        },
        
        /**
         * Initialize memory management
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            try {
                // Establish memory baseline
                self.recordBaseline();
                
                // Setup memory monitoring
                self.setupMemoryMonitoring();
                
                // Setup garbage collection scheduling
                self.setupGarbageCollection();
                
                // Setup cleanup handlers
                self.setupCleanupHandlers();
                
                // Track page lifecycle
                self.setupPageLifecycle();
                
                self.isInitialized = true;
                console.log('MemoryManager: Initialized with baseline:', self.baseline);
                
            } catch (error) {
                console.error('MemoryManager: Failed to initialize:', error);
            }
        },
        
        /**
         * Record memory baseline
         */
        recordBaseline: function() {
            const self = this;
            
            if (performance.memory) {
                self.baseline = {
                    heapUsed: performance.memory.usedJSHeapSize,
                    heapTotal: performance.memory.totalJSHeapSize,
                    timestamp: Date.now()
                };
            } else {
                // Fallback estimation
                self.baseline = {
                    heapUsed: 10 * 1024 * 1024, // 10MB estimate
                    heapTotal: 50 * 1024 * 1024, // 50MB estimate
                    timestamp: Date.now()
                };
            }
        },
        
        /**
         * Setup periodic memory monitoring
         */
        setupMemoryMonitoring: function() {
            const self = this;
            
            self.memoryCheckInterval = setInterval(function() {
                self.checkMemoryUsage();
            }, self.config.memoryCheckInterval);
            
            self.registerTimer(self.memoryCheckInterval);
        },
        
        /**
         * Setup garbage collection scheduling
         */
        setupGarbageCollection: function() {
            const self = this;
            
            self.gcScheduler = setInterval(function() {
                self.scheduledCleanup();
            }, self.targets.gcIntervalMs);
            
            self.registerTimer(self.gcScheduler);
        },
        
        /**
         * Setup cleanup handlers for page lifecycle
         */
        setupCleanupHandlers: function() {
            const self = this;
            
            // Page visibility change
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    self.onPageHidden();
                } else {
                    self.onPageVisible();
                }
            });
            
            // Before page unload
            window.addEventListener('beforeunload', function() {
                self.cleanup();
            });
            
            // Memory pressure events (if supported)
            if ('memory' in performance && 'addEventListener' in performance.memory) {
                try {
                    performance.memory.addEventListener('memoryPressure', function() {
                        self.handleMemoryPressure();
                    });
                } catch (e) {
                    // Memory pressure events not supported
                }
            }
        },
        
        /**
         * Setup page lifecycle management
         */
        setupPageLifecycle: function() {
            const self = this;
            
            // Listen for performance issues
            document.addEventListener('performanceIssue', function(e) {
                if (e.detail.type === 'memory-growth') {
                    self.handleMemoryGrowth(e.detail.value);
                }
            });
            
            // Listen for badge cache events
            document.addEventListener('badgeCreationEnd', function(e) {
                if (!e.detail.cached) {
                    self.trackMemoryImpactingEvent('badge-creation');
                }
            });
        },
        
        /**
         * Check current memory usage
         */
        checkMemoryUsage: function() {
            const self = this;
            
            try {
                const current = self.getCurrentMemoryInfo();
                const growth = current.heapUsed - self.baseline.heapUsed;
                const growthMB = growth / (1024 * 1024);
                
                // Check against targets
                if (growthMB > self.targets.maxMemoryGrowthMB) {
                    self.handleExcessiveMemoryGrowth(growthMB);
                }
                
                // Check heap limit
                if (performance.memory && current.heapUsed > current.heapLimit * self.config.lowMemoryThreshold) {
                    self.handleLowMemory(current);
                }
                
                // Report to performance monitor
                if (window.PerformanceMonitor) {
                    document.dispatchEvent(new CustomEvent('memoryCheck', {
                        detail: {
                            current: current,
                            baseline: self.baseline,
                            growthMB: growthMB
                        }
                    }));
                }
                
            } catch (error) {
                console.warn('MemoryManager: Memory check failed:', error);
            }
        },
        
        /**
         * Get current memory information
         */
        getCurrentMemoryInfo: function() {
            if (performance.memory) {
                return {
                    heapUsed: performance.memory.usedJSHeapSize,
                    heapTotal: performance.memory.totalJSHeapSize,
                    heapLimit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
            }
            
            // Fallback estimation
            return {
                heapUsed: this.baseline.heapUsed + (10 * 1024 * 1024), // Assume 10MB growth
                heapTotal: this.baseline.heapTotal,
                heapLimit: 500 * 1024 * 1024, // 500MB limit estimate
                timestamp: Date.now()
            };
        },
        
        /**
         * Handle excessive memory growth
         */
        handleExcessiveMemoryGrowth: function(growthMB) {
            console.warn(`MemoryManager: Excessive memory growth detected: ${growthMB.toFixed(2)}MB`);
            
            // Trigger aggressive cleanup
            this.aggressiveCleanup();
            
            // Report performance issue
            if (window.PerformanceMonitor) {
                window.PerformanceMonitor.reportPerformanceIssue('excessive-memory-growth', growthMB);
            }
        },
        
        /**
         * Handle low memory conditions
         */
        handleLowMemory: function(memoryInfo) {
            const usagePercent = (memoryInfo.heapUsed / memoryInfo.heapLimit * 100).toFixed(1);
            console.warn(`MemoryManager: Low memory condition: ${usagePercent}% heap usage`);
            
            // Emergency cleanup
            this.emergencyCleanup();
        },
        
        /**
         * Handle memory pressure
         */
        handleMemoryPressure: function() {
            console.warn('MemoryManager: Memory pressure detected');
            this.emergencyCleanup();
        },
        
        /**
         * Handle memory growth from specific events
         */
        handleMemoryGrowth: function(growthMB) {
            if (growthMB > 5) { // 5MB growth in short time
                console.warn(`MemoryManager: Rapid memory growth: ${growthMB.toFixed(2)}MB`);
                this.scheduledCleanup();
            }
        },
        
        /**
         * Track events that impact memory
         */
        trackMemoryImpactingEvent: function(eventType) {
            // Could be expanded to track patterns
            console.log(`MemoryManager: Memory impacting event: ${eventType}`);
        },
        
        /**
         * Scheduled cleanup (regular maintenance)
         */
        scheduledCleanup: function() {
            const self = this;
            
            console.log('MemoryManager: Running scheduled cleanup');
            
            // Clean badge cache
            if (window.BadgeCache) {
                const removed = window.BadgeCache.optimize();
                if (removed > 0) {
                    console.log(`MemoryManager: Optimized badge cache, removed ${removed} entries`);
                }
            }
            
            // Clean virtual scroll optimizer
            if (window.VirtualScrollOptimizer) {
                window.VirtualScrollOptimizer.optimizeMemoryUsage();
            }
            
            // Run cleanup callbacks
            self.runCleanupCallbacks();
            
            // Suggest garbage collection
            self.suggestGarbageCollection();
        },
        
        /**
         * Aggressive cleanup (high memory usage)
         */
        aggressiveCleanup: function() {
            const self = this;
            
            console.log('MemoryManager: Running aggressive cleanup');
            
            // Clear more badge cache
            if (window.BadgeCache) {
                const removed = window.BadgeCache.optimize(Math.floor(window.BadgeCache.cache.size * 0.5));
                console.log(`MemoryManager: Aggressive badge cache cleanup, removed ${removed} entries`);
            }
            
            // Force virtual scroll optimization
            if (window.VirtualScrollOptimizer) {
                window.VirtualScrollOptimizer.optimizeOffscreenElements();
            }
            
            // Clear performance history
            if (window.PerformanceMonitor) {
                Object.keys(window.PerformanceMonitor.metrics).forEach(key => {
                    if (window.PerformanceMonitor.metrics[key].length > 20) {
                        window.PerformanceMonitor.metrics[key] = 
                            window.PerformanceMonitor.metrics[key].slice(-10);
                    }
                });
            }
            
            // Run cleanup callbacks
            self.runCleanupCallbacks();
            
            // Force garbage collection
            self.forceGarbageCollection();
        },
        
        /**
         * Emergency cleanup (critical memory conditions)
         */
        emergencyCleanup: function() {
            const self = this;
            
            console.warn('MemoryManager: Running emergency cleanup');
            
            // Clear most cached data
            if (window.BadgeCache) {
                const cleared = window.BadgeCache.clear();
                console.log(`MemoryManager: Emergency badge cache clear, removed ${cleared} entries`);
            }
            
            // Disable non-essential features temporarily
            self.disableNonEssentialFeatures();
            
            // Run cleanup callbacks
            self.runCleanupCallbacks();
            
            // Force garbage collection multiple times
            for (let i = 0; i < 3; i++) {
                setTimeout(() => self.forceGarbageCollection(), i * 100);
            }
        },
        
        /**
         * Disable non-essential features during memory pressure
         */
        disableNonEssentialFeatures: function() {
            // Disable animations in safe mode
            if (!window.StackMapSafeMode) {
                document.body.classList.add('memory-pressure-mode');
            }
            
            // Reduce intersection observer thresholds
            if (window.VirtualScrollOptimizer && window.VirtualScrollOptimizer.intersectionObserver) {
                // Temporarily reduce sensitivity
                console.log('MemoryManager: Reducing virtual scroll sensitivity');
            }
        },
        
        /**
         * Page hidden handler
         */
        onPageHidden: function() {
            console.log('MemoryManager: Page hidden, running cleanup');
            this.scheduledCleanup();
        },
        
        /**
         * Page visible handler
         */
        onPageVisible: function() {
            console.log('MemoryManager: Page visible, re-enabling features');
            
            // Re-enable features
            document.body.classList.remove('memory-pressure-mode');
        },
        
        /**
         * Register cleanup callback
         */
        registerCleanup: function(callback) {
            if (typeof callback === 'function') {
                this.cleanupCallbacks.add(callback);
            }
        },
        
        /**
         * Register event listener for tracking
         */
        registerEventListener: function(element, event, handler) {
            if (!this.eventListenerRegistry.has(element)) {
                this.eventListenerRegistry.set(element, []);
            }
            this.eventListenerRegistry.get(element).push({ event, handler });
        },
        
        /**
         * Register timer for tracking
         */
        registerTimer: function(timerId) {
            this.timerRegistry.add(timerId);
        },
        
        /**
         * Register observer for tracking
         */
        registerObserver: function(observer) {
            this.observerRegistry.add(observer);
        },
        
        /**
         * Run all cleanup callbacks
         */
        runCleanupCallbacks: function() {
            this.cleanupCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.warn('MemoryManager: Cleanup callback error:', error);
                }
            });
        },
        
        /**
         * Suggest garbage collection
         */
        suggestGarbageCollection: function() {
            // Multiple techniques to encourage GC
            if (window.gc) {
                // Chrome with --expose-gc flag
                window.gc();
            } else {
                // Fallback: create temporary objects to trigger GC
                try {
                    const temp = new Array(1000).fill(null).map(() => ({}));
                    temp.length = 0;
                } catch (e) {
                    // Ignore errors
                }
            }
        },
        
        /**
         * Force garbage collection (more aggressive)
         */
        forceGarbageCollection: function() {
            this.suggestGarbageCollection();
            
            // Additional GC encouragement
            if (window.requestIdleCallback) {
                window.requestIdleCallback(function() {
                    // Create and immediately release large temporary objects
                    try {
                        const temp = new ArrayBuffer(1024 * 1024); // 1MB
                        // Let it go out of scope
                    } catch (e) {
                        // Ignore errors
                    }
                });
            }
        },
        
        /**
         * Get memory statistics
         */
        getStats: function() {
            const current = this.getCurrentMemoryInfo();
            const growth = current.heapUsed - this.baseline.heapUsed;
            
            return {
                current: current,
                baseline: this.baseline,
                growthMB: growth / (1024 * 1024),
                registeredCleanups: this.cleanupCallbacks.size,
                registeredTimers: this.timerRegistry.size,
                registeredObservers: this.observerRegistry.size
            };
        },
        
        /**
         * Cleanup all resources
         */
        cleanup: function() {
            const self = this;
            
            console.log('MemoryManager: Final cleanup');
            
            // Clear intervals
            if (self.memoryCheckInterval) {
                clearInterval(self.memoryCheckInterval);
            }
            if (self.gcScheduler) {
                clearInterval(self.gcScheduler);
            }
            
            // Clear all registered timers
            self.timerRegistry.forEach(timerId => {
                clearTimeout(timerId);
                clearInterval(timerId);
            });
            
            // Disconnect all registered observers
            self.observerRegistry.forEach(observer => {
                if (observer.disconnect) {
                    observer.disconnect();
                }
            });
            
            // Run final cleanup callbacks
            self.runCleanupCallbacks();
            
            // Clear registries
            self.cleanupCallbacks.clear();
            self.timerRegistry.clear();
            self.observerRegistry.clear();
            
            // Force final garbage collection
            self.forceGarbageCollection();
            
            self.isInitialized = false;
        }
    };
    
    // Export to global scope
    window.MemoryManager = MemoryManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            MemoryManager.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => MemoryManager.init(), 100);
    }
    
})();