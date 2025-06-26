/**
 * User Data Manager - Story #107 User Data Separation
 * Handles user-specific data operations with proper isolation
 * Provides user-aware CRUD operations for activities
 */

(function() {
    'use strict';
    
    const UserDataManager = {
        isInitialized: false,
        
        // Activity count limits per user
        limits: {
            maxActivitiesPerUser: 50,
            maxUsersTotal: 20
        },
        
        // Cache for performance
        cache: new Map(),
        cacheTimeout: 30000, // 30 seconds
        
        /**
         * Initialize user data manager
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            try {
                // Setup event listeners
                self.setupEventListeners();
                
                // Initialize performance monitoring
                self.setupPerformanceMonitoring();
                
                self.isInitialized = true;
                console.log('UserDataManager: Initialized');
                
            } catch (error) {
                console.error('UserDataManager: Failed to initialize:', error);
            }
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for user context changes
            document.addEventListener('userSwitched', function(e) {
                const { previousUserId, currentUserId } = e.detail;
                self.handleUserSwitch(previousUserId, currentUserId);
            });
            
            // Listen for user deletion
            document.addEventListener('userDeleted', function(e) {
                const { userId } = e.detail;
                self.cleanupUserData(userId);
            });
            
            // Memory management integration
            if (window.MemoryManager) {
                window.MemoryManager.registerCleanup(function() {
                    self.clearCache();
                });
            }
        },
        
        /**
         * Setup performance monitoring
         */
        setupPerformanceMonitoring: function() {
            // Integrate with existing performance monitor
            if (window.PerformanceMonitor) {
                // Monitor user data operations
                document.addEventListener('userDataOperation', function(e) {
                    const { operation, duration, userId } = e.detail;
                    if (duration > 50) { // Log slow operations
                        console.warn(`UserDataManager: Slow ${operation} for user ${userId}: ${duration}ms`);
                    }
                });
            }
        },
        
        /**
         * Get user activities for specific timeframe
         */
        getUserActivities: function(userId, timeframe) {
            const self = this;
            
            if (!userId) {
                console.error('UserDataManager: userId required');
                return [];
            }
            
            const startTime = performance.now();
            
            try {
                // Get user data
                const userData = self.getUserData(userId);
                if (!userData || !userData.activities) {
                    return [];
                }
                
                // Return activities for specified timeframe
                const activities = userData.activities[timeframe] || [];
                
                // Performance monitoring
                const duration = performance.now() - startTime;
                document.dispatchEvent(new CustomEvent('userDataOperation', {
                    detail: { operation: 'getUserActivities', duration, userId, timeframe }
                }));
                
                return activities;
                
            } catch (error) {
                console.error('UserDataManager: Failed to get user activities:', error);
                return [];
            }
        },
        
        /**
         * Set user activities for specific timeframe
         */
        setUserActivities: function(userId, timeframe, activities) {
            const self = this;
            
            if (!userId || !timeframe || !Array.isArray(activities)) {
                console.error('UserDataManager: Invalid parameters for setUserActivities');
                return false;
            }
            
            const startTime = performance.now();
            
            try {
                // Validate activity count
                if (activities.length > self.limits.maxActivitiesPerUser) {
                    console.warn(`UserDataManager: Too many activities for user ${userId}: ${activities.length}`);
                    activities = activities.slice(0, self.limits.maxActivitiesPerUser);
                }
                
                // Get or create user data
                let userData = self.getUserData(userId);
                if (!userData) {
                    userData = self.createUserData(userId);
                }
                
                // Ensure userId is set on all activities
                activities.forEach(activity => {
                    if (!activity.userId) {
                        activity.userId = userId;
                    }
                });
                
                // Update activities
                userData.activities[timeframe] = activities;
                
                // Update activity counts
                self.updateActivityCounts(userData);
                
                // Save user data
                const saved = self.setUserData(userId, userData);
                
                if (saved) {
                    // Clear cache for this user
                    self.invalidateUserCache(userId);
                    
                    // Dispatch update event
                    document.dispatchEvent(new CustomEvent('userActivitiesUpdated', {
                        detail: { userId, timeframe, count: activities.length }
                    }));
                }
                
                // Performance monitoring
                const duration = performance.now() - startTime;
                document.dispatchEvent(new CustomEvent('userDataOperation', {
                    detail: { operation: 'setUserActivities', duration, userId, timeframe }
                }));
                
                return saved;
                
            } catch (error) {
                console.error('UserDataManager: Failed to set user activities:', error);
                return false;
            }
        },
        
        /**
         * Add activity to user's list
         */
        addActivity: function(userId, activity, timeframe) {
            const self = this;
            
            if (!userId || !activity || !timeframe) {
                console.error('UserDataManager: Invalid parameters for addActivity');
                return false;
            }
            
            try {
                // Get current activities
                const activities = self.getUserActivities(userId, timeframe);
                
                // Check activity limit
                if (activities.length >= self.limits.maxActivitiesPerUser) {
                    console.warn(`UserDataManager: Activity limit reached for user ${userId}`);
                    return false;
                }
                
                // Ensure activity has required fields
                activity.userId = userId;
                activity.timeframe = timeframe;
                if (!activity.id) {
                    activity.id = Date.now() + Math.random(); // Simple ID generation
                }
                if (!activity.created_at) {
                    activity.created_at = new Date().toISOString();
                }
                activity.updated_at = new Date().toISOString();
                
                // Add to activities
                activities.push(activity);
                
                // Save back
                return self.setUserActivities(userId, timeframe, activities);
                
            } catch (error) {
                console.error('UserDataManager: Failed to add activity:', error);
                return false;
            }
        },
        
        /**
         * Remove activity from user's list
         */
        removeActivity: function(userId, activityId) {
            const self = this;
            
            if (!userId || !activityId) {
                console.error('UserDataManager: Invalid parameters for removeActivity');
                return false;
            }
            
            try {
                // Check both timeframes
                const timeframes = ['today', 'tomorrow'];
                let removed = false;
                
                for (const timeframe of timeframes) {
                    const activities = self.getUserActivities(userId, timeframe);
                    const filteredActivities = activities.filter(activity => activity.id !== activityId);
                    
                    if (filteredActivities.length !== activities.length) {
                        // Activity was found and removed
                        self.setUserActivities(userId, timeframe, filteredActivities);
                        removed = true;
                        
                        // Clear badge cache for this activity
                        if (window.BadgeCache) {
                            window.BadgeCache.invalidateActivity(activityId);
                        }
                        
                        break;
                    }
                }
                
                return removed;
                
            } catch (error) {
                console.error('UserDataManager: Failed to remove activity:', error);
                return false;
            }
        },
        
        /**
         * Update specific activity
         */
        updateActivity: function(userId, activityId, updates) {
            const self = this;
            
            if (!userId || !activityId || !updates) {
                console.error('UserDataManager: Invalid parameters for updateActivity');
                return false;
            }
            
            try {
                // Find and update activity in both timeframes
                const timeframes = ['today', 'tomorrow'];
                let updated = false;
                
                for (const timeframe of timeframes) {
                    const activities = self.getUserActivities(userId, timeframe);
                    const activityIndex = activities.findIndex(activity => activity.id === activityId);
                    
                    if (activityIndex !== -1) {
                        // Update activity
                        const activity = activities[activityIndex];
                        Object.assign(activity, updates);
                        activity.updated_at = new Date().toISOString();
                        activity.userId = userId; // Ensure userId is maintained
                        
                        // Save back
                        self.setUserActivities(userId, timeframe, activities);
                        updated = true;
                        
                        // Clear badge cache for this activity
                        if (window.BadgeCache) {
                            window.BadgeCache.invalidateActivity(activityId);
                        }
                        
                        break;
                    }
                }
                
                return updated;
                
            } catch (error) {
                console.error('UserDataManager: Failed to update activity:', error);
                return false;
            }
        },
        
        /**
         * Get specific activity by ID
         */
        getActivity: function(userId, activityId) {
            const self = this;
            
            if (!userId || !activityId) {
                return null;
            }
            
            try {
                // Search in both timeframes
                const timeframes = ['today', 'tomorrow'];
                
                for (const timeframe of timeframes) {
                    const activities = self.getUserActivities(userId, timeframe);
                    const activity = activities.find(activity => activity.id === activityId);
                    
                    if (activity) {
                        return activity;
                    }
                }
                
                return null;
                
            } catch (error) {
                console.error('UserDataManager: Failed to get activity:', error);
                return null;
            }
        },
        
        /**
         * Move activity between timeframes
         */
        moveActivity: function(userId, activityId, fromTimeframe, toTimeframe) {
            const self = this;
            
            if (!userId || !activityId || !fromTimeframe || !toTimeframe) {
                console.error('UserDataManager: Invalid parameters for moveActivity');
                return false;
            }
            
            try {
                // Get activity from source timeframe
                const sourceActivities = self.getUserActivities(userId, fromTimeframe);
                const activityIndex = sourceActivities.findIndex(activity => activity.id === activityId);
                
                if (activityIndex === -1) {
                    console.warn('UserDataManager: Activity not found in source timeframe');
                    return false;
                }
                
                // Remove from source
                const activity = sourceActivities.splice(activityIndex, 1)[0];
                
                // Update activity timeframe
                activity.timeframe = toTimeframe;
                activity.updated_at = new Date().toISOString();
                
                // Add to destination
                const destActivities = self.getUserActivities(userId, toTimeframe);
                
                // Check destination limit
                if (destActivities.length >= self.limits.maxActivitiesPerUser) {
                    // Restore to source
                    sourceActivities.splice(activityIndex, 0, activity);
                    activity.timeframe = fromTimeframe;
                    console.warn('UserDataManager: Destination timeframe at capacity');
                    return false;
                }
                
                destActivities.push(activity);
                
                // Save both timeframes
                const sourceSuccess = self.setUserActivities(userId, fromTimeframe, sourceActivities);
                const destSuccess = self.setUserActivities(userId, toTimeframe, destActivities);
                
                return sourceSuccess && destSuccess;
                
            } catch (error) {
                console.error('UserDataManager: Failed to move activity:', error);
                return false;
            }
        },
        
        /**
         * Get user data from storage (via UserContext)
         */
        getUserData: function(userId) {
            if (!window.UserContext) {
                console.error('UserDataManager: UserContext not available');
                return null;
            }
            
            return window.UserContext.getUserData(userId);
        },
        
        /**
         * Set user data to storage (via UserContext)
         */
        setUserData: function(userId, userData) {
            if (!window.UserContext) {
                console.error('UserDataManager: UserContext not available');
                return false;
            }
            
            return window.UserContext.setUserData(userId, userData);
        },
        
        /**
         * Create initial user data structure
         */
        createUserData: function(userId) {
            return {
                userId: userId,
                activities: {
                    today: [],
                    tomorrow: []
                },
                customTitle: 'StackMap',
                activityCount: {
                    today: 0,
                    tomorrow: 0,
                    total: 0
                },
                lastActive: Date.now(),
                created: Date.now()
            };
        },
        
        /**
         * Update activity counts in user data
         */
        updateActivityCounts: function(userData) {
            if (!userData || !userData.activities) return;
            
            userData.activityCount = {
                today: userData.activities.today ? userData.activities.today.length : 0,
                tomorrow: userData.activities.tomorrow ? userData.activities.tomorrow.length : 0,
                total: 0
            };
            
            userData.activityCount.total = userData.activityCount.today + userData.activityCount.tomorrow;
        },
        
        /**
         * Handle user switch
         */
        handleUserSwitch: function(previousUserId, currentUserId) {
            const self = this;
            
            // Clear cache for previous user
            if (previousUserId) {
                self.invalidateUserCache(previousUserId);
            }
            
            // Preload data for current user
            if (currentUserId) {
                self.preloadUserData(currentUserId);
            }
        },
        
        /**
         * Preload user data for performance
         */
        preloadUserData: function(userId) {
            const self = this;
            
            try {
                // Get data to warm cache
                self.getUserActivities(userId, 'today');
                self.getUserActivities(userId, 'tomorrow');
                
                console.log('UserDataManager: Preloaded data for user:', userId);
            } catch (error) {
                console.warn('UserDataManager: Failed to preload user data:', error);
            }
        },
        
        /**
         * Invalidate cache for specific user
         */
        invalidateUserCache: function(userId) {
            // Clear from local cache
            this.cache.delete(userId);
            
            // Clear from UserContext cache
            if (window.UserContext && window.UserContext.userCache) {
                window.UserContext.userCache.delete(userId);
            }
        },
        
        /**
         * Clear all cache
         */
        clearCache: function() {
            this.cache.clear();
            console.log('UserDataManager: Cleared cache');
        },
        
        /**
         * Cleanup user data on deletion
         */
        cleanupUserData: function(userId) {
            const self = this;
            
            try {
                // Clear cache
                self.invalidateUserCache(userId);
                
                // Clear badge cache entries
                if (window.BadgeCache) {
                    window.BadgeCache.clear(); // Clear all since we don't know which activities belong to user
                }
                
                console.log('UserDataManager: Cleaned up data for deleted user:', userId);
                
            } catch (error) {
                console.error('UserDataManager: Failed to cleanup user data:', error);
            }
        },
        
        /**
         * Get user statistics
         */
        getUserStats: function(userId) {
            const self = this;
            
            try {
                const userData = self.getUserData(userId);
                if (!userData) return null;
                
                return {
                    userId: userId,
                    activityCount: userData.activityCount,
                    customTitle: userData.customTitle,
                    lastActive: userData.lastActive,
                    created: userData.created
                };
                
            } catch (error) {
                console.error('UserDataManager: Failed to get user stats:', error);
                return null;
            }
        },
        
        /**
         * Validate user data integrity
         */
        validateUserData: function(userId) {
            const self = this;
            
            try {
                const userData = self.getUserData(userId);
                if (!userData) return false;
                
                // Check basic structure
                if (!userData.activities || !userData.activityCount) {
                    return false;
                }
                
                // Validate activity counts
                const actualCounts = {
                    today: userData.activities.today ? userData.activities.today.length : 0,
                    tomorrow: userData.activities.tomorrow ? userData.activities.tomorrow.length : 0
                };
                actualCounts.total = actualCounts.today + actualCounts.tomorrow;
                
                // Check if counts match
                const countsMatch = 
                    userData.activityCount.today === actualCounts.today &&
                    userData.activityCount.tomorrow === actualCounts.tomorrow &&
                    userData.activityCount.total === actualCounts.total;
                
                if (!countsMatch) {
                    console.warn('UserDataManager: Activity count mismatch for user:', userId);
                    // Auto-fix counts
                    userData.activityCount = actualCounts;
                    self.setUserData(userId, userData);
                }
                
                // Validate each activity has userId
                const timeframes = ['today', 'tomorrow'];
                let hasInvalidActivities = false;
                
                for (const timeframe of timeframes) {
                    const activities = userData.activities[timeframe] || [];
                    activities.forEach(activity => {
                        if (!activity.userId || activity.userId !== userId) {
                            activity.userId = userId;
                            hasInvalidActivities = true;
                        }
                    });
                }
                
                if (hasInvalidActivities) {
                    console.warn('UserDataManager: Fixed activities missing userId for user:', userId);
                    self.setUserData(userId, userData);
                }
                
                return true;
                
            } catch (error) {
                console.error('UserDataManager: Failed to validate user data:', error);
                return false;
            }
        },
        
        /**
         * Get debug information
         */
        getDebugInfo: function() {
            const self = this;
            
            return {
                isInitialized: self.isInitialized,
                cacheSize: self.cache.size,
                limits: self.limits,
                userContext: window.UserContext ? window.UserContext.getDebugInfo() : null
            };
        }
    };
    
    // Export to global scope
    window.UserDataManager = UserDataManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            UserDataManager.init();
        });
    } else {
        // DOM already loaded
        setTimeout(() => UserDataManager.init(), 100);
    }
    
})();