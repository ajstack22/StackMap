/**
 * Performance Monitor - Story #101 Performance Optimization
 * Provides comprehensive performance measurement and monitoring
 * for mobile-first ADHD/autism accommodating interfaces
 */

(function() {
    'use strict';
    
    const PerformanceMonitor = {
        isInitialized: false,
        measurements: new Map(),
        observers: new Map(),
        frameRate: {
            frames: 0,
            lastTime: 0,
            fps: 60,
            targetFPS: 60
        },
        memory: {
            samples: [],
            maxSamples: 100,
            lastCheck: 0,
            checkInterval: 5000 // 5 seconds
        },
        
        // Performance targets from story requirements
        targets: {
            badgeRenderTime: 5,     // ms per badge
            modeToggleTime: 100,    // ms for mode switch
            touchResponseTime: 100, // ms touch to feedback
            animationFPS: 60,       // frames per second
            memoryGrowthMB: 2,      // MB per 1000 activities
            appStartupTime: 2000    // ms
        },
        
        // Measurement storage
        metrics: {
            badgeCreation: [],
            modeToggle: [],
            touchResponse: [],
            frameRates: [],
            memoryUsage: []
        },
        
        /**
         * Initialize performance monitoring
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            try {
                // Setup performance observers
                self.setupPerformanceObservers();
                
                // Start frame rate monitoring
                self.startFrameRateMonitoring();
                
                // Start memory monitoring
                self.startMemoryMonitoring();
                
                // Listen for specific performance events
                self.setupEventListeners();
                
                self.isInitialized = true;
                console.log('PerformanceMonitor: Initialized with targets:', self.targets);
                
                // Mark app startup complete
                self.mark('app-startup-complete');
                
            } catch (error) {
                console.error('PerformanceMonitor: Failed to initialize:', error);
            }
        },
        
        /**
         * Mark a performance point
         */
        mark: function(name) {
            try {
                if (performance && performance.mark) {
                    performance.mark(name);
                }
                
                // Store timestamp for manual fallback
                this.measurements.set(name, performance.now());
                
            } catch (error) {
                console.warn('PerformanceMonitor: Failed to mark:', name, error);
            }
        },
        
        /**
         * Measure time between two marks
         */
        measure: function(name, startMark, endMark) {
            try {
                let duration;
                
                if (performance && performance.measure) {
                    performance.measure(name, startMark, endMark);
                    
                    // Get the measurement
                    const entries = performance.getEntriesByName(name, 'measure');
                    if (entries.length > 0) {
                        duration = entries[entries.length - 1].duration;
                    }
                } else {
                    // Manual fallback
                    const startTime = this.measurements.get(startMark);
                    const endTime = this.measurements.get(endMark);
                    if (startTime !== undefined && endTime !== undefined) {
                        duration = endTime - startTime;
                    }
                }
                
                if (duration !== undefined) {
                    // Store measurement for analysis
                    this.storeMeasurement(name, duration);
                    return duration;
                }
                
            } catch (error) {
                console.warn('PerformanceMonitor: Failed to measure:', name, error);
            }
            
            return null;
        },
        
        /**
         * Store measurement for analysis
         */
        storeMeasurement: function(name, duration) {
            // Categorize measurements
            if (name.includes('badge')) {
                this.metrics.badgeCreation.push({ time: Date.now(), duration });
                // Keep only last 100 measurements
                if (this.metrics.badgeCreation.length > 100) {
                    this.metrics.badgeCreation.shift();
                }
            } else if (name.includes('mode-toggle')) {
                this.metrics.modeToggle.push({ time: Date.now(), duration });
                if (this.metrics.modeToggle.length > 50) {
                    this.metrics.modeToggle.shift();
                }
            } else if (name.includes('touch')) {
                this.metrics.touchResponse.push({ time: Date.now(), duration });
                if (this.metrics.touchResponse.length > 100) {
                    this.metrics.touchResponse.shift();
                }
            }
        },
        
        /**
         * Setup Performance API observers
         */
        setupPerformanceObservers: function() {
            const self = this;
            
            try {
                // Observe Long Tasks (blocking operations > 50ms)
                if ('PerformanceObserver' in window) {
                    const longTaskObserver = new PerformanceObserver(function(list) {
                        list.getEntries().forEach(function(entry) {
                            if (entry.duration > 50) {
                                console.warn('Long task detected:', entry.duration + 'ms', entry);
                                self.reportPerformanceIssue('long-task', entry.duration);
                            }
                        });
                    });
                    
                    try {
                        longTaskObserver.observe({ entryTypes: ['longtask'] });
                        self.observers.set('longtask', longTaskObserver);
                    } catch (e) {
                        console.log('Long task observation not supported');
                    }
                    
                    // Observe Layout Shifts
                    const layoutShiftObserver = new PerformanceObserver(function(list) {
                        list.getEntries().forEach(function(entry) {
                            if (entry.value > 0.1) {
                                console.warn('Layout shift detected:', entry.value, entry);
                                self.reportPerformanceIssue('layout-shift', entry.value);
                            }
                        });
                    });
                    
                    try {
                        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
                        self.observers.set('layout-shift', layoutShiftObserver);
                    } catch (e) {
                        console.log('Layout shift observation not supported');
                    }
                }
                
            } catch (error) {
                console.warn('PerformanceMonitor: Observer setup failed:', error);
            }
        },
        
        /**
         * Start frame rate monitoring
         */
        startFrameRateMonitoring: function() {
            const self = this;
            
            let frameCount = 0;
            let lastTime = performance.now();
            
            function countFrame() {
                frameCount++;
                const currentTime = performance.now();
                
                // Calculate FPS every second
                if (currentTime - lastTime >= 1000) {
                    const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                    self.frameRate.fps = fps;
                    
                    // Store FPS measurement
                    self.metrics.frameRates.push({ time: Date.now(), fps });
                    if (self.metrics.frameRates.length > 60) {
                        self.metrics.frameRates.shift();
                    }
                    
                    // Check if FPS is below target
                    if (fps < self.targets.animationFPS * 0.8) {
                        self.reportPerformanceIssue('low-fps', fps);
                    }
                    
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                requestAnimationFrame(countFrame);
            }
            
            requestAnimationFrame(countFrame);
        },
        
        /**
         * Start memory monitoring
         */
        startMemoryMonitoring: function() {
            const self = this;
            
            function checkMemory() {
                try {
                    let memoryInfo = null;
                    
                    // Try different memory APIs
                    if (performance.memory) {
                        memoryInfo = {
                            used: performance.memory.usedJSHeapSize,
                            total: performance.memory.totalJSHeapSize,
                            limit: performance.memory.jsHeapSizeLimit
                        };
                    } else if (navigator.deviceMemory) {
                        // Rough estimate based on device memory
                        memoryInfo = {
                            deviceMemory: navigator.deviceMemory,
                            estimated: true
                        };
                    }
                    
                    if (memoryInfo) {
                        self.memory.samples.push({
                            time: Date.now(),
                            ...memoryInfo
                        });
                        
                        // Keep only recent samples
                        if (self.memory.samples.length > self.memory.maxSamples) {
                            self.memory.samples.shift();
                        }
                        
                        // Check for memory growth
                        if (self.memory.samples.length > 10) {
                            const recent = self.memory.samples.slice(-10);
                            const growth = recent[recent.length - 1].used - recent[0].used;
                            const growthMB = growth / (1024 * 1024);
                            
                            if (growthMB > 5) { // 5MB growth in 10 samples
                                self.reportPerformanceIssue('memory-growth', growthMB);
                            }
                        }
                    }
                    
                } catch (error) {
                    console.warn('Memory monitoring error:', error);
                }
                
                setTimeout(checkMemory, self.memory.checkInterval);
            }
            
            setTimeout(checkMemory, self.memory.checkInterval);
        },
        
        /**
         * Setup event listeners for specific measurements
         */
        setupEventListeners: function() {
            const self = this;
            
            // Badge creation timing
            document.addEventListener('badgeCreationStart', function(e) {
                self.mark(`badge-creation-start-${e.detail.activityId}`);
            });
            
            document.addEventListener('badgeCreationEnd', function(e) {
                const activityId = e.detail.activityId;
                self.mark(`badge-creation-end-${activityId}`);
                const duration = self.measure(
                    `badge-creation-${activityId}`,
                    `badge-creation-start-${activityId}`,
                    `badge-creation-end-${activityId}`
                );
                
                if (duration > self.targets.badgeRenderTime) {
                    self.reportPerformanceIssue('slow-badge-creation', duration);
                }
            });
            
            // Mode toggle timing
            document.addEventListener('modeToggleStart', function() {
                self.mark('mode-toggle-start');
            });
            
            document.addEventListener('modeToggleEnd', function() {
                self.mark('mode-toggle-end');
                const duration = self.measure('mode-toggle', 'mode-toggle-start', 'mode-toggle-end');
                
                if (duration > self.targets.modeToggleTime) {
                    self.reportPerformanceIssue('slow-mode-toggle', duration);
                }
            });
            
            // Touch response timing
            document.addEventListener('touchstart', function(e) {
                if (e.target.closest('.activity-badge, .display-mode-toggle')) {
                    self.mark('touch-start');
                }
            });
            
            document.addEventListener('touchend', function(e) {
                if (e.target.closest('.activity-badge, .display-mode-toggle')) {
                    self.mark('touch-end');
                    const duration = self.measure('touch-response', 'touch-start', 'touch-end');
                    
                    if (duration > self.targets.touchResponseTime) {
                        self.reportPerformanceIssue('slow-touch-response', duration);
                    }
                }
            });
        },
        
        /**
         * Report performance issue
         */
        reportPerformanceIssue: function(type, value) {
            const report = {
                type: type,
                value: value,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
            
            console.warn('Performance issue detected:', report);
            
            // Dispatch event for other systems to handle
            document.dispatchEvent(new CustomEvent('performanceIssue', {
                detail: report
            }));
        },
        
        /**
         * Get performance summary
         */
        getPerformanceSummary: function() {
            const self = this;
            
            return {
                targets: self.targets,
                currentFPS: self.frameRate.fps,
                measurements: {
                    badgeCreation: self.getMetricSummary(self.metrics.badgeCreation),
                    modeToggle: self.getMetricSummary(self.metrics.modeToggle),
                    touchResponse: self.getMetricSummary(self.metrics.touchResponse),
                    frameRates: self.getMetricSummary(self.metrics.frameRates, 'fps')
                },
                memory: {
                    current: self.memory.samples.length > 0 ? 
                        self.memory.samples[self.memory.samples.length - 1] : null,
                    trend: self.getMemoryTrend()
                },
                timestamp: Date.now()
            };
        },
        
        /**
         * Get metric summary statistics
         */
        getMetricSummary: function(metrics, valueKey = 'duration') {
            if (metrics.length === 0) {
                return { count: 0 };
            }
            
            const values = metrics.map(m => m[valueKey]);
            values.sort((a, b) => a - b);
            
            return {
                count: values.length,
                min: values[0],
                max: values[values.length - 1],
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                median: values[Math.floor(values.length / 2)],
                p95: values[Math.floor(values.length * 0.95)]
            };
        },
        
        /**
         * Get memory usage trend
         */
        getMemoryTrend: function() {
            if (this.memory.samples.length < 2) {
                return 'insufficient-data';
            }
            
            const recent = this.memory.samples.slice(-10);
            const start = recent[0].used || 0;
            const end = recent[recent.length - 1].used || 0;
            const growthMB = (end - start) / (1024 * 1024);
            
            if (growthMB > 2) return 'increasing';
            if (growthMB < -0.5) return 'decreasing';
            return 'stable';
        },
        
        /**
         * Export performance data
         */
        exportData: function() {
            return {
                summary: this.getPerformanceSummary(),
                rawMetrics: this.metrics,
                memoryHistory: this.memory.samples,
                timestamp: Date.now(),
                version: '1.0.0'
            };
        },
        
        /**
         * Cleanup resources
         */
        destroy: function() {
            // Disconnect observers
            this.observers.forEach(function(observer) {
                observer.disconnect();
            });
            this.observers.clear();
            
            // Clear measurements
            this.measurements.clear();
            
            // Reset state
            this.isInitialized = false;
        }
    };
    
    // Export to global scope
    window.PerformanceMonitor = PerformanceMonitor;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            PerformanceMonitor.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => PerformanceMonitor.init(), 100);
    }
    
})();