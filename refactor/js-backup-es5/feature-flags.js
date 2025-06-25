/**
 * Feature Flags for StackMap
 * Allows gradual rollout of performance optimizations
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    var FeatureFlags = {
        // Default feature flags
        defaultFlags: {
            // Memory optimizations
            taskCardPool: false,        // Object pooling for task cards
            timerManagement: false,     // Centralized timer management
            aggressiveCleanup: false,   // More aggressive DOM cleanup
            
            // Performance features
            virtualScrolling: true,     // Already tested and stable
            lazyLoading: true,         // Progressive activity loading
            documentFragments: true,    // Batch DOM operations
            
            // Monitoring
            memoryMonitoring: true,     // Memory usage tracking
            performanceMetrics: false,  // Detailed performance logging
            
            // UI features
            grownupMode: true,         // Math protection for edit mode
            celebrations: true,        // Task completion animations
            
            // Rollout percentages (0-100)
            rolloutPercentages: {
                taskCardPool: 10,      // Start with 10% of users
                timerManagement: 20,   // 20% rollout
                aggressiveCleanup: 5   // 5% initial rollout
            }
        },
        
        // Current flags (loaded from storage or defaults)
        flags: {},
        
        // User ID for consistent rollout
        userId: null,
        
        /**
         * Initialize feature flags
         */
        init: function() {
            var self = this;
            
            // Get or generate user ID
            self.userId = self.getUserId();
            
            // Load flags from storage
            self.loadFlags();
            
            // Check for URL overrides
            self.checkUrlOverrides();
            
            // Apply rollout percentages
            self.applyRolloutPercentages();
            
            // Log active features
            self.logActiveFeatures();
        },
        
        /**
         * Get or generate user ID for consistent rollout
         */
        getUserId: function() {
            var userId = localStorage.getItem('stackmap_feature_user_id');
            
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).substr(2, 9);
                try {
                    localStorage.setItem('stackmap_feature_user_id', userId);
                } catch (e) {
                    console.warn('FeatureFlags: Could not save user ID');
                }
            }
            
            return userId;
        },
        
        /**
         * Load flags from storage
         */
        loadFlags: function() {
            var self = this;
            
            try {
                var stored = localStorage.getItem('stackmap_feature_flags');
                if (stored) {
                    var parsed = JSON.parse(stored);
                    // Merge with defaults
                    for (var key in self.defaultFlags) {
                        if (self.defaultFlags.hasOwnProperty(key)) {
                            self.flags[key] = parsed.hasOwnProperty(key) ? 
                                parsed[key] : self.defaultFlags[key];
                        }
                    }
                } else {
                    // Use defaults
                    self.flags = JSON.parse(JSON.stringify(self.defaultFlags));
                }
            } catch (e) {
                console.warn('FeatureFlags: Could not load flags, using defaults');
                self.flags = JSON.parse(JSON.stringify(self.defaultFlags));
            }
        },
        
        /**
         * Save flags to storage
         */
        saveFlags: function() {
            var self = this;
            
            try {
                localStorage.setItem('stackmap_feature_flags', JSON.stringify(self.flags));
            } catch (e) {
                console.warn('FeatureFlags: Could not save flags');
            }
        },
        
        /**
         * Check for URL parameter overrides
         */
        checkUrlOverrides: function() {
            var self = this;
            var params = new URLSearchParams(window.location.search);
            
            // Check each flag for URL override
            for (var flag in self.flags) {
                if (self.flags.hasOwnProperty(flag) && params.has('ff_' + flag)) {
                    var value = params.get('ff_' + flag);
                    self.flags[flag] = value === 'true' || value === '1';
                    console.log('FeatureFlags: Override', flag, '=', self.flags[flag]);
                }
            }
            
            // Special debug mode
            if (params.has('ff_debug')) {
                self.flags.performanceMetrics = true;
                console.log('FeatureFlags: Debug mode enabled');
            }
        },
        
        /**
         * Apply rollout percentages
         */
        applyRolloutPercentages: function() {
            var self = this;
            
            if (!self.flags.rolloutPercentages) return;
            
            var percentages = self.flags.rolloutPercentages;
            
            for (var flag in percentages) {
                if (percentages.hasOwnProperty(flag)) {
                    var percentage = percentages[flag];
                    
                    // Use consistent hash for user
                    var hash = self.hashCode(self.userId + flag);
                    var bucket = Math.abs(hash) % 100;
                    
                    // Enable if user is in rollout percentage
                    if (bucket < percentage) {
                        self.flags[flag] = true;
                        console.log('FeatureFlags: User in rollout for', flag);
                    }
                }
            }
        },
        
        /**
         * Simple hash function for consistent bucketing
         */
        hashCode: function(str) {
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
                var char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash;
        },
        
        /**
         * Check if feature is enabled
         */
        isEnabled: function(flagName) {
            var self = this;
            return self.flags[flagName] === true;
        },
        
        /**
         * Enable a feature
         */
        enable: function(flagName) {
            var self = this;
            
            if (self.flags.hasOwnProperty(flagName)) {
                self.flags[flagName] = true;
                self.saveFlags();
                console.log('FeatureFlags: Enabled', flagName);
                return true;
            }
            
            return false;
        },
        
        /**
         * Disable a feature
         */
        disable: function(flagName) {
            var self = this;
            
            if (self.flags.hasOwnProperty(flagName)) {
                self.flags[flagName] = false;
                self.saveFlags();
                console.log('FeatureFlags: Disabled', flagName);
                return true;
            }
            
            return false;
        },
        
        /**
         * Get all active features
         */
        getActiveFeatures: function() {
            var self = this;
            var active = [];
            
            for (var flag in self.flags) {
                if (self.flags.hasOwnProperty(flag) && 
                    self.flags[flag] === true && 
                    flag !== 'rolloutPercentages') {
                    active.push(flag);
                }
            }
            
            return active;
        },
        
        /**
         * Log active features
         */
        logActiveFeatures: function() {
            var self = this;
            var active = self.getActiveFeatures();
            
            if (active.length > 0) {
                console.log('FeatureFlags: Active features:', active.join(', '));
            }
        },
        
        /**
         * Send telemetry about feature usage
         */
        sendTelemetry: function() {
            var self = this;
            
            // Only send if performance metrics enabled
            if (!self.flags.performanceMetrics) return;
            
            var telemetry = {
                userId: self.userId,
                features: self.getActiveFeatures(),
                memory: window.MemoryMonitor ? window.MemoryMonitor.getStats() : null,
                timers: window.TimerManager ? window.TimerManager.getStats() : null,
                timestamp: new Date().toISOString()
            };
            
            // In a real app, this would send to analytics
            console.log('FeatureFlags: Telemetry', telemetry);
            
            // Store locally for debugging
            try {
                var history = JSON.parse(localStorage.getItem('stackmap_telemetry') || '[]');
                history.push(telemetry);
                
                // Keep only last 10 entries
                if (history.length > 10) {
                    history = history.slice(-10);
                }
                
                localStorage.setItem('stackmap_telemetry', JSON.stringify(history));
            } catch (e) {
                // Ignore storage errors
            }
        }
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            FeatureFlags.init();
        });
    } else {
        FeatureFlags.init();
    }
    
    // Send telemetry periodically if enabled
    setInterval(function() {
        FeatureFlags.sendTelemetry();
    }, 60000); // Every minute
    
    // Expose to global scope
    window.FeatureFlags = FeatureFlags;
})();