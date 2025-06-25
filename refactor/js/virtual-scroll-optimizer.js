/**
 * Virtual Scroll Optimizer - Story #101 Performance Optimization
 * Enhances virtual scrolling with badge awareness and memory management
 * Integrates with performance monitoring and badge caching systems
 */

(function() {
    'use strict';
    
    const VirtualScrollOptimizer = {
        isInitialized: false,
        observer: null,
        visibleElements: new Set(),
        intersectionObserver: null,
        
        // Performance tracking
        metrics: {
            visibilityChanges: 0,
            badgeUpdates: 0,
            cacheHits: 0,
            cacheMisses: 0
        },
        
        // Configuration
        config: {
            observerThreshold: [0, 0.25, 0.5, 0.75, 1.0],
            observerRootMargin: '100px 0px', // Pre-load badges 100px before visible
            recycleOffsetThreshold: 200, // Recycle elements 200px outside viewport
            maxCachedElements: 100, // Maximum cached DOM elements
            performanceCheckInterval: 5000 // Performance metrics check interval
        },
        
        // Element pools for recycling
        elementPool: {
            badges: [],
            containers: []
        },
        
        /**
         * Initialize virtual scroll optimizations
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            try {
                // Setup intersection observer for visibility tracking
                self.setupIntersectionObserver();
                
                // Setup mutation observer for dynamic content
                self.setupMutationObserver();
                
                // Listen for virtual scroll events
                self.setupEventListeners();
                
                // Setup periodic performance monitoring
                self.setupPerformanceMonitoring();
                
                self.isInitialized = true;
                console.log('VirtualScrollOptimizer: Initialized');
                
            } catch (error) {
                console.error('VirtualScrollOptimizer: Failed to initialize:', error);
            }
        },
        
        /**
         * Setup intersection observer for efficient visibility tracking
         */
        setupIntersectionObserver: function() {
            const self = this;
            
            if (!window.IntersectionObserver) {
                console.warn('VirtualScrollOptimizer: IntersectionObserver not supported');
                return;
            }
            
            self.intersectionObserver = new IntersectionObserver(function(entries) {
                self.handleVisibilityChange(entries);
            }, {
                threshold: self.config.observerThreshold,
                rootMargin: self.config.observerRootMargin
            });
        },
        
        /**
         * Setup mutation observer for dynamic content changes
         */
        setupMutationObserver: function() {
            const self = this;
            
            if (!window.MutationObserver) {
                console.warn('VirtualScrollOptimizer: MutationObserver not supported');
                return;
            }
            
            self.observer = new MutationObserver(function(mutations) {
                self.handleMutations(mutations);
            });
            
            // Observe activity container for changes
            const container = document.getElementById('activity-container');
            if (container) {
                self.observer.observe(container, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['data-activity-id', 'class']
                });
            }
        },
        
        /**
         * Setup event listeners for optimization triggers
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for virtual scroll cluster changes
            document.addEventListener('virtualScrollClusterChanged', function() {
                self.optimizeVisibleElements();
            });
            
            // Listen for activities updated
            document.addEventListener('activitiesUpdated', function() {
                self.updateVisibilityTracking();
            });
            
            // Listen for display mode changes
            document.addEventListener('displayModeChanged', function() {
                self.invalidateVisibleBadges();
            });
            
            // Listen for scroll events (throttled)
            let scrollTimeout;
            window.addEventListener('scroll', function() {
                if (scrollTimeout) return;
                
                scrollTimeout = setTimeout(function() {
                    self.optimizeOffscreenElements();
                    scrollTimeout = null;
                }, 100);
            }, { passive: true });
        },
        
        /**
         * Setup periodic performance monitoring
         */
        setupPerformanceMonitoring: function() {
            const self = this;
            
            setInterval(function() {
                self.reportPerformanceMetrics();
                self.optimizeMemoryUsage();
            }, self.config.performanceCheckInterval);
        },
        
        /**
         * Handle visibility changes from intersection observer
         */
        handleVisibilityChange: function(entries) {
            const self = this;
            
            entries.forEach(function(entry) {
                const element = entry.target;
                const activityId = element.getAttribute('data-activity-id');
                
                if (!activityId) return;
                
                if (entry.isIntersecting) {
                    // Element became visible
                    self.visibleElements.add(activityId);
                    self.ensureBadgeOptimized(element);
                } else {
                    // Element became hidden
                    self.visibleElements.delete(activityId);
                    self.considerElementRecycling(element);
                }
                
                self.metrics.visibilityChanges++;
            });
            
            // Performance monitoring
            if (window.PerformanceMonitor) {
                document.dispatchEvent(new CustomEvent('virtualScrollVisibilityChanged', {
                    detail: { 
                        visibleCount: self.visibleElements.size,
                        totalChanges: self.metrics.visibilityChanges
                    }
                }));
            }
        },
        
        /**
         * Handle DOM mutations for dynamic optimization
         */
        handleMutations: function(mutations) {
            const self = this;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Handle added nodes
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            self.optimizeNewElement(node);
                        }
                    });
                    
                    // Handle removed nodes
                    mutation.removedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            self.recycleRemovedElement(node);
                        }
                    });
                }
            });
        },
        
        /**
         * Optimize newly added elements
         */
        optimizeNewElement: function(element) {
            const self = this;
            
            // Check if it's an activity element
            const activityElement = element.matches('.activity-item, .task-item') ? 
                element : element.querySelector('.activity-item, .task-item');
                
            if (activityElement) {
                // Add to intersection observer
                if (self.intersectionObserver) {
                    self.intersectionObserver.observe(activityElement);
                }
                
                // Optimize badges if visible
                const rect = activityElement.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100;
                
                if (isVisible) {
                    self.ensureBadgeOptimized(activityElement);
                }
            }
        },
        
        /**
         * Recycle removed elements
         */
        recycleRemovedElement: function(element) {
            const self = this;
            
            const activityId = element.getAttribute('data-activity-id');
            if (activityId) {
                self.visibleElements.delete(activityId);
                
                // Unobserve from intersection observer
                if (self.intersectionObserver) {
                    self.intersectionObserver.unobserve(element);
                }
                
                // Recycle badges
                const badge = element.querySelector('.activity-badge');
                if (badge && self.elementPool.badges.length < self.config.maxCachedElements) {
                    // Clean badge for reuse
                    badge.textContent = '';
                    badge.className = 'activity-badge';
                    badge.style.cssText = '';
                    self.elementPool.badges.push(badge);
                }
            }
        },
        
        /**
         * Ensure badge is optimized for visible element
         */
        ensureBadgeOptimized: function(element) {
            const self = this;
            
            const activityId = element.getAttribute('data-activity-id');
            if (!activityId) return;
            
            // Check if badge exists and is optimized
            let badge = element.querySelector('.activity-badge');
            
            if (!badge) {
                // Create badge if missing
                self.createOptimizedBadge(element, activityId);
            } else {
                // Ensure badge is properly cached
                self.validateBadgeCache(badge, activityId);
            }
        },
        
        /**
         * Create optimized badge for element
         */
        createOptimizedBadge: function(element, activityId) {
            const self = this;
            
            // Get activity data
            const activity = self.getActivityById(activityId);
            if (!activity) return;
            
            // Get display number
            const displayNumber = self.getActivityDisplayNumber(activityId);
            
            // Use ActivityDisplay to create badge with caching
            if (window.ActivityDisplay && window.ActivityDisplay.createActivityBadge) {
                const badge = window.ActivityDisplay.createActivityBadge(activity, displayNumber);
                if (badge) {
                    element.appendChild(badge);
                    self.metrics.badgeUpdates++;
                }
            }
        },
        
        /**
         * Validate badge cache consistency
         */
        validateBadgeCache: function(badge, activityId) {
            const activity = this.getActivityById(activityId);
            if (!activity) return;
            
            // Check if badge matches current activity state
            const currentMode = window.ActivityDisplay ? 
                window.ActivityDisplay.getDisplayMode() : 'numbers';
            const expectedClass = `activity-badge activity-${currentMode}`;
            
            if (badge.className !== expectedClass) {
                // Badge is outdated, recreate it
                badge.remove();
                this.createOptimizedBadge(badge.parentElement, activityId);
            }
        },
        
        /**
         * Optimize visible elements
         */
        optimizeVisibleElements: function() {
            const self = this;
            
            self.visibleElements.forEach(function(activityId) {
                const element = document.querySelector(`[data-activity-id="${activityId}"]`);
                if (element) {
                    self.ensureBadgeOptimized(element);
                }
            });
        },
        
        /**
         * Optimize offscreen elements by recycling resources
         */
        optimizeOffscreenElements: function() {
            const self = this;
            const viewportHeight = window.innerHeight;
            const threshold = self.config.recycleOffsetThreshold;
            
            // Find elements far outside viewport
            const activityElements = document.querySelectorAll('.activity-item, .task-item');
            
            activityElements.forEach(function(element) {
                const rect = element.getBoundingClientRect();
                const isVeryFarOffscreen = 
                    rect.bottom < -threshold || rect.top > viewportHeight + threshold;
                
                if (isVeryFarOffscreen) {
                    self.recycleElementResources(element);
                }
            });
        },
        
        /**
         * Recycle resources from offscreen elements
         */
        recycleElementResources: function(element) {
            const badge = element.querySelector('.activity-badge');
            if (badge && this.elementPool.badges.length < this.config.maxCachedElements) {
                // Remove badge but keep element structure
                badge.remove();
                
                // Clean and pool the badge
                badge.textContent = '';
                badge.className = 'activity-badge';
                badge.style.cssText = '';
                this.elementPool.badges.push(badge);
            }
        },
        
        /**
         * Update visibility tracking after content changes
         */
        updateVisibilityTracking: function() {
            const self = this;
            
            if (!self.intersectionObserver) return;
            
            // Re-observe all activity elements
            const activityElements = document.querySelectorAll('.activity-item, .task-item');
            
            activityElements.forEach(function(element) {
                self.intersectionObserver.observe(element);
            });
        },
        
        /**
         * Invalidate visible badges when display mode changes
         */
        invalidateVisibleBadges: function() {
            const self = this;
            
            self.visibleElements.forEach(function(activityId) {
                const element = document.querySelector(`[data-activity-id="${activityId}"]`);
                if (element) {
                    const badge = element.querySelector('.activity-badge');
                    if (badge) {
                        badge.remove();
                    }
                    self.ensureBadgeOptimized(element);
                }
            });
        },
        
        /**
         * Optimize memory usage by clearing old cached elements
         */
        optimizeMemoryUsage: function() {
            const self = this;
            
            // Limit badge pool size
            if (self.elementPool.badges.length > self.config.maxCachedElements) {
                const excess = self.elementPool.badges.length - self.config.maxCachedElements;
                self.elementPool.badges.splice(0, excess);
            }
            
            // Clear container pool
            if (self.elementPool.containers.length > 20) {
                self.elementPool.containers.splice(0, 10);
            }
        },
        
        /**
         * Report performance metrics
         */
        reportPerformanceMetrics: function() {
            const self = this;
            
            if (window.PerformanceMonitor) {
                document.dispatchEvent(new CustomEvent('virtualScrollMetrics', {
                    detail: {
                        visibleElements: self.visibleElements.size,
                        pooledBadges: self.elementPool.badges.length,
                        metrics: { ...self.metrics }
                    }
                }));
            }
            
            // Reset counters
            self.metrics.visibilityChanges = 0;
            self.metrics.badgeUpdates = 0;
        },
        
        /**
         * Get activity by ID
         */
        getActivityById: function(activityId) {
            if (window.ActivityDisplay && window.ActivityDisplay.getActivityById) {
                return window.ActivityDisplay.getActivityById(activityId);
            }
            return null;
        },
        
        /**
         * Get activity display number
         */
        getActivityDisplayNumber: function(activityId) {
            // Find the element's position in the current view
            const elements = document.querySelectorAll('[data-activity-id]');
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].getAttribute('data-activity-id') === activityId) {
                    return i + 1;
                }
            }
            return 1;
        },
        
        /**
         * Get optimization statistics
         */
        getStats: function() {
            return {
                visibleElements: this.visibleElements.size,
                pooledBadges: this.elementPool.badges.length,
                pooledContainers: this.elementPool.containers.length,
                metrics: { ...this.metrics },
                config: { ...this.config }
            };
        },
        
        /**
         * Cleanup resources
         */
        destroy: function() {
            const self = this;
            
            // Disconnect observers
            if (self.intersectionObserver) {
                self.intersectionObserver.disconnect();
                self.intersectionObserver = null;
            }
            
            if (self.observer) {
                self.observer.disconnect();
                self.observer = null;
            }
            
            // Clear element pools
            self.elementPool.badges = [];
            self.elementPool.containers = [];
            
            // Clear visible elements tracking
            self.visibleElements.clear();
            
            // Reset state
            self.isInitialized = false;
        }
    };
    
    // Export to global scope
    window.VirtualScrollOptimizer = VirtualScrollOptimizer;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            VirtualScrollOptimizer.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => VirtualScrollOptimizer.init(), 100);
    }
    
})();