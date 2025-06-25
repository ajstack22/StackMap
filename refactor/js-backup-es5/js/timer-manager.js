/**
 * Timer Manager for StackMap
 * Centralizes timer management to prevent memory leaks
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    const TimerManager = {
        // Registry of all active timers
        timers: {},
        timerCounter: 0,
        
        /**
         * Set a managed timeout
         */
        setTimeout: function(callback, delay, context) {
            const self = this;
            const timerId = ++self.timerCounter;
            
            // Wrap callback to clean up after execution
            const wrappedCallback = function() {
                delete self.timers[timerId];
                
                // Extract minimal data to prevent closure retention
                const minimalContext = context ? self.extractMinimalData(context) : null;
                
                try {
                    callback.call(null, minimalContext);
                } catch (error) {
                    console.error('Timer callback error:', error);
                }
            };
            
            const timeoutId = setTimeout(wrappedCallback, delay);
            
            self.timers[timerId] = {
                type: 'timeout',
                id: timeoutId,
                created: Date.now(),
                delay: delay
            };
            
            return timerId;
        },
        
        /**
         * Set a managed interval
         */
        setInterval: function(callback, delay, context) {
            const self = this;
            const timerId = ++self.timerCounter;
            
            // Wrap callback to minimize closure retention
            const wrappedCallback = function() {
                // Extract minimal data to prevent closure retention
                const minimalContext = context ? self.extractMinimalData(context) : null;
                
                try {
                    callback.call(null, minimalContext);
                } catch (error) {
                    console.error('Timer callback error:', error);
                    // Clear interval on error
                    self.clearInterval(timerId);
                }
            };
            
            const intervalId = setInterval(wrappedCallback, delay);
            
            self.timers[timerId] = {
                type: 'interval',
                id: intervalId,
                created: Date.now(),
                delay: delay
            };
            
            return timerId;
        },
        
        /**
         * Clear a managed timeout
         */
        clearTimeout: function(timerId) {
            const self = this;
            const timer = self.timers[timerId];
            
            if (timer && timer.type === 'timeout') {
                clearTimeout(timer.id);
                delete self.timers[timerId];
                return true;
            }
            
            return false;
        },
        
        /**
         * Clear a managed interval
         */
        clearInterval: function(timerId) {
            const self = this;
            const timer = self.timers[timerId];
            
            if (timer && timer.type === 'interval') {
                clearInterval(timer.id);
                delete self.timers[timerId];
                return true;
            }
            
            return false;
        },
        
        /**
         * Clear a timer (works for both timeout and interval)
         */
        clear: function(timerId) {
            const self = this;
            const timer = self.timers[timerId];
            
            if (!timer) return false;
            
            if (timer.type === 'timeout') {
                clearTimeout(timer.id);
            } else if (timer.type === 'interval') {
                clearInterval(timer.id);
            }
            
            delete self.timers[timerId];
            return true;
        },
        
        /**
         * Clear all timers for a specific context
         */
        clearByContext: function(contextName) {
            const self = this;
            let cleared = 0;
            
            for (const timerId in self.timers) {
                if (self.timers.hasOwnProperty(timerId)) {
                    const timer = self.timers[timerId];
                    if (timer.context === contextName) {
                        self.clear(timerId);
                        cleared++;
                    }
                }
            }
            
            return cleared;
        },
        
        /**
         * Clear all timers
         */
        clearAll: function() {
            const self = this;
            let cleared = 0;
            
            for (const timerId in self.timers) {
                if (self.timers.hasOwnProperty(timerId)) {
                    self.clear(timerId);
                    cleared++;
                }
            }
            
            console.log('TimerManager: Cleared', cleared, 'timers');
            return cleared;
        },
        
        /**
         * Extract minimal data from context to prevent closure retention
         */
        extractMinimalData: function(context) {
            if (!context) return null;
            
            // For primitive types, return as-is
            if (typeof context !== 'object') {
                return context;
            }
            
            // For objects, extract only essential data
            const minimal = {};
            
            // Common task properties
            if (context.id) minimal.id = context.id;
            if (context.title) minimal.title = context.title;
            if (context.completed !== undefined) minimal.completed = context.completed;
            
            // Don't copy DOM references or functions
            for (const key in context) {
                if (context.hasOwnProperty(key)) {
                    const value = context[key];
                    const type = typeof value;
                    
                    // Skip DOM elements, functions, and large objects
                    if (type === 'string' || type === 'number' || type === 'boolean') {
                        minimal[key] = value;
                    }
                }
            }
            
            return minimal;
        },
        
        /**
         * Get timer statistics
         */
        getStats: function() {
            const self = this;
            const stats = {
                total: 0,
                timeouts: 0,
                intervals: 0,
                oldestAge: 0
            };
            
            const now = Date.now();
            
            for (const timerId in self.timers) {
                if (self.timers.hasOwnProperty(timerId)) {
                    const timer = self.timers[timerId];
                    stats.total++;
                    
                    if (timer.type === 'timeout') {
                        stats.timeouts++;
                    } else if (timer.type === 'interval') {
                        stats.intervals++;
                    }
                    
                    const age = now - timer.created;
                    if (age > stats.oldestAge) {
                        stats.oldestAge = age;
                    }
                }
            }
            
            return stats;
        },
        
        /**
         * Monitor for leaked timers
         */
        startMonitoring: function(interval) {
            const self = this;
            
            // Default to 30 seconds
            interval = interval || 30000;
            
            self.monitoringInterval = setInterval(function() {
                const stats = self.getStats();
                
                if (stats.total > 50) {
                    console.warn('TimerManager: High timer count:', stats.total);
                }
                
                if (stats.oldestAge > 300000) { // 5 minutes
                    console.warn('TimerManager: Old timer detected:', Math.floor(stats.oldestAge / 1000), 'seconds');
                }
                
                // Log stats if memory monitor is in warning state
                if (window.MemoryMonitor && window.MemoryMonitor.isWarning()) {
                    console.log('TimerManager stats:', stats);
                }
            }, interval);
        },
        
        /**
         * Stop monitoring
         */
        stopMonitoring: function() {
            const self = this;
            
            if (self.monitoringInterval) {
                clearInterval(self.monitoringInterval);
                self.monitoringInterval = null;
            }
        }
    };
    
    // Start monitoring on initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Check if feature is enabled
            if (window.FeatureFlags && window.FeatureFlags.isEnabled('timerManagement')) {
                TimerManager.startMonitoring();
            }
        });
    } else {
        // Check if feature is enabled
        if (window.FeatureFlags && window.FeatureFlags.isEnabled('timerManagement')) {
            TimerManager.startMonitoring();
        }
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        TimerManager.clearAll();
    });
    
    // Expose to global scope
    window.TimerManager = TimerManager;
})();