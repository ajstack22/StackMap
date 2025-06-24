/**
 * Feature Flags for StackMap
 * Allows gradual rollout of performance optimizations
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    const FeatureFlags = {
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
            const self = this;
            
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
            let userId = localStorage.getItem('stackmap_feature_user_id');
            
            if (!userId) {
                userId = `user_${Math.random().toString(36).substr(2, 9)}`;
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
            const self = this;
            
            try {
                const stored = localStorage.getItem('stackmap_feature_flags');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Merge with defaults
                    for (const key in self.defaultFlags) {
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
            const self = this;
            
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
            const self = this;
            const params = new URLSearchParams(window.location.search);
            
            // Check each flag for URL override
            for (const flag in self.flags) {
                if (self.flags.hasOwnProperty(flag) && params.has(`ff_${flag}`)) {
                    const value = params.get(`ff_${flag}`);
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
            const self = this;
            
            if (!self.flags.rolloutPercentages) return;
            
            const percentages = self.flags.rolloutPercentages;
            
            for (const flag in percentages) {
                if (percentages.hasOwnProperty(flag)) {
                    const percentage = percentages[flag];
                    
                    // Use consistent hash for user
                    const hash = self.hashCode(self.userId + flag);
                    const bucket = Math.abs(hash) % 100;
                    
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
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash;
        },
        
        /**
         * Check if feature is enabled
         */
        isEnabled: function(flagName) {
            const self = this;
            return self.flags[flagName] === true;
        },
        
        /**
         * Enable a feature
         */
        enable: function(flagName) {
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            const active = [];
            
            for (const flag in self.flags) {
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
            const self = this;
            const active = self.getActiveFeatures();
            
            if (active.length > 0) {
                console.log('FeatureFlags: Active features:', active.join(', '));
            }
        },
        
        /**
         * Send telemetry about feature usage
         */
        sendTelemetry: function() {
            const self = this;
            
            // Only send if performance metrics enabled
            if (!self.flags.performanceMetrics) return;
            
            const telemetry = {
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
                let history = JSON.parse(localStorage.getItem('stackmap_telemetry') || '[]');
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